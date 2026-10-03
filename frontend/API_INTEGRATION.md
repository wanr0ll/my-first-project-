# Frontend API Integration - Setup Guide

## Overview
The React frontend has been fully updated to use the PHP REST API backend. All data operations now go through the API instead of localStorage.

## What Was Updated

### 1. **API Service** (`src/services/api.js`)
- Complete API client with automatic token management
- Methods for all endpoints: Authentication, Users, Assets, Maintenance
- Automatic token refresh on 401 errors
- Error handling and logging

### 2. **Authentication Context** (`src/context/AuthContext.jsx`)
- Uses API for login/signup/password change
- Stores JWT token in localStorage
- Auto-checks authentication on app load
- Async operations with proper error handling

### 3. **Asset Context** (`src/context/AssetContext.jsx`)
- Loads assets from API instead of localStorage
- API calls for create, update, delete operations
- Automatic reload after mutations
- Pagination and filtering support

### 4. **Maintenance Context** (`src/context/MaintenanceContext.jsx`)
- Loads maintenance tasks from API
- API calls for task management
- Automatic reload after changes

### 5. **Login Page** (`src/pages/Login.jsx`)
- Async login/signup handlers
- Loading states with spinners
- Better error handling

## Configuration

### Environment Variables

Create a `.env` file in the frontend root:

```env
VITE_API_URL=http://localhost/gha-asset-manager/backend/api
```

Or use the `.env.development` file for development:

```env
VITE_API_URL=http://localhost/gha-asset-manager/backend/api
```

**Note**: The API URL is already configured in both files.

## Setup Steps

### 1. Ensure Backend is Running

```bash
# XAMPP must be running with:
# - Apache started
# - MySQL started
# - Database created: gha_asset_manager
# - Schema imported: backend/database/schema.sql
```

### 2. Start Frontend Development Server

```bash
cd frontend
npm install  # if not already done
npm run dev
```

Frontend will be available at: `http://localhost:5173`

### 3. Test API Connection

Open browser console and check for any CORS errors.

Try logging in with:
```
Email: admin@gha.gov.gh
Password: admin123
```

## How It Works

### Authentication Flow

1. **Login**
   ```
   POST /api/auth/login
   → Returns JWT token
   → Token stored in localStorage
   → Used for all subsequent requests
   ```

2. **Auto Check on App Load**
   ```
   GET /api/auth/me (with stored token)
   → Verifies token validity
   → Restores user session
   ```

3. **Token Usage**
   ```
   Every request includes:
   Authorization: Bearer {token}
   ```

### Data Flow

**Before (localStorage)**:
```
React Component → localStorage → Component State → UI
```

**After (API)**:
```
React Component → API Request → Backend → Database → API Response → Component State → UI
```

## API Integration Examples

### Example 1: Login

**Old (localStorage)**:
```javascript
const result = login(email, password);
// Synchronous, searched localStorage
```

**New (API)**:
```javascript
const result = await login(email, password);
// API call to backend, returns JWT token
```

### Example 2: Create Asset

**Old (localStorage)**:
```javascript
addAsset('vehicles', newAsset);
// Updated local state and localStorage
```

**New (API)**:
```javascript
const result = await addAsset('vehicles', newAsset);
// POST to API, reloads all assets from server
```

## Token Management

Token is stored in `localStorage` with key: `auth_token`

**Automatic Removal**:
- On logout: `logout()` clears token
- On 401 response: Token automatically cleared and user redirected to login

**Manual Token Access**:
```javascript
import { APIClient } from '../services/api';

const client = new APIClient();
const token = client.getToken();
```

## Error Handling

All API errors are handled with try-catch and Toast notifications:

```javascript
try {
  await login(email, password);
} catch (error) {
  addToast(error.message, 'error');
}
```

Common errors:
- `401 Unauthorized` → Redirect to login
- `400 Bad Request` → Display validation error
- `500 Internal Server Error` → Generic error message

## CORS Configuration

The backend has CORS enabled for localhost URLs:

**Allowed Origins** (in `backend/config/config.php`):
```php
'http://localhost:5173',  // Vite dev server
'http://localhost:3000',  // Alternative dev port
'http://127.0.0.1:5173'   // Localhost variation
```

If you get CORS errors:
1. Check that frontend and backend URLs are in `ALLOWED_ORIGINS`
2. Ensure backend is running with correct URLs
3. Check browser console for exact error

## Debugging

### Enable Debug Mode

In `backend/config/config.php`:
```php
define('DEBUG_MODE', true);
```

This shows detailed error messages from API.

### Check Logs

View API error logs:
```
backend/logs/error.log
```

### Browser DevTools

Check Network tab to see API requests:
- Headers: Verify `Authorization: Bearer {token}` is present
- Response: Check API response structure
- Console: Look for fetch errors

## Common Issues & Fixes

### Issue: 401 Unauthorized
**Solution**:
- Check if token is stored: `localStorage.getItem('auth_token')`
- Login again to get new token
- Check if token is expired (default 24 hours)

### Issue: CORS Error
**Solution**:
- Verify frontend URL is in backend's `ALLOWED_ORIGINS`
- Ensure correct API_URL in `.env` file
- Check backend is running

### Issue: 404 Not Found
**Solution**:
- Verify API endpoint path is correct
- Check .htaccess is in `backend/api/` folder
- Ensure ModRewrite is enabled

### Issue: Assets not loading
**Solution**:
- Check database has data
- Verify authentication (token is valid)
- Check API logs for errors
- MySQL must be running

## Testing

### Using Postman

1. Create new request
2. Method: POST
3. URL: `http://localhost/gha-asset-manager/backend/api/auth/login`
4. Body (JSON):
   ```json
   {
     "email": "admin@gha.gov.gh",
     "password": "admin123"
   }
   ```
5. Copy token from response
6. Add to Authorization header for other requests

### Test Endpoints

```javascript
// In browser console
import * as API from './services/api';

// Test health
API.healthCheck().then(r => console.log(r));

// Test login
API.login('admin@gha.gov.gh', 'admin123')
  .then(r => console.log(r));

// Test get users (requires valid token)
API.getUsers(1, 10)
  .then(r => console.log(r));
```

## Performance Considerations

### Pagination

All API calls support pagination:
```javascript
const response = await API.getAssets('vehicles', 
  page=1, 
  perPage=10,  // Default: 10
  filters={}
);
```

### Filtering

Filter assets by status, division, or search:
```javascript
const response = await API.getAssets('vehicles', 1, 10, {
  status: 'Active',
  division: 'Transport',
  search: 'Toyota'
});
```

### Caching Strategy

Currently, data is reloaded from API on every CRUD operation for fresh data.

For optimization, consider implementing:
- React Query for caching
- SWR for stale-while-revalidate
- Local state caching with TTL

## Production Deployment

### Before Deployment

1. **Update API URL**:
   ```bash
   # Create .env.production
   VITE_API_URL=https://yourdomain.com/gha-asset-manager/backend/api
   ```

2. **Build Frontend**:
   ```bash
   npm run build
   ```

3. **Backend Configuration**:
   - Update `ALLOWED_ORIGINS` to production domain
   - Set `APP_ENVIRONMENT=production` in `config.php`
   - Set `DEBUG_MODE=false`

## Summary

✅ Frontend now uses API instead of localStorage  
✅ JWT token-based authentication  
✅ Async/await for all API operations  
✅ Automatic error handling and user feedback  
✅ Ready for production  

## Next Steps

1. Test all features in development
2. Verify API calls in browser DevTools
3. Check error logs for any issues
4. Deploy to production when ready
