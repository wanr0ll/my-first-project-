# GHA Asset Manager — Node.js (JavaScript) Backend

The backend has been converted from **PHP** to **JavaScript (Node.js + Express)**.
It connects directly to your **Supabase PostgreSQL** database and supports all frontend API endpoints with 100% backward compatibility.

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in `backend/`:
```bash
cp .env.example .env
```

Ensure your `DATABASE_URL` is configured with your Supabase connection string:
```ini
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
PORT=5000
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret_key_here
BREVO_API_KEY=your_brevo_api_key_here
```

### 3. Start the Server
* **Development mode (auto-reload on change):**
  ```bash
  npm run dev
  ```
* **Production mode:**
  ```bash
  npm start
  ```
The server will run on `http://localhost:5000`.

---

## 📁 Architecture Overview

```
backend/
├── config/
│   ├── config.js         # Environment & CORS configuration
│   └── db.js             # PostgreSQL connection pool (pg.Pool for Supabase)
├── controllers/
│   ├── authController.js         # Login, register, OTP email verification, password reset
│   ├── userController.js         # User CRUD, role management, profile photos
│   ├── assetController.js        # Unified assets CRUD, bulk import, category filtering
│   ├── maintenanceController.js  # Maintenance task scheduling and tracking
│   ├── historyController.js      # Audit trail & activity logs
│   └── notificationController.js # Admin notifications
├── middleware/
│   ├── auth.js           # JWT verification & role authorization (Super Admin, etc.)
│   └── upload.js         # Multer handler for receipt / PDF / image uploads
├── models/
│   ├── userModel.js              # Users table queries & bcrypt authentication
│   ├── assetModel.js             # Unified assets table queries & field mapping
│   ├── maintenanceModel.js       # Maintenance tasks queries
│   ├── historyModel.js           # Audit trail logging
│   └── notificationModel.js      # Notifications queries
├── routes/
│   ├── authRoutes.js             # /api/auth/* and /auth/*
│   ├── userRoutes.js             # /api/users/* and /users/*
│   ├── assetRoutes.js            # /api/assets/* and /assets/*
│   ├── maintenanceRoutes.js      # /api/maintenance/* and /maintenance/*
│   ├── historyRoutes.js          # /api/history/* and /activity/*
│   └── notificationRoutes.js     # /api/notifications/*
├── uploads/
│   └── receipts/         # Uploaded receipts & scanned documents
├── server.js             # Express application entry point (Local development)
└── package.json          # Node.js dependencies & scripts
```

---

## 🌐 API Compatibility

The JavaScript backend supports both:
1. **Modern REST paths:**
   - `POST /api/auth/login`
   - `GET /api/assets`
   - `POST /api/maintenance`
2. **Backward-compatible paths & query strings:**
   - `GET /?request=health`
   - `POST /api?request=auth/login`
   - `GET /api/index.php?request=assets`

Existing passwords created in PHP are **100% compatible** with this JavaScript backend using `bcryptjs`.
