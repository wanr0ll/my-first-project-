const historyModel = require('../models/historyModel');
const { success, error } = require('../utils/response');

class HistoryController {
    /**
     * Get recent activity
     */
    async getRecent(req, res) {
        const limit = parseInt(req.query.limit, 10) || 20;
        const data = await historyModel.getAll(limit);
        return success(res, data, 'Recent activity retrieved successfully');
    }

    /**
     * Get history for specific asset
     */
    async getByAssetId(req, res) {
        const assetId = req.query.asset_id;
        if (!assetId) {
            return error(res, 'Asset ID is required', 400);
        }

        const limit = parseInt(req.query.limit, 10) || 50;
        const data = await historyModel.getByAssetId(assetId, limit);
        return success(res, data, 'Asset history retrieved successfully');
    }
}

module.exports = new HistoryController();
