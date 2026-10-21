const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');

const receiptsDir = path.join(config.uploadDir, 'receipts');

// Ensure upload directories exist
if (!fs.existsSync(config.uploadDir)) {
    fs.mkdirSync(config.uploadDir, { recursive: true });
}
if (!fs.existsSync(receiptsDir)) {
    fs.mkdirSync(receiptsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, receiptsDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const prefix = req.body.task_id ? 'maint_receipt' : 'receipt';
        const rawId = req.body.task_id || req.body.asset_id || 'doc';
        const safeId = String(rawId).replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `${prefix}_${safeId}_${Date.now()}${ext}`;
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedExts = ['.jpg', '.jpeg', '.png', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (!allowedExts.includes(ext)) {
        return cb(new Error('Only JPG, PNG, and PDF files are allowed'), false);
    }
    cb(null, true);
};

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter
});

module.exports = upload;
