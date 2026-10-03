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
        $data['createdBy'] = $user['id'];
        $creatorName = $user['name'] ?? $user['email'] ?? 'System';

        // Force new manual assets to require approval
        $data['approvalStatus'] = 'Pending';

        $result = $this->assetModel->create($data);

        if (!$result['success']) {
            Response::error($result['message'] ?? 'Failed to create asset', 400);
        }

        if ($this->historyModel) {
            $this->historyModel->log(
                $result['id'],
                $data['asset_type'] ?? 'Asset',
                'Asset Registered',
                "New asset '{$data['name']}' was registered by {$creatorName}",
                $user['id']
            );
        }
        if ($this->notificationModel) {
            $this->notificationModel->notifyAdmins(
                'New Asset Registered',
                "Asset '{$data['name']}' was added to the system by {$creatorName}.",
                'success',
                $result['id']
            );
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
                    $newStatus = $data['status'];
                    $oldStatus = $oldAsset['status'];

                    if ($newStatus === 'Archived') {
                        $action = 'Asset Archived';
                        $desc = "Asset archived from {$oldStatus}";
                        if (!empty($data['archive_reason'])) {
                            $desc .= ". Archive reason: " . $data['archive_reason'];
                        }
                    } elseif (in_array($newStatus, ['Disposed', 'Scrapped', 'Sold'])) {
                        $action = 'Asset Disposed';
                        $desc = "Asset status changed from {$oldStatus} to {$newStatus}";
                        if (!empty($data['disposal_reason'])) {
                            $desc .= ". Disposal reason: " . $data['disposal_reason'];
                        }
                    } elseif (in_array($oldStatus, ['Disposed', 'Scrapped', 'Sold']) && !in_array($newStatus, ['Disposed', 'Scrapped', 'Sold'])) {
                        $action = 'Asset Restored';
                        $desc = "Asset restored from {$oldStatus} to {$newStatus}";
                        if (!empty($data['restore_reason'])) {
                            $desc .= ". Restore reason: " . $data['restore_reason'];
                        }
                    } else {
                        $action = 'Asset Status Changed';
                        $desc = "Asset status changed from {$oldStatus} to {$newStatus}";
                    }
                }

                $this->historyModel->log($id, 'Asset', $action, $desc, $user['id'] ?? 'System', $oldAsset, $data);
            }

            if ($this->notificationModel && isset($data['status']) && $oldAsset && $data['status'] !== $oldAsset['status']) {
                $notifMessage = "Asset '{$data['name']}' status changed from {$oldAsset['status']} to {$data['status']}.";
                if ($data['status'] === 'Archived' && !empty($data['archive_reason'])) {
                    $notifMessage .= " Reason: " . $data['archive_reason'];
                } elseif (in_array($data['status'], ['Disposed', 'Scrapped', 'Sold']) && !empty($data['disposal_reason'])) {
                    $notifMessage .= " Reason: " . $data['disposal_reason'];
                } elseif (!empty($data['restore_reason'])) {
                    $notifMessage .= " Reason: " . $data['restore_reason'];
                }
                $this->notificationModel->notifyAdmins(
                    'Asset Status Changed',
                    $notifMessage,
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
        $user = Middleware::requireRole(['Super Admin', 'CEO', 'Chief Executive', 'Director']);
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
        Middleware::requireRole(['Super Admin', 'CEO']);

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

                // Force approval status to Pending
                $assetData['approvalStatus'] = 'Pending';
                $assetData['approval_status'] = 'Pending';

                // Check for duplicate asset before inserting
                $duplicateId = $this->assetModel->findDuplicate($assetData);
                if ($duplicateId !== null) {
                    $results['failed']++;
                    $results['errors'][] = "Row " . ($index + 1) . ": Asset '{$assetData['name']}' already exists in the system (ID: {$duplicateId}). Skipped to prevent redundancy.";
                    continue;
                }

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

    /**
     * Upload a receipt/scan file for an asset and save its URL
     */
    public function uploadReceipt()
    {
        $user = Middleware::requireAuth();

        // Auto-migration: ensure receipt_url column exists (safe to run repeatedly)
        $this->assetModel->ensureReceiptUrlColumn();

        $assetId = $_POST['asset_id'] ?? ($_GET['asset_id'] ?? null);

        if (empty($assetId)) {
            Response::error('asset_id is required', 400);
        }

        if (!isset($_FILES['receipt']) || $_FILES['receipt']['error'] !== UPLOAD_ERR_OK) {
            Response::error('No valid file uploaded', 400);
        }

        $file = $_FILES['receipt'];
        $allowedTypes = [
            'image/jpeg',
            'image/png',
            'application/pdf'
        ];
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];

        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

        if (!in_array($file['type'], $allowedTypes) || !in_array($ext, $allowedExtensions)) {
            Response::error('Only JPG, PNG, and PDF files are allowed', 400);
        }

        if ($file['size'] > 10 * 1024 * 1024) { // 10MB limit
            Response::error('File size exceeds 10MB limit', 400);
        }

        $uploadDir = __DIR__ . '/../uploads/receipts/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $filename = 'receipt_' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $assetId) . '_' . time() . '.' . $ext;
        $destination = $uploadDir . $filename;

        if (move_uploaded_file($file['tmp_name'], $destination)) {
            $receiptUrl = '/uploads/receipts/' . $filename;

            // Update the asset record with the receipt URL
            $result = $this->assetModel->update($assetId, ['receipt_url' => $receiptUrl]);

            if ($result['success']) {
                if ($this->historyModel) {
                    $actor = $user['name'] ?? $user['email'] ?? 'System';
                    $this->historyModel->log(
                        $assetId,
                        'Asset',
                        'Receipt Uploaded',
                        "A receipt/scan was uploaded by {$actor}.",
                        $user['id']
                    );
                }
                Response::success(['receipt_url' => $receiptUrl], 'Receipt uploaded successfully');
            } else {
                // Clean up the uploaded file if DB update failed
                @unlink($destination);
                Response::error('Failed to update asset record: ' . ($result['message'] ?? 'Unknown error'), 500);
            }
        } else {
            Response::error('Failed to save uploaded file', 500);
        }
    }
}
