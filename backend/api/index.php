<?php

// Serve uploaded static files (profile pictures, assets, attachments) directly
$requestUri = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
if (preg_match('#/uploads/(.+)#i', $requestUri, $matches)) {
    $filename = $matches[1];
    $filePath = __DIR__ . '/../uploads/' . $filename;
    if (file_exists($filePath) && !is_dir($filePath)) {
        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        $mimeTypes = [
            'png'  => 'image/png',
            'jpg'  => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif'  => 'image/gif',
            'svg'  => 'image/svg+xml',
            'webp' => 'image/webp',
            'pdf'  => 'application/pdf'
        ];
        $mime = $mimeTypes[$ext] ?? 'application/octet-stream';
        
        if (ob_get_level()) {
            ob_end_clean();
        }
        
        header('Content-Type: ' . $mime);
        header('Content-Length: ' . filesize($filePath));
        header('Access-Control-Allow-Origin: *');
        header('Cache-Control: public, max-age=86400');
        readfile($filePath);
        exit;
    }
}

/**
 * API Router - Main entry point for all API requests
 */
// Prevent any output before JSON (no BOM, no notices in response)
ob_start();
// Do not send PHP errors to output - they would break JSON
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

// Load configuration early so constants like APP_ENVIRONMENT are defined
require_once __DIR__ . '/../config/config.php';

// Load utilities
require_once '../utils/Response.php';
require_once '../utils/Request.php';
require_once '../utils/Middleware.php';
require_once '../utils/Auth.php';
require_once '../utils/Mail.php';

// Load database
require_once '../config/Database.php';

// Load models
require_once '../models/User.php';
require_once '../models/Asset.php';
require_once '../models/Maintenance.php';
require_once '../models/History.php';
require_once '../models/Notification.php';

// Load controllers
require_once '../controllers/AuthController.php';
require_once '../controllers/UserController.php';
require_once '../controllers/AssetController.php';
require_once '../controllers/MaintenanceController.php';
require_once '../controllers/HistoryController.php';
require_once '../controllers/NotificationController.php';

// Discard any accidental output so far (e.g. from includes)
ob_clean();
// Enable CORS and security headers (they send Content-Type: application/json)
Middleware::enableCORS();
Middleware::setSecurityHeaders();

// Initialize database connection
$database = new Database();
$db = $database->connect();

// Initialize models
$userModel = new User($db);
$assetModel = new Asset($db);
$maintenanceModel = new Maintenance($db);
$historyModel = new History($db);
$notificationModel = new Notification($db);

// Initialize controllers
$authController = new AuthController($userModel, $notificationModel);
$userController = new UserController($userModel);
$assetController = new AssetController($assetModel, $historyModel, $notificationModel);
$maintenanceController = new MaintenanceController($maintenanceModel, $historyModel);
$historyController = new HistoryController($historyModel);
$notificationController = new NotificationController($notificationModel);

// Get request path
$request = isset($_GET['request']) ? trim($_GET['request'], '/') : '';
if (empty($request)) {
    $uriPath = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
    $uriPath = preg_replace('#^.*/api/index\.php#', '', $uriPath);
    $uriPath = preg_replace('#^.*/index\.php#', '', $uriPath);
    $uriPath = preg_replace('#^.*/api#', '', $uriPath);
    $request = trim($uriPath, '/');
}
$parts = explode('/', $request);


$method = Request::getMethod();
$endpoint = $parts[0] ?? '';
$action = $parts[1] ?? '';
$id = $parts[2] ?? '';

