const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const { requireAuth, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Specific actions first
router.post('/import', requireAuth, (req, res) => assetController.bulkImport(req, res));
router.post('/upload_receipt', requireAuth, upload.single('receipt'), (req, res) => assetController.uploadReceipt(req, res));
router.put('/transfer', requireAuth, requireRole(['Super Admin', 'CEO', 'Chief Executive', 'Director']), (req, res) => assetController.transfer(req, res));

// Base asset routes
router.get('/', requireAuth, (req, res) => {
    if (req.query.id) {
        return assetController.getById(req, res);
    }
    return assetController.getByCategory(req, res);
});
router.post('/', requireAuth, (req, res) => assetController.create(req, res));
router.put('/', requireAuth, (req, res) => assetController.update(req, res));
router.delete('/', requireAuth, requireRole(['Super Admin', 'CEO']), (req, res) => assetController.delete(req, res));

// Category-based or ID routes
router.get('/:category', requireAuth, (req, res) => {
    if (req.query.id) {
        return assetController.getById(req, res);
    }
    return assetController.getByCategory(req, res);
});
router.delete('/:category', requireAuth, requireRole(['Super Admin', 'CEO']), (req, res) => assetController.delete(req, res));

router.get('/:category/:id', requireAuth, (req, res) => assetController.getById(req, res));
router.delete('/:category/:id', requireAuth, requireRole(['Super Admin', 'CEO']), (req, res) => assetController.delete(req, res));

module.exports = router;
