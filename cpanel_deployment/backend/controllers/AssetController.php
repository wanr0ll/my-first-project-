<?php

/**
 * Asset Controller - Handle asset management
 */

class AssetController
{
    private $assetModel;
    private $historyModel;

    private $notificationModel;

    public function __construct($assetModel, $historyModel = null, $notificationModel = null)
    {
        $this->assetModel = $assetModel;
        $this->historyModel = $historyModel;
        $this->notificationModel = $notificationModel;
    }

    /**
     * Get all assets with hierarchical filtering
     */
    public function getByCategory()
    {
        Middleware::requireAuth();

        $page = Request::getParam('page', 1);
        $per_page = Request::getParam('per_page', 1000); // Higher default for flexibility

        $filters = [
            'major_category' => Request::getParam('majorCategory'),
            'asset_type' => Request::getParam('assetType'),
            'category' => Request::getParam('category'),
            'status' => Request::getParam('status'),
            'division' => Request::getParam('division'),
            'search' => Request::getParam('search'),
            'approval_status' => Request::getParam('approvalStatus')
        ];

        $result = $this->assetModel->getAll($page, $per_page, $filters);

        Response::paginated($result['data'], $result['total'], $page, $per_page);
    }

    /**
     * Get asset by ID
     */
    public function getById()
    {
        Middleware::requireAuth();

        $id = Request::getParam('id');

        if (empty($id)) {
            Response::error('ID is required', 400);
        }

        $asset = $this->assetModel->getById($id);

        if (!$asset) {
            Response::error('Asset not found', 404);
        }

        Response::success($asset, 'Asset retrieved successfully');
    }

    /**
     * Create asset
     */
    public function create()
    {
        $user = Middleware::requireAuth();

        $data = Request::getJSON();

        if (empty($data['name']) || empty($data['majorCategory']) || empty($data['category'])) {
            Response::error('Name, major category, and category are required', 400);
        }

        // Add creator info
        $data['createdBy'] = $user['name'] ?? $user['email'] ?? 'System';

        $result = $this->assetModel->create($data);

        if ($result['success']) {
            if ($this->historyModel) {
                $this->historyModel->log(
                    $result['id'],
                    $data['asset_type'] ?? 'Asset',
                    'Asset Registered',
                    "New asset '{$data['name']}' was registered by {$data['createdBy']}",
                    $user['id']
                );
            }
            if ($this->notificationModel) {
                $this->notificationModel->notifyAdmins(
                    'New Asset Registered',
                    "Asset '{$data['name']}' was added to the system by {$data['createdBy']}.",
                    'success',
                    $result['id']
                );
            }
        }

        Response::success(['id' => $result['id']], 'Asset created successfully', 201);
    }

    /**
     * Update asset
     */
    public function update()
    {
        $user = Middleware::requireAuth();

        $data = Request::getJSON();
        $id = $data['id'] ?? null;

        if (empty($id)) {
            Response::error('ID is required', 400);
        }

        if (!$this->assetModel->getById($id)) {
            Response::error('Asset not found', 404);
        }

        $oldAsset = $this->assetModel->getById($id);
        $result = $this->assetModel->update($id, $data);

        if ($result['success']) {
            if ($this->historyModel) {
                $action = 'Asset Updated';
                $desc = "Asset details updated for '{$data['name']}'";

                if (isset($data['status']) && $oldAsset && $data['status'] !== $oldAsset['status']) {
                    $action = 'Asset Status Changed';
                    $desc = "Asset status changed from {$oldAsset['status']} to {$data['status']}";
                }

                $this->historyModel->log($id, 'Asset', $action, $desc, $user['id'] ?? 'System', $oldAsset, $data);
            }

            if ($this->notificationModel && isset($data['status']) && $oldAsset && $data['status'] !== $oldAsset['status']) {
                $this->notificationModel->notifyAdmins(
                    'Asset Status Changed',
                    "Asset '{$data['name']}' status changed from {$oldAsset['status']} to {$data['status']}.",
                    'warning',
                    $id
                );
            }
        }

        Response::success(null, 'Asset updated successfully');
    }

