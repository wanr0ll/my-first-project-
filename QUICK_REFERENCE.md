# Quick Reference Card - Frontend API Integration

## 🚀 Get Started in 5 Minutes

```bash
# 1. Start XAMPP (Apache + MySQL)
# Open XAMPP Control Panel → Start Apache & MySQL

# 2. Create Database
# http://localhost/phpmyadmin
# Create: gha_asset_manager
# Import: backend/database/schema.sql

# 3. Start Frontend
cd frontend
npm install
npm run dev

# 4. Open Browser
# http://localhost:5173

# 5. Login
# Email: admin@gha.gov.gh
# Password: admin123
```

---

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `frontend/src/services/api.js` | API client service |
| `frontend/src/context/AuthContext.jsx` | Authentication (uses API) |
| `frontend/src/context/AssetContext.jsx` | Asset management (uses API) |
| `frontend/src/context/MaintenanceContext.jsx` | Maintenance tasks (uses API) |
| `frontend/.env` | API URL configuration |

---

## 📡 API Usage Examples

### Login
```javascript
import { login } from '@/services/api';

const result = await login('admin@gha.gov.gh', 'admin123');
// Returns: { success: true, data: { user: {...}, token: '...' } }
```

### Get Assets
```javascript
import { getAssets } from '@/services/api';

const response = await getAssets('vehicles', 1, 10, {
    status: 'Active',
    division: 'Transport'
});
// Returns: { success: true, data: [...], pagination: {...} }
```

### Create Asset
```javascript
import { createAsset } from '@/services/api';

const result = await createAsset({
    category: 'vehicles',
    name: 'Toyota Coaster',
    type: 'Bus',
    plate_number: 'GV 123-24'
});
```

### Update Asset
```javascript
import { updateAsset } from '@/services/api';

const result = await updateAsset({
    category: 'vehicles',
    id: 'V001',
    status: 'Maintenance'
});
```

### Delete Asset
```javascript
import { deleteAsset } from '@/services/api';

const result = await deleteAsset('vehicles', 'V001');
```

---

## 🔐 Token Management

```javascript
import { APIClient } from '@/services/api';

const client = new APIClient();

// Get token
const token = client.getToken();

// Set token manually
client.setToken(myToken);

// Clear token (logout)
client.clearAuth();

// Token stored in: localStorage.getItem('auth_token')
```

---

## 🎨 Using in Components

### Using AuthContext
```javascript
import { useAuth } from '@/context/AuthContext';

function MyComponent() {
    const { user, isAuthenticated, loading, login, logout } = useAuth();

    return (
        <div>
            {loading && <p>Loading...</p>}
            {isAuthenticated ? (
                <>
                    <p>Hello, {user.name}</p>
                    <button onClick={logout}>Logout</button>
                </>
            ) : (
                <p>Please login</p>
            )}
        </div>
    );
}
```

### Using AssetContext
```javascript
import { useAssets } from '@/context/AssetContext';

function AssetList() {
    const { assets, loading, addAsset, updateAsset, deleteAsset } = useAssets();

    const handleCreate = async () => {
        const result = await addAsset('vehicles', {
            name: 'New Vehicle',
            type: 'Bus',
            // ... other fields
        });
        if (result.success) {
            console.log('Created:', result.id);
        }
    };

    return (
        <div>
            {loading ? <p>Loading...</p> : (
                <ul>
                    {assets.vehicles?.map(v => (
                        <li key={v.id}>{v.name}</li>
                    ))}
                </ul>
            )}
        </div>
    );
}
```

---

## 🔍 Debugging

### Check Token
```javascript
// In browser console
localStorage.getItem('auth_token')
```

### Make Raw API Call
```javascript
// In browser console
fetch('http://localhost/gha-asset-manager/backend/api/users', {
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    }
}).then(r => r.json()).then(console.log)
```

### Check Network Requests
```
DevTools → Network tab → Filter by "api"
Click request → check Headers & Response
```

### View Errors
```
DevTools → Console → Look for red error messages
Check: browser console
Check: backend/logs/error.log
```

---

## 🛠️ Common Tasks

### Add New API Endpoint

**1. Add to backend first** (`backend/api/index.php`)

**2. Add function to** `frontend/src/services/api.js`:
```javascript
export async function myNewFunction(param) {
    const client = new APIClient();
    return client.get('my-endpoint', { param });
}
```

**3. Use in context/component**:
```javascript
import { myNewFunction } from '@/services/api';
const result = await myNewFunction(value);
```

### Add Loading State
```javascript
const [isLoading, setIsLoading] = useState(false);

const handleClick = async () => {
    setIsLoading(true);
    try {
        await myApiCall();
    } finally {
        setIsLoading(false);
    }
};

return <button disabled={isLoading}>
    {isLoading ? 'Loading...' : 'Click me'}
</button>;
```

### Add Error Handling
```javascript
try {
    const result = await API.login(email, password);
    if (result.success) {
        // Success
    } else {
        // API returned error
        console.error(result.message);
    }
} catch (error) {
    // Network or other error
    console.error(error.message);
    addToast(error.message, 'error');
}
```

---

## ⚙️ Configuration

### Change API URL
Edit `.env`:
```env
VITE_API_URL=http://localhost/gha-asset-manager/backend/api
```

Or `.env.production` for production:
```env
VITE_API_URL=https://yourdomain.com/api
```

---

## 📋 Checklist

Before deploying:

- [ ] Backend API is running
- [ ] Database is created and schema imported
- [ ] Frontend can login successfully
- [ ] Token is stored in localStorage
- [ ] No console errors
- [ ] API calls shown in Network tab
- [ ] Assets load from API
- [ ] CRUD operations work
- [ ] Error handling works

---

## 🆘 Troubleshooting Quick Fixes

| Issue | Fix |
|-------|-----|
| 401 Unauthorized | Login again, token expired |
| CORS Error | Check ALLOWED_ORIGINS in backend config |
| 404 Not Found | Check API endpoint path is correct |
| Database Error | Start MySQL, verify database exists |
| API not responding | Start Apache, verify backend is running |
| Token not stored | Check localStorage in DevTools |

---

## 📚 Full Documentation

- **SETUP_GUIDE.md** - Complete setup from scratch
- **CHANGES_SUMMARY.md** - Before/after code comparison
- **API_INTEGRATION.md** - Detailed integration guide
- **API_DOCUMENTATION.md** - All API endpoints

---

## 🎯 Test Credentials

```
Email: admin@gha.gov.gh
Password: admin123
```

Other users available in database (see schema.sql)

---

## 📞 Quick Support

### Check Backend
```bash
curl http://localhost/gha-asset-manager/backend/api/health
# Should return: {"success": true, "data": {"status": "ok"}}
```

### Check Frontend Build
```bash
cd frontend
npm run dev
# Should start on http://localhost:5173
```

### View Error Logs
```bash
# Frontend errors: Browser console (F12)
# Backend errors: backend/logs/error.log
# Database errors: phpMyAdmin logs
```

---

**Version**: 1.0.0  
**Status**: ✅ Ready to Use  
**Last Updated**: February 13, 2026
