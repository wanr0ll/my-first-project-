# GHA Asset Manager - Backend API Documentation

## Overview
RESTful API backend for the GHA Asset Manager application built with PHP and MySQL, designed to run on XAMPP.

## Technology Stack
- **Language**: PHP 7.4+
- **Database**: MySQL 5.7+
- **Web Server**: Apache (XAMPP)
- **Authentication**: JWT (JSON Web Tokens)
- **Architecture**: MVC Pattern

## Project Structure
```
backend/
├── api/
│   ├── index.php          # Main router
│   └── .htaccess          # URL rewriting configuration
├── config/
│   ├── Database.php       # Database connection class
│   └── config.php         # Global configuration
├── models/
│   ├── User.php           # User model
│   ├── Asset.php          # Asset models (Vehicle, Furniture, Electronics, IndoorDevice)
│   └── Maintenance.php    # Maintenance tasks model
├── controllers/
│   ├── AuthController.php       # Authentication controller
│   ├── UserController.php       # User management controller
│   ├── AssetController.php      # Asset management controller
│   └── MaintenanceController.php # Maintenance tasks controller
├── utils/
│   ├── Response.php       # Standardized API responses
│   ├── Request.php        # Request parsing and validation
│   ├── Middleware.php     # CORS and authentication middleware
│   └── Auth.php           # JWT token handling
└── database/
    └── schema.sql         # Database schema
```

## Setup Instructions

### 1. XAMPP Installation & Configuration

#### If not already installed:
- Download XAMPP from https://www.apachefriends.org/
- Install it (default path is usually `C:\xampp`)
- Start Apache and MySQL from the XAMPP Control Panel

#### Configure Apache:
1. Open `C:\xampp\apache\conf\httpd.conf`
2. Find and enable mod_rewrite (should already be enabled in modern versions):
   ```apache
   LoadModule rewrite_module modules/mod_rewrite.so
   ```
3. Restart Apache

### 2. Project Setup

1. **Copy project to XAMPP**:
   ```bash
   cp -r gha-asset-manager C:\xampp\htdocs\
   ```
   Or copy the entire folder to `C:\xampp\htdocs\`

2. **Verify folder structure**:
   ```
   C:\xampp\htdocs\gha-asset-manager\
   ├── backend\
   ├── frontend\
   └── ...
   ```

### 3. Database Setup

1. **Access phpMyAdmin**:
   - Open browser: `http://localhost/phpmyadmin`
   - Login (default username: root, no password)

2. **Create Database**:
   - Click "New" in left sidebar
   - Create database named: `gha_asset_manager`
   - Collation: `utf8mb4_unicode_ci`

3. **Import Schema**:
   - Select the `gha_asset_manager` database
   - Click "Import" tab
   - Choose file: `backend/database/schema.sql`
   - Click "Go"

4. **Verify Tables**:
   - You should see tables: users, vehicles, furniture, electronics, indoor_devices, maintenance_tasks, asset_history, notifications

### 4. Configuration

The API is configured via `backend/config/config.php`. Default settings:

```php
DB_HOST = 'localhost'
DB_USER = 'root'
DB_PASS = ''         # Empty for XAMPP default
DB_NAME = 'gha_asset_manager'
API_URL = 'http://localhost/gha-asset-manager/backend/api'
FRONTEND_URL = 'http://localhost:5173'  # Vite dev server
```

**To change configuration**:
1. Edit `backend/config/config.php`
2. Update DB credentials if changed in XAMPP
3. Update API/Frontend URLs as needed

## API Endpoints

### Base URL
```
http://localhost/gha-asset-manager/backend/api
```

### Authentication Endpoints

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@gha.gov.gh",
  "password": "admin123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "USR001",
      "name": "Admin User",
      "email": "admin@gha.gov.gh",
      "role": "Administrator",
      "division": "Head Office"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 86400
  }
}
```

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "name": "New User",
  "email": "newuser@gha.gov.gh",
  "password": "SecurePass123",
  "role": "Worker",
  "division": "IT"
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer {token}
```

#### Change Password
```http
PUT /auth/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "current_password": "admin123",
  "new_password": "NewPassword123"
}
```

### User Management Endpoints

#### Get All Users
```http
GET /users?page=1&per_page=10&role=Administrator&division=IT
Authorization: Bearer {token}
```

#### Get User by ID
```http
GET /users?id=USR001
Authorization: Bearer {token}
```

#### Create User
```http
POST /users
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@gha.gov.gh",
  "password": "SecurePass123",
  "phone": "+233123456789",
  "role": "Chief Executive",
  "division": "Maintenance"
}
```

#### Update User
```http
PUT /users?id=USR001
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Name",
  "status": "active",
  "division": "Finance"
}
```

#### Delete User
```http
DELETE /users?id=USR001
Authorization: Bearer {token}
```

### Asset Management Endpoints

#### Get Assets by Category
```http
GET /assets/vehicles?page=1&per_page=10&status=Active&division=Transport
Authorization: Bearer {token}
```

Categories: `vehicles`, `furniture`, `electronics`, `indoor_devices`

