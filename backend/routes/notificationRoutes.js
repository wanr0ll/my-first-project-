const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, (req, res) => notificationController.getMyNotifications(req, res));
router.put('/', requireAuth, (req, res) => notificationController.markAsRead(req, res));
router.delete('/', requireAuth, (req, res) => notificationController.deleteAll(req, res));

module.exports = router;
