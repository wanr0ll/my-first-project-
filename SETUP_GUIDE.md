# GHA Asset Manager - Complete Setup & Running Guide

## Quick Start (5 Minutes)

### Prerequisites
- XAMPP installed (with Apache and MySQL)
- Node.js installed (for frontend)
- Project folder: `C:\xampp\htdocs\gha-asset-manager\`

### Step 1: Start Backend Services
```bash
1. Open XAMPP Control Panel
2. Click "Start" next to Apache
3. Click "Start" next to MySQL
4. Wait for both to turn green
```

### Step 2: Setup Database
```bash
1. Open http://localhost/phpmyadmin
2. Create database: gha_asset_manager
3. Select database → Import tab
4. Upload: C:\xampp\htdocs\gha-asset-manager\backend\database\schema.sql
5. Click "Go"
```

### Step 3: Test Backend API
```bash
1. Open browser: http://localhost/gha-asset-manager/backend/api/health
2. You should see: {"success": true, "data": {"status": "ok"}}
```

### Step 4: Start Frontend
```bash
cd C:\xampp\htdocs\gha-asset-manager\frontend
npm install
npm run dev
```

### Step 5: Access Application
```
http://localhost:5173
```

### Step 6: Login
```
Email: admin@gha.gov.gh
Password: admin123
```

---

## Detailed Setup Instructions

### Backend Setup

#### 1. Project Structure
```
C:\xampp\htdocs\gha-asset-manager\
├── backend/
│   ├── api/
│   │   ├── index.php       ← Main API entry point
│   │   └── .htaccess
│   ├── config/
│   │   ├── Database.php
│   │   └── config.php
│   ├── models/
│   ├── controllers/
│   ├── utils/
│   ├── database/
│   │   └── schema.sql
│   ├── logs/              ← Auto-created
│   └── README.md
├── frontend/
└── ...
```

#### 2. Database Setup

**Via phpMyAdmin (GUI)**:
1. `http://localhost/phpmyadmin`
2. Create: `gha_asset_manager`
3. Import: `backend/database/schema.sql`

**Via Command Line**:
```bash
mysql -u root -p < backend/database/schema.sql
```

**Verify Tables**:
```sql
USE gha_asset_manager;
SHOW TABLES;
-- Should show: users, vehicles, furniture, electronics, indoor_devices, maintenance_tasks, asset_history, notifications
```

#### 3. Configuration (Optional)

If using non-default XAMPP credentials, update:
```
backend/config/config.php
```

Default settings:
```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');  // Empty for XAMPP default
define('DB_NAME', 'gha_asset_manager');
```

#### 4. Test Backend

```bash
# Health check
curl http://localhost/gha-asset-manager/backend/api/health

# Login
curl -X POST http://localhost/gha-asset-manager/backend/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gha.gov.gh","password":"admin123"}'
```

---

### Frontend Setup

#### 1. Install Dependencies
```bash
cd frontend
npm install
```

#### 2. Configuration

Frontend API URL is automatically configured in:
```
.env       # Default API URL
.env.development  # Dev environment
```

Current setting:
```env
VITE_API_URL=http://localhost/gha-asset-manager/backend/api
```

If API runs on different port/URL, update these files.

#### 3. Start Development Server
```bash
npm run dev
```

Server will start at: `http://localhost:5173`

#### 4. Build for Production
```bash
npm run build
npm run preview
```

---

## Testing the Integration

### 1. Test Login Flow

```bash
# Open: http://localhost:5173
# Select "Admin Portal" or "Staff Login"
# Email: admin@gha.gov.gh
# Password: admin123
```

### 2. Check Browser Console

Open DevTools (F12) and check:
- **Application → LocalStorage**: Should have `auth_token`
- **Network tab**: Should see API requests to `/backend/api/...`
- **Console**: Should have no CORS or fetch errors

### 3. Test API Calls

In browser console:
```javascript
// Get stored token
localStorage.getItem('auth_token')

// Make API request
fetch('http://localhost/gha-asset-manager/backend/api/users', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
  }
}).then(r => r.json()).then(console.log)
```

