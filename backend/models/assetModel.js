const { query } = require('../config/db');
const { generateId } = require('../utils/auth');

const FIELD_MAPPING = {
    majorCategory: 'major_category',
    assetType: 'asset_type',
    category: 'category',
    subType: 'sub_type',
    approvalStatus: 'approval_status',
    ownerDivision: 'owner_division',
    custodianName: 'custodian_name',
    custodianID: 'custodian_id',
    cost: 'purchase_cost',
    purchaseDate: 'purchase_date',
    lastService: 'last_service_date',
    lastInspection: 'last_inspection_date',
    serial: 'serial_number',
    plate: 'plate_number',
    chassis: 'chassis_number',
    engine: 'engine_number',
    usefulLife: 'useful_life',
    residualValue: 'residual_value',
    details: 'notes',
    sizes: 'sizes',
    color: 'color',
    roomNo: 'room_number',
    deskNo: 'desk_number',
    staffAssignedTo: 'staff_assigned_to',
    staffID: 'staff_id',
    type: 'type',
    custodianAddress: 'custodian_address',
    custodianMobile: 'custodian_mobile',
    brandName: 'brand_name',
    model: 'model',
    assetTag: 'asset_tag',
    roomName: 'room_name',
    memorySize: 'memory_size',
    processor: 'processor',
    generation: 'generation',
    storageSize: 'storage_size',
    routeName: 'route_name',
    quantity: 'quantity',
    capacity: 'capacity',
    expiryDate: 'expiry_date',
    warrantyExpiry: 'warranty_expiry',
    bankName: 'bank_name',
    accountNumber: 'account_number',
    accountType: 'account_type',
    branch: 'branch',
    currency: 'currency',
    balanceAmount: 'balance_amount',
    yearOfManufacture: 'year_of_manufacture',
    fuelType: 'fuel_type',
    transmission: 'transmission',
    engineSize: 'engine_size',
    mileage: 'mileage',
    ipAddress: 'ip_address',
    portCount: 'port_count',
    printerType: 'printer_type',
    scannerType: 'scanner_type',
    licenseType: 'license_type',
    softwareVersion: 'software_version',
    licenseKey: 'license_key',
    vendor: 'vendor',
    chairMaterial: 'chair_material',
    workstationMaterial: 'workstation_material',
    partitionMaterial: 'partition_material',
    batteryType: 'battery_type',
    runtime: 'runtime',
    numberOfFloors: 'number_of_floors',
    numberOfSeats: 'number_of_seats',
    hasAssetTag: 'has_asset_tag',
    receiptUrl: 'receipt_url',
    createdBy: 'created_by',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
};

const ALLOWED_DB_COLUMNS = [
    'id', 'name', 'major_category', 'asset_type', 'category', 'sub_type', 'status',
    'division', 'owner_division', 'custodian_name', 'custodian_id', 'location',
    'purchase_date', 'purchase_cost', 'useful_life', 'residual_value',
    'last_service_date', 'last_inspection_date', 'approval_status', 'notes',
    'image', 'serial_number', 'plate_number', 'chassis_number', 'engine_number',
    'sizes', 'color', 'room_number', 'desk_number', 'room_name', 'staff_assigned_to',
    'staff_id', 'type', 'custodian_address', 'custodian_mobile', 'brand_name',
    'model', 'asset_tag', 'has_asset_tag', 'memory_size', 'processor', 'generation',
    'storage_size', 'route_name', 'quantity', 'capacity', 'expiry_date',
    'warranty_expiry', 'receipt_url', 'chair_material', 'workstation_material',
    'partition_material', 'battery_type', 'runtime', 'number_of_floors',
    'number_of_seats', 'bank_name', 'account_number', 'account_type', 'branch',
    'currency', 'balance_amount', 'year_of_manufacture', 'fuel_type',
    'transmission', 'engine_size', 'mileage', 'ip_address', 'port_count',
    'printer_type', 'scanner_type', 'license_type', 'software_version',
    'license_key', 'vendor', 'created_by'
];

class AssetModel {
    /**
     * Map input keys to valid database columns
     */
    processInput(data) {
        const processed = {};

        for (const [key, val] of Object.entries(data)) {
            const dbColumn = FIELD_MAPPING[key] || key;
            if (ALLOWED_DB_COLUMNS.includes(dbColumn)) {
                processed[dbColumn] = val === '' ? null : val;
            }
        }

        return processed;
    }

    /**
     * Create an asset
     */
    async create(data) {
        const id = data.id || generateId('AST');
        const processed = this.processInput(data);
        processed.id = id;

        // Defensive check: verify created_by exists in users table
        if (processed.created_by) {
            try {
                const uCheck = await query('SELECT id FROM users WHERE id = $1 LIMIT 1', [processed.created_by]);
                if (uCheck.rows.length === 0) {
                    processed.created_by = null;
                }
            } catch {
                processed.created_by = null;
            }
        }

        const columns = Object.keys(processed);
        const placeholders = columns.map((_, i) => `$${i + 1}`);
        const values = Object.values(processed);

        const sql = `
            INSERT INTO assets (${columns.join(', ')}) 
            VALUES (${placeholders.join(', ')}) 
            RETURNING id;
        `;

        try {
            const res = await query(sql, values);
            return { success: true, id: res.rows[0].id };
        } catch (err) {
            return { success: false, message: err.message };
        }
    }

