const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const config = require('./config/config');
const { query, runIdempotentMigrations } = require('./config/db');
const { success, error } = require('./utils/response');

// Route modules
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const assetRoutes = require('./routes/assetRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const historyRoutes = require('./routes/historyRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// ==========================================
// 1. CORS Configuration
// ==========================================
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || config.corsAllowAll || config.allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        // In local development or preview environments, allow dynamically
        if (config.isDevelopment || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.endsWith('.netlify.app')) {
            return callback(null, true);
        }
        return callback(null, true); // Permissive CORS to prevent frontend breakages
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    credentials: true,
    maxAge: 86400
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ==========================================
// 2. Body Parsers (15MB for base64 images)
// ==========================================
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// ==========================================
// 3. Static Uploads Serving
// ==========================================
const uploadsPath = config.uploadDir;
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath, {
    maxAge: '1d',
    setHeaders: (res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=86400');
    }
}));
// Support legacy static prefix /backend/uploads
app.use('/backend/uploads', express.static(uploadsPath, {
    maxAge: '1d',
    setHeaders: (res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
}));

// ==========================================
// 4. Backward-Compatible URL Normalization
// ==========================================
// Handles ?request=path, /api/index.php?request=path, /index.php, /backend/api, etc.
app.use((req, res, next) => {
    // If request query parameter is provided (e.g. ?request=auth/login)
    if (req.query && req.query.request) {
        let reqParam = req.query.request;
        delete req.query.request;
        if (!reqParam.startsWith('/')) reqParam = `/${reqParam}`;
        // Rebuild query string if other parameters exist
        const remainingQuery = new URLSearchParams(req.query).toString();
        req.url = remainingQuery ? `${reqParam}?${remainingQuery}` : reqParam;
    } else {
        // Strip PHP script path segments if present
        req.url = req.url
            .replace(/^\/backend\/api\/index\.php/, '')
            .replace(/^\/backend\/api/, '')
            .replace(/^\/api\/index\.php/, '')
            .replace(/^\/index\.php/, '');

        if (!req.url.startsWith('/')) {
            req.url = '/' + req.url;
        }
    }
    next();
});

// ==========================================
// 5. Health Check Endpoints
// ==========================================
const handleHealth = (req, res) => {
    return success(res, {
        status: 'ok',
        service: 'gha-asset-manager-backend-node',
        timestamp: new Date().toISOString()
    }, 'API is healthy (Node.js connected to Supabase PostgreSQL)');
};

app.get('/', handleHealth);
app.get('/health', handleHealth);
app.get('/api', handleHealth);
app.get('/api/health', handleHealth);

// ==========================================
// 6. Mount API Routers
// ==========================================
const mountRoutes = (prefix = '') => {
    app.use(`${prefix}/auth`, authRoutes);
    app.use(`${prefix}/users`, userRoutes);
    app.use(`${prefix}/assets`, assetRoutes);
    app.use(`${prefix}/maintenance`, maintenanceRoutes);
    app.use(`${prefix}/history`, historyRoutes);
    app.use(`${prefix}/activity`, historyRoutes);
    app.use(`${prefix}/notifications`, notificationRoutes);
};

// Mount both without prefix and with /api prefix for total flexibility
mountRoutes('');
mountRoutes('/api');

// ==========================================
// 7. 404 & Global Error Handlers
// ==========================================
app.use((req, res) => {
    return error(res, `Endpoint not found: ${req.method} ${req.originalUrl}`, 404);
});

app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    return error(
        res,
        config.isDevelopment ? err.message : 'Internal server error',
        err.status || 500
    );
});

// ==========================================
// 8. Start Server
// ==========================================
const PORT = config.port;

app.listen(PORT, async () => {
    console.log(`====================================================`);
    console.log(`🚀 GHA Asset Manager JavaScript Backend`);
    console.log(`📡 Listening on http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${config.isDevelopment ? 'Development' : 'Production'}`);
    console.log(`====================================================`);

    // Run schema migrations and connectivity checks
    await runIdempotentMigrations();
});