### 4. Test Asset Operations

1. Go to "Asset Inventory"
2. Create new asset
3. Check Network tab → POST request to `/assets`
4. Update/Delete asset
5. Check logs for any errors

---

## Common Issues & Solutions

### Issue: "Cannot GET /gha-asset-manager/backend/api/health"

**Cause**: .htaccess not working or ModRewrite not enabled

**Solution**:
1. Verify `.htaccess` exists in `backend/api/` folder
2. Check Apache module mod_rewrite is enabled:
   - Edit `C:\xampp\apache\conf\httpd.conf`
   - Search for `LoadModule rewrite_module modules/mod_rewrite.so`
   - Ensure it's NOT commented out
   - Restart Apache

### Issue: "Database connection failed"

**Cause**: MySQL not running or wrong credentials

**Solution**:
1. Ensure MySQL running in XAMPP Control Panel (green status)
2. Verify database exists: `http://localhost/phpmyadmin`
3. Check credentials in `backend/config/config.php`
4. Test MySQL connection:
   ```bash
   mysql -u root -p
   ```

### Issue: CORS Error when logging in

**Cause**: Frontend URL not in allowed origins

**Solution**:
Update `backend/config/config.php`:
```php
define('ALLOWED_ORIGINS', [
    'http://localhost:5173',  // Your frontend URL
    'http://localhost:3000',
    'http://127.0.0.1:5173'
]);
```
Restart Apache.

### Issue: "Invalid credentials" on login

**Cause**: Database empty or user doesn't exist

**Solution**:
1. Verify schema was imported: `http://localhost/phpmyadmin`
2. Check users table has data:
   ```sql
   SELECT * FROM users LIMIT 1;
   ```
3. Re-import schema.sql if needed

### Issue: "401 Unauthorized" after login

**Cause**: Token invalid or expired

**Solution**:
1. Check token in localStorage: `localStorage.getItem('auth_token')`
2. Token expires after 24 hours
3. Login again to get new token
4. Check token is included in requests:
   - DevTools → Network tab
   - Headers should have: `Authorization: Bearer ...`

### Issue: Assets not loading on dashboard

**Cause**: API not responding or assets table empty

**Solution**:
1. Check API is running: `http://localhost/gha-asset-manager/backend/api/health`
2. Check database has assets:
   ```sql
   SELECT COUNT(*) FROM vehicles;
   ```
3. Verify authentication token is valid
4. Check browser console for errors

---

## Project Architecture

### Frontend (React + Vite)
```
components/    - Reusable UI components
├── Modal.jsx
├── Toast.jsx
├── NotificationBell.jsx
└── ...

pages/         - Page components
├── Login.jsx
├── Dashboard.jsx
├── AssetInventory.jsx
└── ...

context/       - React Context (State Management)
├── AuthContext.jsx        - Uses API for auth
├── AssetContext.jsx       - Uses API for assets
└── MaintenanceContext.jsx - Uses API for tasks

services/      - API Integration
├── api.js                 - API client with token management
└── emailService.js        - Email service (stub)

utils/         - Utility functions
├── passwordUtils.js
└── financeUtils.js
```

### Backend (PHP + MySQL)
```
api/           - API Router (entry point)
├── index.php  - Main router with all endpoints
└── .htaccess  - URL rewriting

controllers/   - Request handlers
├── AuthController.php
├── UserController.php
├── AssetController.php
└── MaintenanceController.php

models/        - Database operations
├── User.php
├── Asset.php  - (Vehicle, Furniture, Electronics, IndoorDevice)
└── Maintenance.php

config/        - Configuration
├── Database.php
└── config.php

utils/         - Helper classes
├── Response.php    - JSON responses
├── Request.php     - Input handling
├── Middleware.php  - CORS & Auth
└── Auth.php        - JWT tokens

database/      - Database setup
└── schema.sql  - Table definitions
```

---

## API Endpoints Reference

### Authentication
```
POST   /auth/login              - Login
POST   /auth/register           - Register
GET    /auth/me                 - Current user
PUT    /auth/change-password    - Change password
POST   /auth/logout             - Logout
```

