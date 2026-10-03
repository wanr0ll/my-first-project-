<?php

/**
 * Asset Model Base Class
 * 
 * Helper function for ID generation is now in Request.php
 */

abstract class AssetModel
{
    protected $db;
    protected $table;
    protected $fillable = [];
    protected $mapping = [];

    public function __construct($database)
    {
        $this->db = $database;
    }

    /**
     * Create asset
     */
    /**
     * Process input data: Map fields and filter by whitelist
     */
    protected function processInput($data)
    {
        $processed = [];

        // standard fields always allowed
        $standardFields = ['id', 'name', 'status', 'division', 'approval_status', 'created_at', 'updated_at', 'created_by'];

        // Base mapping for all assets
        $baseMapping = [
            'approvalStatus' => 'approval_status',
            'createdAt' => 'created_at',
            'updatedAt' => 'updated_at',
            'createdBy' => 'created_by'
        ];

        foreach ($data as $key => $value) {
            // Check if key is in standard fields
            if (in_array($key, $standardFields)) {
                $processed[$key] = $value;
                continue;
            }

            // Check base mappings
            if (isset($baseMapping[$key])) {
                $dbKey = $baseMapping[$key];
                $processed[$dbKey] = $value;
                continue;
            }

            // Check if key needs mapping (subclass specific)
            if (isset($this->mapping[$key])) {
                $dbKey = $this->mapping[$key];
                $processed[$dbKey] = $value;
                continue;
            }

            // Check if key is directly in fillable
            if (in_array($key, $this->fillable)) {
                $processed[$key] = $value;
            }
        }

        foreach ($processed as $k => $v) {
            if ($v === '') {
                $processed[$k] = null;
            }
        }

        return $processed;
    }

    /**
     * Create asset
     */
    public function create($data)
    {
        if (!isset($data['id'])) {
            $data['id'] = generateId('A');
        }
        $id = $data['id'];

        // Process input
        $data = $this->processInput($data);

        // Build dynamic query
        $fields = array_keys($data);
        $escapedFields = array_map(function ($f) {
            return "`" . str_replace('`', '``', $f) . "`";
        }, $fields);
        $placeholders = array_fill(0, count($fields), '?');

        $query = "INSERT INTO `" . $this->table . "` (" . implode(', ', $escapedFields) . ") 
                  VALUES (" . implode(', ', $placeholders) . ")";

        $stmt = $this->db->prepare($query);

        if (!$stmt) {
            return ['success' => false, 'message' => 'Prepare failed: ' . $this->db->error];
        }

        $values = array_values($data);
        $types = str_repeat('s', count($values));

        $stmt->bind_param($types, ...$values);

        if ($stmt->execute()) {
            return ['success' => true, 'id' => $id];
        }

        return ['success' => false, 'message' => 'Create failed: ' . $stmt->error];
    }

    /**
     * Update asset
     */
    public function update($id, $data)
    {
        // Process input
        $data = $this->processInput($data);

        // Always stamp the current time as updated_at
        $data['updated_at'] = date('Y-m-d H:i:s');

        $updates = [];
        $params = [];

        foreach ($data as $key => $value) {
            $safeKey = "`" . str_replace('`', '``', $key) . "`";
            $updates[] = "$safeKey = ?";
            $params[] = $value;
        }

        if (empty($updates)) {
            return ['success' => false, 'message' => 'No valid fields to update'];
        }

        $query = "UPDATE `" . $this->table . "` SET " . implode(', ', $updates) . " WHERE `id` = ?";
        $params[] = $id;

        $types = str_repeat('s', count($params));

        $stmt = $this->db->prepare($query);
        $stmt->bind_param($types, ...$params);

        if ($stmt->execute()) {
            return ['success' => true];
        }

        return ['success' => false, 'message' => 'Update failed: ' . $stmt->error];
    }

    // ... (getById, getAll, delete methods remain unchanged)

    /**
     * Get by ID
     */
    public function getById($id)
    {
        $query = "SELECT * FROM " . $this->table . " WHERE id = ? LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param('s', $id);
        $stmt->execute();

        return $stmt->get_result()->fetch_assoc();
    }

    /**
     * Get all with pagination
     */
    public function getAll($page = 1, $per_page = 10, $filters = [])
    {
        $offset = ($page - 1) * $per_page;

        $where = "WHERE 1=1";

        if (!empty($filters['status'])) {
            $where .= " AND status = '" . $this->db->real_escape_string($filters['status']) . "'";
        }

        if (!empty($filters['division'])) {
            $where .= " AND division = '" . $this->db->real_escape_string($filters['division']) . "'";
        }

        if (!empty($filters['search'])) {
            $search = '%' . $this->db->real_escape_string($filters['search']) . '%';
            $where .= " AND name LIKE '" . $search . "'";
        }

        // Get total count
        $count_result = $this->db->query("SELECT COUNT(*) as total FROM " . $this->table . " " . $where);
        $total = $count_result->fetch_assoc()['total'];

        // Get paginated results
        $query = "SELECT * FROM " . $this->table . " " . $where . " 
                  ORDER BY created_at DESC LIMIT " . intval($per_page) . " OFFSET " . intval($offset);

        $result = $this->db->query($query);

        return [
            'total' => $total,
            'data' => $result ? $result->fetch_all(MYSQLI_ASSOC) : []
        ];
    }