    /**
     * Transfer asset
     */
    public function transfer()
    {
        $user = Middleware::requireRole(['Administrator', 'CEO', 'Chief Executive', 'Director']);
        $data = Request::getJSON();
        $id = $data['id'] ?? null;

        if (empty($id)) {
            Response::error('Asset ID is required', 400);
        }

        $oldAsset = $this->assetModel->getById($id);
        if (!$oldAsset) {
            Response::error('Asset not found', 404);
        }

        $result = $this->assetModel->update($id, $data);

        if ($result['success'] && $this->historyModel) {
            $description = "Asset transferred";

            $changes = [];
            if (isset($data['division']) && $data['division'] !== $oldAsset['division']) {
                $changes[] = "from division '{$oldAsset['division']}' to '{$data['division']}'";
            }
            if (isset($data['location']) && $data['location'] !== $oldAsset['location']) {
                $changes[] = "from location '{$oldAsset['location']}' to '{$data['location']}'";
            }
            if (isset($data['custodian_name']) && $data['custodian_name'] !== $oldAsset['custodian_name']) {
                $changes[] = "custodian changed from '{$oldAsset['custodian_name']}' to '{$data['custodian_name']}'";
            }

            if (!empty($changes)) {
                $description .= ": " . implode(", ", $changes);
            }

            if (isset($data['notes']) && !empty($data['notes'])) {
                $description .= ". Reason: " . $data['notes'];
            }

            $this->historyModel->log(
                $id,
                'Asset',
                'Asset Transferred',
                $description,
                $user['id'],
                $oldAsset,
                $data
            );
        }

        if ($result['success'] && $this->notificationModel) {
            // Re-generate basic description if historyModel block didn't run
            if (!isset($description)) {
                $description = "Asset transferred.";
            }
            $this->notificationModel->notifyAdmins(
                'Asset Transferred',
                "Asset '{$oldAsset['name']}' was transferred. " . $description,
                'info',
                $id
            );
        }

        Response::success(null, 'Asset transferred successfully');
    }

    /**
     * Delete asset
     */
    public function delete()
    {
        Middleware::requireRole(['Administrator', 'CEO']);

        $id = Request::getParam('id');

        if (empty($id)) {
            Response::error('ID is required', 400);
        }

        if (!$this->assetModel->getById($id)) {
            Response::error('Asset not found', 404);
        }

        $oldAsset = $this->assetModel->getById($id);
        $result = $this->assetModel->delete($id);

        if ($result['success']) {
            $user = Middleware::requireAuth();
            if ($this->historyModel) {
                $this->historyModel->log($id, 'Asset', 'Asset Deleted', "Asset was removed from the system", $user['id'] ?? 'System');
            }

            if ($this->notificationModel && $oldAsset) {
                $this->notificationModel->notifyAdmins(
                    'Asset Deleted',
                    "Asset '{$oldAsset['name']}' (ID: {$id}) was deleted from the system by {$user['name']}.",
                    'error',
                    $id
                );
            }
        }

        Response::success(null, 'Asset deleted successfully');
    }

    /**
     * Bulk Import Assets
     */
    public function bulkImport()
    {
        $user = Middleware::requireAuth();
        $data = Request::getJSON();

        if (!isset($data['assets']) || !is_array($data['assets'])) {
            Response::error('Invalid assets data', 400);
        }

        $assets = $data['assets'];
        $results = [
            'total' => count($assets),
            'success' => 0,
            'failed' => 0,
            'errors' => []
        ];

        foreach ($assets as $index => $assetData) {
            try {
                // Ensure required fields
                if (empty($assetData['name']) || empty($assetData['majorCategory']) || empty($assetData['category'])) {
                    $results['failed']++;
                    $results['errors'][] = "Row " . ($index + 1) . ": Name, major category, and category are required";
                    continue;
                }

                // Add creator info
                $assetData['createdBy'] = $user['name'] ?? $user['email'] ?? 'System';

                $result = $this->assetModel->create($assetData);

                if ($result['success']) {
                    $results['success']++;
                    if ($this->historyModel) {
                        $this->historyModel->log(
                            $result['id'],
                            $assetData['asset_type'] ?? 'Asset',
                            'Asset Bulk Imported',
                            "Asset '{$assetData['name']}' was bulk imported by {$assetData['createdBy']}",
                            $user['id']
                        );
                    }
                } else {
                    $results['failed']++;
                    $results['errors'][] = "Row " . ($index + 1) . ": " . $result['message'];
                }
            } catch (Throwable $e) {
                $results['failed']++;
                $results['errors'][] = "Row " . ($index + 1) . ": " . $e->getMessage();
            }
        }

        if ($this->notificationModel && $results['success'] > 0) {
            $this->notificationModel->notifyAdmins(
                'Bulk Asset Import',
                "{$results['success']} assets were successfully imported by {$user['name']}.",
                'success'
            );
        }

        Response::success($results, "Bulk import completed. {$results['success']} successful, {$results['failed']} failed.");
    }
}