// Route requests
try {
    switch ($endpoint) {
        // Auth routes
        case 'auth':
            switch ($action) {
                case 'login':
                    $authController->login();
                    break;
                case 'register':
                    $authController->register();
                    break;
                case 'me':
                    $authController->me();
                    break;
                case 'change-password':
                    $authController->changePassword();
                    break;
                case 'logout':
                    $authController->logout();
                    break;
                case 'forgot-password':
                    $authController->forgotPassword();
                    break;
                case 'verify-reset-otp':
                    $authController->verifyResetOtp();
                    break;
                case 'reset-password':
                    $authController->resetPassword();
                    break;
                case 'verify-email':
                    $authController->verifyEmail();
                    break;
                case 'set-initial-password':
                    $authController->setInitialPassword();
                    break;
                case 'resend-verification':
                    $authController->resendVerification();
                    break;
                default:
                    Response::error('Endpoint not found', 404);
            }
            break;

        case '':
            Response::success(['status' => 'ok'], 'Render API root health check passed (Connected to Supabase)');
            break;


        // User routes
        case 'users':
            if (empty($action)) {
                // Support id in query string (frontend: get('users', { id }))
                $idInQuery = isset($_GET['id']) && $_GET['id'] !== '';
                if ($method === 'GET') {
                    if ($idInQuery) {
                        $userController->getById();
                    } else {
                        $userController->getAll();
                    }
                } elseif ($method === 'POST') {
                    $userController->create();
                } elseif ($method === 'PUT') {
                    $userController->update();
                } elseif ($method === 'DELETE' && $idInQuery) {
                    $userController->delete();
                } else {
                    Response::error('Method not allowed', 405);
                }
            } elseif ($action === 'upload_profile') {
                if ($method === 'POST') {
                    $userController->uploadProfileImage();
                } else {
                    Response::error('Method not allowed', 405);
                }
            } elseif ($action === 'ping') {
                if ($method === 'POST') {
                    $userController->ping();
                } else {
                    Response::error('Method not allowed', 405);
                }
            } else {
                $_GET['id'] = $action;
                if ($method === 'GET') {
                    $userController->getById();
                } elseif ($method === 'PUT') {
                    $userController->update();
                } elseif ($method === 'DELETE') {
                    $userController->delete();
                } else {
                    Response::error('Method not allowed', 405);
                }
            }
            break;

        // Asset routes
        case 'assets':
            if ($method === 'GET') {
                if (!empty($action)) {
                    $_GET['category'] = $action;
                }
                // Frontend getAssetById sends assets/{category}?id=...
                if (!empty($_GET['category']) && !empty($_GET['id'])) {
                    $assetController->getById();
                } else {
                    $assetController->getByCategory();
                }
            } elseif ($method === 'POST') {
                if ($action === 'import') {
                    $assetController->bulkImport();
                } elseif ($action === 'upload_receipt') {
                    $assetController->uploadReceipt();
                } else {
                    $assetController->create();
                }
            } elseif ($method === 'PUT') {
                if ($action === 'transfer') {
                    $assetController->transfer();
                } else {
                    $assetController->update();
                }
            } elseif ($method === 'DELETE') {
                if (!empty($action)) {
                    $_GET['category'] = $action;
                    if (!empty($id)) {
                        $_GET['id'] = $id;
                    }
                }
                $assetController->delete();
            } else {
                Response::error('Method not allowed', 405);
            }
            break;

        // Maintenance routes
        case 'maintenance':
            if ($action === 'upload_receipt') {
                if ($method === 'POST') {
                    $maintenanceController->uploadReceipt();
                } else {
                    Response::error('Method not allowed', 405);
                }
            } elseif (empty($action)) {
                $idInQuery = isset($_GET['id']) && $_GET['id'] !== '';
                if ($method === 'GET') {
                    if ($idInQuery) {
                        $maintenanceController->getTaskById();
                    } else {
                        $maintenanceController->getTasks();
                    }
                } elseif ($method === 'POST') {
                    $maintenanceController->createTask();
                } elseif ($method === 'PUT') {
                    $maintenanceController->updateTask();
                } elseif ($method === 'DELETE' && $idInQuery) {
                    $maintenanceController->deleteTask();
                } else {
                    Response::error('Method not allowed', 405);
                }
            } else {
                $_GET['id'] = $action;
                if ($method === 'GET') {
                    $maintenanceController->getTaskById();
                } elseif ($method === 'PUT') {
                    $maintenanceController->updateTask();
                } elseif ($method === 'DELETE') {
                    $maintenanceController->deleteTask();
                } else {
                    Response::error('Method not allowed', 405);
                }
            }
            break;

        // History routes
        case 'history':
        case 'activity':
            if ($method === 'GET') {
                if (isset($_GET['asset_id'])) {
                    $historyController->getByAssetId();
                } else {
                    $historyController->getRecent();
                }
            } else {
                Response::error('Method not allowed', 405);
            }
            break;

        // Notification routes
        case 'notifications':
            if ($method === 'GET') {
                $notificationController->getMyNotifications();
            } elseif ($method === 'PUT') {
                $notificationController->markAsRead();
            } elseif ($method === 'DELETE') {
                $notificationController->deleteAll();
            } else {
                Response::error('Method not allowed', 405);
            }
            break;

        // Health check endpoint
        case 'health':
            Response::success(['status' => 'ok', 'timestamp' => date('Y-m-d H:i:s')], 'API is healthy');
            break;

        default:
            Response::error('Endpoint not found', 404);
    }
} catch (Throwable $e) {
    // Log error
    error_log('[' . date('Y-m-d H:i:s') . '] Error: ' . $e->getMessage() . PHP_EOL, 3, ERROR_LOG_FILE);

    ob_clean();
    // Return error response as JSON
    if (DEBUG_MODE) {
        Response::error($e->getMessage(), 500);
    } else {
        Response::error('Internal server error', 500);
    }
} finally {
    if (isset($database)) {
        $database->close();
    }
    ob_end_flush();
}
