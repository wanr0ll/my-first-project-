const assetModel = require('../models/assetModel');
const historyModel = require('../models/historyModel');
const notificationModel = require('../models/notificationModel');
const { success, error, paginated } = require('../utils/response');

class AssetController {
    /**
     * Get assets by category or list all
     */
    async getByCategory(req, res) {
        const page = parseInt(req.query.page, 10) || 1;
        const perPage = parseInt(req.query.per_page, 10) || 1000;

        const category = req.params.category || req.query.category || null;

        const filters = {
            category: category,
            majorCategory: req.query.majorCategory || req.query.major_category,
            assetType: req.query.assetType || req.query.asset_type,
            status: req.query.status,
            division: req.query.division,
            search: req.query.search,
            approvalStatus: req.query.approvalStatus || req.query.approval_status
        };

        const result = await assetModel.getAll(page, perPage, filters);
        return paginated(res, result.data, result.total, page, perPage, 'Assets retrieved successfully');
    }

    /**
     * Get single asset by ID
     */
    async getById(req, res) {
        const id = req.params.id || req.query.id;
        if (!id) {
            return error(res, 'Asset ID is required', 400);
        }

        const asset = await assetModel.getById(id);
        if (!asset) {
            return error(res, 'Asset not found', 404);
        }

        return success(res, asset, 'Asset retrieved successfully');
    }

    /**
     * Create asset
     */
    async create(req, res) {
        const user = req.user;
        const data = req.body || {};

        const name = data.name;
        const majorCategory = data.majorCategory || data.major_category;
        const category = data.category;

        if (!name || !majorCategory || !category) {
            return error(res, 'Name, major category, and category are required', 400);
        }

        data.createdBy = user.id;
        data.approvalStatus = 'Pending';

        const result = await assetModel.create(data);
        if (!result.success) {
            return error(res, result.message || 'Failed to create asset', 400);
        }

        const creatorName = user.name || user.email || 'System';

        historyModel.log(
            result.id,
            data.assetType || data.asset_type || 'Asset',
            'Asset Registered',
            `New asset '${data.name}' was registered by ${creatorName}`,
            user.id
        ).catch(() => {});

        notificationModel.notifyAdmins(
            'New Asset Registered',
            `Asset '${data.name}' was added to the system by ${creatorName}.`,
            'success',
            result.id
        ).catch(() => {});

        return success(res, { id: result.id }, 'Asset created successfully', 201);
    }

    /**
     * Update asset
     */
    async update(req, res) {
        const user = req.user;
        const data = req.body || {};
        const id = req.params.id || data.id || req.query.id;

        if (!id) {
            return error(res, 'Asset ID is required', 400);
        }

        const oldAsset = await assetModel.getById(id);
        if (!oldAsset) {
            return error(res, 'Asset not found', 404);
        }

        const result = await assetModel.update(id, data);
        if (!result.success) {
            return error(res, result.message || 'Asset update failed', 500);
        }

        // Audit Trail & Notifications
        if (data.status && oldAsset.status && data.status !== oldAsset.status) {
            const newStatus = data.status;
            const oldStatus = oldAsset.status;
            let action = 'Asset Status Changed';
            let desc = `Asset status changed from ${oldStatus} to ${newStatus}`;

            if (newStatus === 'Archived') {
                action = 'Asset Archived';
                desc = `Asset archived from ${oldStatus}` + (data.archive_reason ? `. Reason: ${data.archive_reason}` : '');
            } else if (['Disposed', 'Scrapped', 'Sold'].includes(newStatus)) {
                action = 'Asset Disposed';
                desc = `Asset status changed from ${oldStatus} to ${newStatus}` + (data.disposal_reason ? `. Reason: ${data.disposal_reason}` : '');
            } else if (['Disposed', 'Scrapped', 'Sold'].includes(oldStatus)) {
                action = 'Asset Restored';
                desc = `Asset restored from ${oldStatus} to ${newStatus}` + (data.restore_reason ? `. Reason: ${data.restore_reason}` : '');
            }

            historyModel.log(id, 'Asset', action, desc, user.id, oldAsset, data).catch(() => {});
            notificationModel.notifyAdmins('Asset Status Changed', `Asset '${data.name || oldAsset.name}' status changed: ${desc}`, 'warning', id).catch(() => {});
        } else {
            historyModel.log(id, 'Asset', 'Asset Updated', `Asset details updated for '${data.name || oldAsset.name}'`, user.id, oldAsset, data).catch(() => {});
        }

        return success(res, null, 'Asset updated successfully');
    }

