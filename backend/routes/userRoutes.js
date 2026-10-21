const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Profile upload and ping
router.post('/upload_profile', requireAuth, (req, res) => userController.uploadProfileImage(req, res));
router.post('/ping', requireAuth, (req, res) => userController.ping(req, res));

// Base users route (supports query id or pagination)
router.get('/', requireAuth, (req, res) => {
    if (req.query.id) {
        return userController.getById(req, res);
    }
    return requireRole(['Super Admin'])(req, res, () => userController.getAll(req, res));
});

router.post('/', requireAuth, requireRole(['Super Admin']), (req, res) => userController.create(req, res));
router.put('/', requireAuth, (req, res) => userController.update(req, res));
router.delete('/', requireAuth, requireRole(['Super Admin']), (req, res) => userController.delete(req, res));

// By ID routes
router.get('/:id', requireAuth, (req, res) => userController.getById(req, res));
router.put('/:id', requireAuth, (req, res) => userController.update(req, res));
router.delete('/:id', requireAuth, requireRole(['Super Admin']), (req, res) => userController.delete(req, res));

module.exports = router;
