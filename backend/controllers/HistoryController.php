<?php
/**
 * History Controller
 */

class HistoryController {
    private $historyModel;

    public function __construct($historyModel) {
        $this->historyModel = $historyModel;
    }

    /**
     * Get recent activity logs
     */
    public function getRecent() {
        Middleware::requireAuth();
        
        $limit = Request::getParam('limit', 20);
        $data = $this->historyModel->getAll($limit);

        Response::success($data, 'Recent activity retrieved successfully');
    }

    /**
     * Get history for a specific asset
     */
    public function getByAssetId() {
        Middleware::requireAuth();
        
        $asset_id = Request::getParam('asset_id');
        if (empty($asset_id)) {
            Response::error('Asset ID is required', 400);
        }

        $limit = Request::getParam('limit', 50);
        $data = $this->historyModel->getByAssetId($asset_id, $limit);

        Response::success($data, 'Asset history retrieved successfully');
    }
}