    /**
     * Transfer asset
     */
    async transfer(req, res) {
        const user = req.user;
        const data = req.body || {};
        const id = req.params.id || data.id || req.query.id;

        if (!id) {
            return error(res, 'Asset ID is required', 400);
        }

        const oldAsset = await assetModel.getById(id);
        if (!oldAsset) {
            return error(res, 'Asset not found', 404);
        }

        const result = await assetModel.update(id, data);
        if (!result.success) {
            return error(res, result.message || 'Asset transfer failed', 500);
        }

        const changes = [];
        if (data.division && data.division !== oldAsset.division) {
            changes.push(`from division '${oldAsset.division}' to '${data.division}'`);
        }
        if (data.location && data.location !== oldAsset.location) {
            changes.push(`from location '${oldAsset.location}' to '${data.location}'`);
        }
        if (data.custodianName && data.custodianName !== oldAsset.custodian_name) {
            changes.push(`custodian changed from '${oldAsset.custodian_name}' to '${data.custodianName}'`);
        }

        let description = 'Asset transferred';
        if (changes.length > 0) description += ': ' + changes.join(', ');
        if (data.notes) description += `. Reason: ${data.notes}`;

        historyModel.log(id, 'Asset', 'Asset Transferred', description, user.id, oldAsset, data).catch(() => {});
        notificationModel.notifyAdmins('Asset Transferred', `Asset '${oldAsset.name}' was transferred. ${description}`, 'info', id).catch(() => {});

        return success(res, null, 'Asset transferred successfully');
    }

    /**
     * Delete asset
     */
    async delete(req, res) {
        const user = req.user;
        const id = req.params.id || req.query.id;

        if (!id) {
            return error(res, 'Asset ID is required', 400);
        }

        const oldAsset = await assetModel.getById(id);
        if (!oldAsset) {
            return error(res, 'Asset not found', 404);
        }

        const result = await assetModel.delete(id);
        if (!result.success) {
            return error(res, result.message || 'Asset deletion failed', 500);
        }

        historyModel.log(id, 'Asset', 'Asset Deleted', 'Asset was removed from the system', user.id).catch(() => {});
        notificationModel.notifyAdmins('Asset Deleted', `Asset '${oldAsset.name}' (ID: ${id}) was deleted by ${user.name}.`, 'error', id).catch(() => {});

        return success(res, null, 'Asset deleted successfully');
    }

    /**
     * Bulk import assets
     */
    async bulkImport(req, res) {
        const user = req.user;
        const data = req.body || {};
        const assets = data.assets;

        if (!Array.isArray(assets) || assets.length === 0) {
            return error(res, 'Invalid or empty assets data', 400);
        }

        const results = {
            total: assets.length,
            success: 0,
            failed: 0,
            errors: []
        };

        for (let i = 0; i < assets.length; i++) {
            const assetData = assets[i];
            const name = assetData.name;
            const majorCategory = assetData.majorCategory || assetData.major_category;
            const category = assetData.category;

            if (!name || !majorCategory || !category) {
                results.failed++;
                results.errors.push(`Row ${i + 1}: Name, major category, and category are required`);
                continue;
            }

            assetData.createdBy = user.id;
            assetData.approvalStatus = 'Pending';

            // Check duplicate
            const duplicateId = await assetModel.findDuplicate(assetData);
            if (duplicateId) {
                results.failed++;
                results.errors.push(`Row ${i + 1}: Asset '${name}' already exists (ID: ${duplicateId}). Skipped.`);
                continue;
            }

            const result = await assetModel.create(assetData);
            if (result.success) {
                results.success++;
                historyModel.log(
                    result.id,
                    assetData.assetType || 'Asset',
                    'Asset Bulk Imported',
                    `Asset '${name}' was bulk imported by ${user.name || user.email}`,
                    user.id
                ).catch(() => {});
            } else {
                results.failed++;
                results.errors.push(`Row ${i + 1}: ${result.message}`);
            }
        }

        if (results.success > 0) {
            notificationModel.notifyAdmins(
                'Bulk Asset Import',
                `${results.success} assets were successfully imported by ${user.name}.`,
                'success'
            ).catch(() => {});
        }

        return success(
            res,
            results,
            `Bulk import completed. ${results.success} successful, ${results.failed} failed.`
        );
    }

    /**
     * Upload asset receipt / scanned document
     */
    async uploadReceipt(req, res) {
        const user = req.user;
        const assetId = req.body.asset_id || req.query.asset_id;

        if (!assetId) {
            return error(res, 'asset_id is required', 400);
        }

        if (!req.file) {
            return error(res, 'No valid file uploaded', 400);
        }

        const receiptUrl = `/uploads/receipts/${req.file.filename}`;

        const updateResult = await assetModel.update(assetId, { receipt_url: receiptUrl });
        if (!updateResult.success) {
            return error(res, 'Failed to update asset record with receipt URL', 500);
        }

        historyModel.log(
            assetId,
            'Asset',
            'Receipt Uploaded',
            `A receipt/scan was uploaded by ${user.name || user.email}`,
            user.id
        ).catch(() => {});

        return success(res, { receipt_url: receiptUrl }, 'Receipt uploaded successfully');
    }
}

module.exports = new AssetController();