### Users
```
GET    /users                   - List users
GET    /users?id=USR001         - Get user
POST   /users                   - Create user
PUT    /users                   - Update user
DELETE /users?id=USR001         - Delete user
```

### Assets
```
GET    /assets/{category}       - List assets
POST   /assets                  - Create asset
PUT    /assets                  - Update asset
DELETE /assets/{category}?id=   - Delete asset
```
Categories: vehicles, furniture, electronics, indoor_devices

### Maintenance
```
GET    /maintenance             - List tasks
POST   /maintenance             - Create task
PUT    /maintenance             - Update task
DELETE /maintenance?id=         - Delete task
```

### Health
```
GET    /health                  - API health check
```

---

## Development Workflow

### 1. Making Backend Changes

```bash
# Edit files in: backend/
# Changes take effect immediately (no build needed)
# Test with: curl or Postman
```

### 2. Making Frontend Changes

```bash
# Edit files in: frontend/src/
# Vite automatically hot-reloads
# Check browser at: http://localhost:5173
```

### 3. Testing New Endpoints

1. **Add to backend**: `backend/controllers/` and `backend/api/index.php`
2. **Add to frontend**: `frontend/src/services/api.js`
3. **Use in contexts**: `frontend/src/context/`

---

## Logs & Debugging

### API Error Logs
```
backend/logs/error.log
```

### Enable Debug Output
Edit `backend/config/config.php`:
```php
define('DEBUG_MODE', true);  // Shows detailed errors
```

### Browser DevTools

**Network Tab**:
- Check API request/response
- Verify Authorization header
- Check response status code

**Console Tab**:
- Look for fetch errors
- Check for unhandled exceptions

**Application Tab**:
- Check localStorage for `auth_token`
- Verify session data

---

## Performance Tips

1. **Minimize API Calls**:
   - Use pagination
   - Filter where possible

2. **Cache Data**:
   - Consider implementing React Query
   - Cache user info after login

3. **Optimize Assets**:
   - Lazy load components
   - Optimize images

4. **Database Indexes**:
   - Already added to schema
   - Check query performance

---

## Security Notes

✅ **Already Implemented**:
- JWT token-based auth (24-hour expiration)
- Password hashing (bcrypt)
- CORS headers
- XSS protection
- SQL injection prevention (prepared statements)

**Production Checklist**:
- [ ] Update API_URL for production domain
- [ ] Set `DEBUG_MODE=false`
- [ ] Set `APP_ENVIRONMENT=production`
- [ ] Update `ALLOWED_ORIGINS` to production domain
- [ ] Use HTTPS in production
- [ ] Update JWT_SECRET to random value
- [ ] Set strong database password
- [ ] Enable SSL/TLS on Apache

---

## Support

### For Backend Issues
See: `backend/README.md` or `backend/API_DOCUMENTATION.md`

### For Frontend Issues
See: `frontend/API_INTEGRATION.md` or `frontend/README.md`

### For Integration Issues
- Check browser console (F12)
- Check `backend/logs/error.log`
- Verify all services are running
- Check network requests in DevTools

---

## Success Indicators

✅ Backend is working when:
- `http://localhost/gha-asset-manager/backend/api/health` returns success
- phpMyAdmin shows `gha_asset_manager` database with tables
- No errors in PHP error logs

✅ Frontend is working when:
- `http://localhost:5173` loads without errors
- Can login with admin@gha.gov.gh / admin123
- Browser console has no CORS errors
- Network tab shows successful API requests

✅ Integration is working when:
- Login succeeds
- `auth_token` appears in localStorage
- Assets load on dashboard
- Create/Edit/Delete operations work
- Maintenance tasks appear

---

## Next Steps

1. ✅ Backend API is running
2. ✅ Frontend is connected to API
3. 🔄 Test all features thoroughly
4. 📊 Monitor logs for errors
5. 🚀 Deploy to production when ready

---

**Status**: Ready for Development & Testing  
**Last Updated**: February 13, 2026  
**Version**: 1.0.0
