# Quick Start Guide - GHA Asset Manager Backend

## Prerequisites
- XAMPP installed and running
- PHP 7.4 or higher
- MySQL 5.7 or higher
- Project copied to `C:\xampp\htdocs\gha-asset-manager\`

## 5-Minute Setup

### Step 1: Start XAMPP
1. Open XAMPP Control Panel
2. Click "Start" next to Apache
3. Click "Start" next to MySQL
4. Wait for both to turn green

### Step 2: Create Database
1. Open browser: `http://localhost/phpmyadmin`
2. Click "New" button
3. Database name: `gha_asset_manager`
4. Collation: `utf8mb4_unicode_ci`
5. Click "Create"

### Step 3: Import Schema
1. Click on `gha_asset_manager` database
2. Click "Import" tab
3. Choose file: `C:\xampp\htdocs\gha-asset-manager\backend\database\schema.sql`
4. Click "Go"

### Step 4: Verify Installation
Open in browser:
```
http://localhost/gha-asset-manager/backend/api/health
```

You should see:
```json
{
  "success": true,
  "message": "API is healthy",
  "data": {
    "status": "ok",
    "timestamp": "2024-03-15 10:30:45"
  }
}
```

## Test the API

### Login (Get Token)
```
POST http://localhost/gha-asset-manager/backend/api/auth/login

{
  "email": "admin@gha.gov.gh",
  "password": "admin123"
}
```

### Get Users (Requires Token)
Copy the token from login response, then:
```
GET http://localhost/gha-asset-manager/backend/api/users

Header: 
Authorization: Bearer {token}
```

## Connecting Frontend to Backend

In `frontend/src/App.jsx` or create a `.env` file:

```
VITE_API_URL=http://localhost/gha-asset-manager/backend/api
```

Then in your API calls:
```javascript
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost/gha-asset-manager/backend/api';

// Example login
fetch(`${apiUrl}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@gha.gov.gh', password: 'admin123' })
})
```

## Folder Paths Reference

- **API Entry Point**: `C:\xampp\htdocs\gha-asset-manager\backend\api\index.php`
- **Database Config**: `C:\xampp\htdocs\gha-asset-manager\backend\config\config.php`
- **Database Schema**: `C:\xampp\htdocs\gha-asset-manager\backend\database\schema.sql`
- **Error Logs**: `C:\xampp\htdocs\gha-asset-manager\logs\error.log`
- **Uploads**: `C:\xampp\htdocs\gha-asset-manager\uploads\`

## Common Commands

### View Error Log
```bash
tail -f C:\xampp\htdocs\gha-asset-manager\logs\error.log
```

### Reset Database
1. In phpMyAdmin, drop `gha_asset_manager` database
2. Create new `gha_asset_manager` database
3. Import schema.sql again

### Change Admin Password Database-wise
```sql
USE gha_asset_manager;
UPDATE users SET password = '$2y$10$vvHBZEy.0BJ3SKGY3L7/pOVFB3a0rK4fF4/IZ5ZX3DpT9K4XrV1uK' WHERE id = 'USR001';
```
(This resets to "admin123")

## Frontend Integration

The backend API is ready to accept requests from the React frontend at:
```
http://localhost/gha-asset-manager/backend/api
```

Update the frontend API service to point to this URL and include JWT tokens in requests.

## Next Steps

1. ✅ Backend API is running
2. ✅ Database is configured
3. 📝 Update frontend to connect to backend API
4. 🔄 Replace localStorage persistence with API calls
5. 🔐 Implement JWT token management in frontend

## Support

Check `API_DOCUMENTATION.md` for full API reference and advanced configuration.
