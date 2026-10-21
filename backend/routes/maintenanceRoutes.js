const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const { requireAuth, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/upload_receipt', requireAuth, upload.single('receipt'), (req, res) => maintenanceController.uploadReceipt(req, res));

router.get('/', requireAuth, (req, res) => {
    if (req.query.id) {
        return maintenanceController.getTaskById(req, res);
    }
    return maintenanceController.getTasks(req, res);
});
router.post('/', requireAuth, (req, res) => maintenanceController.createTask(req, res));
router.put('/', requireAuth, (req, res) => maintenanceController.updateTask(req, res));
router.delete('/', requireAuth, requireRole(['Super Admin', 'CEO']), (req, res) => maintenanceController.deleteTask(req, res));

router.get('/:id', requireAuth, (req, res) => maintenanceController.getTaskById(req, res));
router.put('/:id', requireAuth, (req, res) => maintenanceController.updateTask(req, res));
router.delete('/:id', requireAuth, requireRole(['Super Admin', 'CEO']), (req, res) => maintenanceController.deleteTask(req, res));

module.exports = router;
