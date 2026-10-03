# GHA Asset Manager - AI Coding Instructions

## Project Overview
A full-stack asset management system for Ghana Health Service. **React 19 + Vite frontend** communicates with a **PHP REST API backend** using JWT authentication. All data persists in **MySQL** via XAMPP.

## Architecture & Key Flows

### Backend Router Pattern
[api/index.php](../../backend/api/index.php) is the single entry point. Routing logic:
- Extracts `request` query param, splits by `/` (e.g., `auth/login` → endpoint=`auth`, action=`login`)
- Instantiates models and controllers once 
- Routes to controller methods via `switch` statements
- **All responses use [Response.php](../../backend/utils/Response.php)**: `{success, message, data, timestamp}`
- Pagination: adds `pagination: {total, page, per_page, total_pages}`

### Frontend API Flow
[services/api.js](../../frontend/src/services/api.js) provides APIClient class:
- `setToken(token)` - stores JWT in localStorage and request headers as `Authorization: Bearer {token}`
- Auto-clears auth on 401 response and redirects to `/login`
- All context hooks call API methods → API methods call `APIClient.request(endpoint, options)`
- **No local state persistence**: always fetch from API (see AssetContext refactor in CHANGES_SUMMARY.md)

### Asset Type Routing
Four separate models handle asset categories (see [AssetController.php](../../backend/controllers/AssetController.php)):
- `Vehicle`, `Furniture`, `Electronics`, `IndoorDevice` 
- Each has own DB operations but same interface (getAll, getById, create, update, delete)
- Frontend treats as array under keys: `vehicles`, `furniture`, `electronics`, `indoorDevices`
- API calls include `category` param in query or body

### State Management (Context API)
No Redux/Zustand. Each context ([AuthContext.jsx](../../frontend/src/context/AuthContext.jsx), [AssetContext.jsx](../../frontend/src/context/AssetContext.jsx), etc.):
- Wraps App in provider
- Exposes hook (e.g., `useAssets()`) with state + mutation methods
- Mutation methods call API → reload context data via `loadAssets()` on success
- Show Toast via `useToast()` hook (in components/Toast.jsx)

## Development Setup

### Start Services
```bash
# 1. XAMPP Control Panel: Start Apache & MySQL
# 2. phpMyAdmin: Create database gha_asset_manager, Import backend/database/schema.sql
# 3. Backend auto-runs on http://localhost/gha-asset-manager/backend/api
```

### Frontend Dev Loop
```bash
cd frontend
npm install
npm run dev  # Vite hot reload on http://localhost:5173
```

**Login credentials** (seeded in schema.sql):
- Email: `admin@gha.gov.gh` / Password: `admin123`

### Testing Backend API
Use curl/Postman to hit `http://localhost/gha-asset-manager/backend/api/{endpoint}?request={path}` query param format.
Example: `GET http://localhost/gha-asset-manager/backend/api?request=assets/vehicles&page=1&per_page=10` with `Authorization: Bearer {token}`

## Project Conventions & Patterns

### Backend (PHP)
- **Middleware checks**: `Middleware::requireAuth()` (any logged-in user), `Middleware::requireAdmin()` (admin only)
- **Validation**: use `Request::getParam()`, `Request::getJSON()`, check for empty values
- **Error responses**: `Response::error($message, $httpCode, $errors_array)` 
- **Success responses**: `Response::success($data, $message, $code=200)` or `Response::paginated()` for lists
- **Models**: accept filters array (status, division, search), return pagination metadata
- **Config**: [config.php](../../backend/config/config.php) has DB creds (localhost/root/empty), JWT secret, CORS origins, upload settings

### Frontend (React)
- **File structure**: pages/ (route components), components/ (reusable), context/ (providers), services/ (API), utils/ (helpers)
- **CSS**: TailwindCSS 4.x (not Bootstrap)
- **Animations**: Framer Motion (see components/Modal.jsx for examples)
- **Charts**: Recharts (used in Dashboard.jsx, ReportsAnalytics.jsx)
- **Icons**: lucide-react (see components/)
- **Routing**: React Router v7 via [App.jsx](../../frontend/src/App.jsx), protected routes via ProtectedRoute.jsx
- **Async patterns**: use try/catch with API calls, always set loading state manually (no built-in suspense)
- **Toast notifications**: import `{ useToast }` from 'components/Toast', call `addToast(message, 'success'|'error'|'info')`

### Environment Variables
Frontend `.env` and `.env.development` define `VITE_API_URL` (defaults to http://localhost/gha-asset-manager/backend/api).
Backend config.php has hardcoded DB & JWT settings - change for production.

## Common Tasks

### Add New API Endpoint
1. Create method in controller (e.g., `AssetController->export()`)
2. Add route in [api/index.php](../../backend/api/index.php) switch statement
3. Use `Middleware::requireAuth()` or `Middleware::requireAdmin()` at start
4. Parse params with `Request::getParam()` or `Request::getJSON()`
5. Validate, call model, return `Response::success()` or `Response::error()`
6. Frontend: add method to API client in [services/api.js](../../frontend/src/services/api.js), call from context mutation method

### Add Frontend Page
1. Create component in `pages/` (named PascalCase)
2. Add route in [App.jsx](../../frontend/src/App.jsx) 
3. If protected route, wrap in `<ProtectedRoute roles={['admin']}></ProtectedRoute>`
4. Use hooks: `useAssets()`, `useAuth()`, `useToast()`, `useNavigate()` from React Router
5. Style with TailwindCSS classes, use lucide-react icons
6. Make API calls via context methods (not directly calling api.js)

### Modify Asset Categories
Changing from 4 asset types requires:
1. Backend: update [schema.sql](../../backend/database/schema.sql), regenerate Model classes, update [AssetController.php](../../backend/controllers/AssetController.php) getModel()
2. Frontend: update [AssetContext.jsx](../../frontend/src/context/AssetContext.jsx) state shape, categories array, Promise.all calls
3. Update [api.js](../../frontend/src/services/api.js) category param usage

## Debugging Notes

- **401 errors**: JWT expired or missing. Check localStorage `auth_token`, verify JWT_SECRET in config.php
- **CORS errors**: Check ALLOWED_ORIGINS in config.php matches frontend URL
- **Empty responses**: Verify schema imported, check error.log in logs/ directory
- **Frontend not connecting**: Ensure VITE_API_URL correct in .env, XAMPP running, backend responding to health endpoint
- **Database locked**: Restart MySQL from XAMPP Control Panel

## Key Files Reference
- [backend/api/index.php](../../backend/api/index.php) - Router
- [backend/utils/Response.php](../../backend/utils/Response.php) - Response format
- [backend/utils/Auth.php](../../backend/utils/Auth.php) - JWT token handling
- [backend/config/Database.php](../../backend/config/Database.php) - MySQLi connection
- [frontend/src/services/api.js](../../frontend/src/services/api.js) - API client
- [frontend/src/App.jsx](../../frontend/src/App.jsx) - Routes & App shell
- [frontend/src/context/AssetContext.jsx](../../frontend/src/context/AssetContext.jsx) - Asset state pattern example
