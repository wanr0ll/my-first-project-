const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, (req, res) => {
    if (req.query.asset_id) {
        return historyController.getByAssetId(req, res);
    }
    return historyController.getRecent(req, res);
});

module.exports = router;