    /**
     * Delete asset
     */
    public function delete($id)
    {
        $query = "DELETE FROM " . $this->table . " WHERE id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param('s', $id);

        if ($stmt->execute()) {
            return ['success' => true];
        }

        return ['success' => false, 'message' => 'Delete failed: ' . $stmt->error];
    }

    /**
     * Check if a duplicate asset already exists in the table.
     */
    public function findDuplicate($data)
    {
        $processed = $this->processInput($data);

        $checkConditions = [];
        $checkParams = [];
        $checkTypes = "";

        $uniqueFieldsToCheck = ['serial_number', 'plate_number', 'chassis_number', 'engine_number', 'asset_tag'];
        $hasUniqueField = false;
        foreach ($uniqueFieldsToCheck as $field) {
            if (!empty($processed[$field])) {
                $checkConditions[] = "`$field` = ?";
                $checkParams[] = $processed[$field];
                $checkTypes .= "s";
                $hasUniqueField = true;
            }
        }

        if ($hasUniqueField) {
            $query = "SELECT id FROM `" . $this->table . "` WHERE " . implode(" OR ", $checkConditions) . " LIMIT 1";
        } else {
            // Match name, major_category, and category if no unique fields are provided
            $query = "SELECT id FROM `" . $this->table . "` WHERE `name` = ? AND `major_category` = ? AND `category` = ? LIMIT 1";
            $checkParams = [
                $processed['name'] ?? '',
                $processed['major_category'] ?? '',
                $processed['category'] ?? ''
            ];
            $checkTypes = "sss";
        }

        $stmt = $this->db->prepare($query);
        if (!$stmt) {
            return null;
        }

        $stmt->bind_param($checkTypes, ...$checkParams);
        $stmt->execute();
        $res = $stmt->get_result()->fetch_assoc();
        return $res ? $res['id'] : null;
    }
}

/**
 * Unified Asset Model
 */
class Asset extends AssetModel
{
    protected $table = 'assets';

    // Fillable fields across all types
    protected $fillable = [
        'sub_type',
        'serial_number',
        'plate_number',
        'chassis_number',
        'engine_number',
        'location',
        'useful_life',
        'residual_value',
        'image',
        'owner_division',
        'custodian_name',
        'custodian_id',
        'last_service_date',
        'last_inspection_date',
        'major_category',
        'asset_type',
        'category',
        'sizes',
        'color',
        'room_number',
        'desk_number',
        'staff_assigned_to',
        'staff_id',
        'type',
        'custodian_address',
        'custodian_mobile',
        'brand_name',
        'model',
        'asset_tag',
        'has_asset_tag',
        'room_name',
        'memory_size',
        'processor',
        'generation',
        'storage_size',
        'route_name',
        'quantity',
        'capacity',
        'expiry_date',
        'warranty_expiry',
        'bank_name',
        'account_number',
        'account_type',
        'branch',
        'currency',
        'balance_amount',
        'receipt_url',
        // Fleet / vehicle specific
        'year_of_manufacture',
        'fuel_type',
        'transmission',
        'engine_size',
        'mileage',
        // ICT / Network specific
        'ip_address',
        'port_count',
        'printer_type',
        'scanner_type',
        // Intangible / Software specific
        'license_type',
        'software_version',
        'license_key',
        'vendor',
        // Furniture & Infrastructure specific
        'chair_material',
        'workstation_material',
        'partition_material',
        'battery_type',
        'runtime',
        'number_of_floors',
        'number_of_seats',
    ];