    /**
     * Get asset by ID
     */
    async getById(id) {
        if (!id) return null;
        const res = await query('SELECT * FROM assets WHERE id = $1 LIMIT 1;', [id]);
        return res.rows[0] || null;
    }

    /**
     * Get assets with comprehensive filtering and pagination
     */
    async getAll(page = 1, perPage = 1000, filters = {}) {
        const currentPage = Math.max(1, parseInt(page, 10) || 1);
        const limit = Math.max(1, parseInt(perPage, 10) || 1000);
        const offset = (currentPage - 1) * limit;

        const conditions = ['1=1'];
        const values = [];
        let idx = 1;

        if (filters.major_category || filters.majorCategory) {
            conditions.push(`major_category = $${idx++}`);
            values.push(filters.major_category || filters.majorCategory);
        }

        if (filters.asset_type || filters.assetType) {
            conditions.push(`asset_type = $${idx++}`);
            values.push(filters.asset_type || filters.assetType);
        }

        const cat = filters.category;
        if (cat) {
            // Support plural or canonical category names
            const canonicalCat = cat.toLowerCase();
            if (['all', ''].includes(canonicalCat)) {
                // no category filter
            } else if (canonicalCat === 'vehicles') {
                conditions.push(`(LOWER(category) = 'vehicles' OR LOWER(category) = 'vehicle')`);
            } else if (canonicalCat === 'furniture') {
                conditions.push(`LOWER(category) LIKE '%furniture%'`);
            } else if (canonicalCat === 'electronics') {
                conditions.push(`(LOWER(category) LIKE '%electronic%' OR LOWER(category) LIKE '%ict%')`);
            } else if (canonicalCat === 'indoor_devices') {
                conditions.push(`(LOWER(category) LIKE '%indoor%' OR LOWER(category) LIKE '%device%')`);
            } else {
                conditions.push(`(LOWER(category) = $${idx} OR LOWER(sub_type) = $${idx})`);
                values.push(canonicalCat);
                idx++;
            }
        }

        if (filters.status) {
            conditions.push(`status = $${idx++}`);
            values.push(filters.status);
        }

        if (filters.division) {
            conditions.push(`division = $${idx++}`);
            values.push(filters.division);
        }

        if (filters.approval_status || filters.approvalStatus) {
            conditions.push(`approval_status = $${idx++}`);
            values.push(filters.approval_status || filters.approvalStatus);
        }

        if (filters.search) {
            conditions.push(`(
                name ILIKE $${idx} OR 
                serial_number ILIKE $${idx} OR 
                plate_number ILIKE $${idx} OR 
                asset_tag ILIKE $${idx} OR 
                custodian_name ILIKE $${idx} OR 
                location ILIKE $${idx}
            )`);
            values.push(`%${filters.search}%`);
            idx++;
        }

        const whereClause = conditions.join(' AND ');

        // Count total
        const countSql = `SELECT COUNT(*)::int as total FROM assets WHERE ${whereClause};`;
        const countRes = await query(countSql, values);
        const total = countRes.rows[0]?.total || 0;

        // Select records
        const selectSql = `
            SELECT * FROM assets 
            WHERE ${whereClause} 
            ORDER BY created_at DESC 
            LIMIT $${idx++} OFFSET $${idx++};
        `;
        values.push(limit, offset);

        const dataRes = await query(selectSql, values);

        return {
            total,
            data: dataRes.rows
        };
    }

    /**
     * Update an asset
     */
    async update(id, data) {
        const processed = this.processInput(data);
        delete processed.id;

        const entries = Object.entries(processed);
        if (entries.length === 0) {
            return { success: false, message: 'No valid fields provided for update' };
        }

        const updates = [];
        const values = [];
        let idx = 1;

        for (const [col, val] of entries) {
            updates.push(`${col} = $${idx++}`);
            values.push(val);
        }

        values.push(id);
        const sql = `UPDATE assets SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${idx};`;

        try {
            const res = await query(sql, values);
            return { success: res.rowCount > 0 };
        } catch (err) {
            return { success: false, message: err.message };
        }
    }

    /**
     * Delete an asset
     */
    async delete(id) {
        try {
            await query('DELETE FROM asset_history WHERE asset_id = $1;', [id]);
            await query('DELETE FROM maintenance_tasks WHERE asset_id = $1;', [id]);
            const res = await query('DELETE FROM assets WHERE id = $1;', [id]);
            return { success: res.rowCount > 0 };
        } catch (err) {
            return { success: false, message: err.message };
        }
    }

    /**
     * Detect duplicate asset during import
     */
    async findDuplicate(data) {
        const serial = data.serial || data.serial_number;
        const plate = data.plate || data.plate_number;
        const tag = data.assetTag || data.asset_tag;

        if (serial) {
            const res = await query('SELECT id FROM assets WHERE serial_number = $1 LIMIT 1;', [serial]);
            if (res.rows.length > 0) return res.rows[0].id;
        }

        if (plate) {
            const res = await query('SELECT id FROM assets WHERE plate_number = $1 LIMIT 1;', [plate]);
            if (res.rows.length > 0) return res.rows[0].id;
        }

        if (tag) {
            const res = await query('SELECT id FROM assets WHERE asset_tag = $1 LIMIT 1;', [tag]);
            if (res.rows.length > 0) return res.rows[0].id;
        }

        return null;
    }
}

module.exports = new AssetModel();