#### Get Asset by ID
```http
GET /assets/vehicles?id=V001
Authorization: Bearer {token}
```

#### Create Asset
```http
POST /assets
Authorization: Bearer {token}
Content-Type: application/json

{
  "category": "vehicles",
  "name": "Toyota Coaster",
  "type": "Bus",
  "plate_number": "GV 123-24",
  "status": "Active",
  "division": "Transport",
  "purchase_date": "2024-01-15",
  "purchase_cost": 85000.00
}
```

#### Update Asset
```http
PUT /assets
Authorization: Bearer {token}
Content-Type: application/json

{
  "category": "vehicles",
  "id": "V001",
  "status": "Maintenance",
  "last_service_date": "2024-03-15"
}
```

#### Delete Asset
```http
DELETE /assets/vehicles?id=V001
Authorization: Bearer {token}
```

### Maintenance Task Endpoints

#### Get All Tasks
```http
GET /maintenance?page=1&per_page=10&status=Scheduled&priority=High
Authorization: Bearer {token}
```

#### Get Task by ID
```http
GET /maintenance?id=MT001
Authorization: Bearer {token}
```

#### Create Task
```http
POST /maintenance
Authorization: Bearer {token}
Content-Type: application/json

{
  "asset_id": "V001",
  "asset_type": "vehicles",
  "task_type": "Oil Change",
  "description": "Regular oil change and filter replacement",
  "priority": "Medium",
  "scheduled_date": "2024-04-15",
  "estimated_cost": 150.00
}
```

#### Update Task
```http
PUT /maintenance
Authorization: Bearer {token}
Content-Type: application/json

{
  "id": "MT001",
  "status": "In Progress",
  "actual_cost": 170.00
}
```

#### Delete Task
```http
DELETE /maintenance?id=MT001
Authorization: Bearer {token}
```

### Health Check
```http
GET /health
```

## Default Test Credentials

```
Email: admin@gha.gov.gh
Password: admin123
Role: Administrator
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication.

### How to Use:
1. Login using `/auth/login` endpoint
2. Receive a token in response
3. Include token in all subsequent requests:
   ```http
   Authorization: Bearer {token}
   ```

### Token Details:
- **Algorithm**: HS256
- **Expiration**: 24 hours (86400 seconds)
- **Secret**: Defined in `config.php` (JWT_SECRET)

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": null,
  "timestamp": "2024-03-15 10:30:45"
}
```

### Common Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `405` - Method Not Allowed
- `409` - Conflict (e.g., email exists)
- `500` - Internal Server Error

## Testing the API

### Using Postman:
1. Import the API endpoints
2. Set up environment variables
3. Use the test credentials to login
4. Copy token from response
5. Add to Authorization header for other requests

### Using cURL:
```bash
# Login
curl -X POST http://localhost/gha-asset-manager/backend/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gha.gov.gh","password":"admin123"}'

# Get users with token
curl -X GET http://localhost/gha-asset-manager/backend/api/users \
  -H "Authorization: Bearer {token}"
```

## Common Issues & Troubleshooting

### Issue: 404 on API calls
**Solution**:
- Verify `.htaccess` is in `/api` folder
- Ensure ModRewrite is enabled in Apache
- Check `httpd.conf` for `AllowOverride All`

### Issue: Database connection failed
**Solution**:
- Verify MySQL is running in XAMPP Control Panel
- Check credentials in `config.php`
- Ensure database `gha_asset_manager` exists

### Issue: CORS errors
**Solution**:
- Check `ALLOWED_ORIGINS` in `config.php`
- Add your frontend URL to allowed origins
- Restart Apache after changes

### Issue: Token expired
**Solution**:
- Login again to get new token
- Token lasts 24 hours by default

## File Upload Configuration

Currently configured for:
- **Max file size**: 5MB
- **Allowed types**: jpg, jpeg, png, pdf
- **Upload directory**: `uploads/`

## Security Features

1. **Password Hashing**: bcrypt with cost 10
2. **JWT Authentication**: Token-based stateless auth
3. **CORS**: Configured for frontend origin
4. **Security Headers**: 
   - X-Content-Type-Options
   - X-Frame-Options
   - X-XSS-Protection
5. **Input Sanitization**: All inputs validated and sanitized
6. **SQL Injection Prevention**: Prepared statements used

## Environment Variables

Can be configured in `config.php`:
- `APP_ENVIRONMENT`: development or production
- `DEBUG_MODE`: Enable/disable error output
- `ENABLE_CORS`: Enable/disable CORS

## Support & Documentation

For issues or questions:
1. Check error logs in `logs/error.log`
2. Enable `DEBUG_MODE` in `config.php`
3. Review database schema in `database/schema.sql`
4. Check API response structure

## Future Enhancements

- [ ] Email verification system
- [ ] Password reset functionality
- [ ] File upload for asset documentation
- [ ] Advanced filtering and search
- [ ] Report generation
- [ ] Audit logging (already implemented in database)
- [ ] Two-factor authentication
- [ ] API rate limiting