    // Map frontend field names to database columns
    protected $mapping = [
        'majorCategory'     => 'major_category',
        'assetType'         => 'asset_type',
        'category'          => 'category',
        'subType'           => 'sub_type',
        'approvalStatus'    => 'approval_status',
        'ownerDivision'     => 'owner_division',
        'custodianName'     => 'custodian_name',
        'custodianID'       => 'custodian_id',
        'cost'              => 'purchase_cost',
        'purchaseDate'      => 'purchase_date',
        'lastService'       => 'last_service_date',
        'lastInspection'    => 'last_inspection_date',
        'serial'            => 'serial_number',
        'plate'             => 'plate_number',
        'chassis'           => 'chassis_number',
        'engine'            => 'engine_number',
        'usefulLife'        => 'useful_life',
        'residualValue'     => 'residual_value',
        'details'           => 'notes',
        'sizes'             => 'sizes',
        'color'             => 'color',
        'roomNo'            => 'room_number',
        'deskNo'            => 'desk_number',
        'staffAssignedTo'   => 'staff_assigned_to',
        'staffID'           => 'staff_id',
        'type'              => 'type',
        'custodianAddress'  => 'custodian_address',
        'custodianMobile'   => 'custodian_mobile',
        'brandName'         => 'brand_name',
        'model'             => 'model',
        'assetTag'          => 'asset_tag',
        'roomName'          => 'room_name',
        'memorySize'        => 'memory_size',
        'processor'         => 'processor',
        'generation'        => 'generation',
        'storageSize'       => 'storage_size',
        'routeName'         => 'route_name',
        'quantity'          => 'quantity',
        'capacity'          => 'capacity',
        'expiryDate'        => 'expiry_date',
        'warrantyExpiry'    => 'warranty_expiry',
        'bankName'          => 'bank_name',
        'accountNumber'     => 'account_number',
        'accountType'       => 'account_type',
        'branch'            => 'branch',
        'currency'          => 'currency',
        'balanceAmount'     => 'balance_amount',
        // Fleet / vehicle specific
        'yearOfManufacture' => 'year_of_manufacture',
        'fuelType'          => 'fuel_type',
        'transmission'      => 'transmission',
        'engineSize'        => 'engine_size',
        'mileage'           => 'mileage',
        // ICT / Network specific
        'ipAddress'         => 'ip_address',
        'portCount'         => 'port_count',
        'printerType'       => 'printer_type',
        'scannerType'       => 'scanner_type',
        // Intangible / Software specific
        'licenseType'       => 'license_type',
        'softwareVersion'   => 'software_version',
        'licenseKey'        => 'license_key',
        'vendor'            => 'vendor',
        // Furniture & Infrastructure specific
        'chairMaterial'       => 'chair_material',
        'workstationMaterial' => 'workstation_material',
        'partitionMaterial'   => 'partition_material',
        'batteryType'         => 'battery_type',
        'runtime'             => 'runtime',
        'numberOfFloors'      => 'number_of_floors',
        'numberOfSeats'       => 'number_of_seats',
        // Asset tag
        'hasAssetTag'       => 'has_asset_tag',
    ];

    /**
     * Override getAll to support new category filters
     */
    public function getAll($page = 1, $per_page = 10, $filters = [])
    {
        $offset = ($page - 1) * $per_page;
        $where = "WHERE 1=1";

        if (!empty($filters['major_category'])) {
            $where .= " AND major_category = '" . $this->db->real_escape_string($filters['major_category']) . "'";
        }

        if (!empty($filters['asset_type'])) {
            $where .= " AND asset_type = '" . $this->db->real_escape_string($filters['asset_type']) . "'";
        }

        if (!empty($filters['category']) && $filters['category'] !== 'all') {
            $where .= " AND category = '" . $this->db->real_escape_string($filters['category']) . "'";
        }

        if (!empty($filters['status'])) {
            $where .= " AND status = '" . $this->db->real_escape_string($filters['status']) . "'";
        }

        if (!empty($filters['division'])) {
            $where .= " AND division = '" . $this->db->real_escape_string($filters['division']) . "'";
        }

        if (!empty($filters['search'])) {
            $search = '%' . $this->db->real_escape_string($filters['search']) . '%';
            $where .= " AND (name LIKE '" . $search . "' OR id LIKE '" . $search . "')";
        }

        if (!empty($filters['approval_status'])) {
            $where .= " AND approval_status = '" . $this->db->real_escape_string($filters['approval_status']) . "'";
        }

        // Get total count
        $count_result = $this->db->query("SELECT COUNT(*) as total FROM " . $this->table . " " . $where);
        $total = $count_result ? $count_result->fetch_assoc()['total'] : 0;

        // Get paginated results
        $query = "SELECT * FROM " . $this->table . " " . $where . " 
                  ORDER BY created_at DESC LIMIT " . intval($per_page) . " OFFSET " . intval($offset);

        $result = $this->db->query($query);

        return [
            'total' => $total,
            'data' => $result ? $result->fetch_all(MYSQLI_ASSOC) : []
        ];
    }

    /**
     * Ensure receipt_url column exists in assets table (auto-migration)
     * Safe to call on every receipt upload; uses IF NOT EXISTS so it is idempotent.
     */
    public function ensureReceiptUrlColumn()
    {
        @$this->db->query(
            "ALTER TABLE `assets` ADD COLUMN IF NOT EXISTS `receipt_url` TEXT DEFAULT NULL"
        );
    }
}
