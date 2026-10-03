<?php

/**
 * Maintenance Controller
 */

class MaintenanceController
{
    private $maintenanceModel;
    private $historyModel;

    public function __construct($maintenanceModel, $historyModel = null)
    {
        $this->maintenanceModel = $maintenanceModel;
        $this->historyModel = $historyModel;
    }

    /**
     * Get all tasks
     */
    public function getTasks()
    {
        Middleware::requireAuth();

        $page = Request::getParam('page', 1);
        $per_page = Request::getParam('per_page', 10);

        $filters = [
            'status' => Request::getParam('status'),
            'priority' => Request::getParam('priority'),
            'asset_id' => Request::getParam('asset_id')
        ];

        $result = $this->maintenanceModel->getAllTasks($page, $per_page, $filters);

        Response::paginated($result['data'], $result['total'], $page, $per_page);
    }

    /**
     * Get task by ID
     */
    public function getTaskById()
    {
        Middleware::requireAuth();

        $id = Request::getParam('id');

        if (empty($id)) {
            Response::error('Task ID is required', 400);
        }

        $task = $this->maintenanceModel->getTaskById($id);

        if (!$task) {
            Response::error('Task not found', 404);
        }

        Response::success($task, 'Task retrieved successfully');
    }

    /**
     * Create task
     */
    public function createTask()
    {
        $user = Middleware::requireAuth();

        $data = Request::getJSON();

        if (empty($data['asset_id']) || empty($data['asset_type']) || empty($data['scheduled_date'])) {
            Response::error('asset_id, asset_type, and scheduled_date are required', 400);
        }

        $data['created_by'] = $user['id'];

        $result = $this->maintenanceModel->createTask($data);

        if ($result['success'] && $this->historyModel) {
            $this->historyModel->log(
                $data['asset_id'],
                $data['asset_type'],
                'Maintenance Created',
                "New maintenance task '{$data['description']}' was created for asset {$data['asset_id']}",
                $user['id']
            );
        }

        Response::success(['id' => $result['id']], 'Task created successfully', 201);
    }

    /**
     * Update task
     */
    public function updateTask()
    {
        Middleware::requireAuth();

        $data = Request::getJSON();
        $id = $data['id'] ?? null;

        if (empty($id)) {
            Response::error('Task ID is required', 400);
        }

        $task = $this->maintenanceModel->getTaskById($id);
        if (!$task) {
            Response::error('Task not found', 404);
        }

        $result = $this->maintenanceModel->updateTask($id, $data);

        if ($result['success'] && $this->historyModel) {
            $user = Middleware::requireAuth();

            if (isset($data['status']) && $data['status'] === 'Completed') {
                $description = "Maintenance completed.";

                // Allow fetching updated values if provided in request, or use existing from task
                $parts = $data['parts_maintained'] ?? $task['parts_maintained'] ?? '';
                $cost = $data['actual_cost'] ?? $task['actual_cost'] ?? '';

                if (!empty($parts)) {
                    $description .= " Parts Maintained: {$parts}.";
                }
                if (!empty($cost)) {
                    $description .= " Cost: GHS " . number_format((float)$cost, 2) . ".";
                }

                $this->historyModel->log(
                    $task['asset_id'],
                    $task['asset_type'],
                    'Asset Maintained',
                    $description,
                    $user['id'] ?? 'System',
                    null,
                    array_merge($task, $data)
                );
            } else {
                $statusMsg = $data['status'] ?? $task['status'];
                $this->historyModel->log($id, 'Task', 'Maintenance Updated', "Maintenance task status updated to '{$statusMsg}'", $user['id'] ?? 'System');
            }
        }

        Response::success(null, 'Task updated successfully');
    }

    /**
     * Delete task
     */
    public function deleteTask()
    {
        Middleware::requireRole(['Super Admin', 'CEO']);

        $id = Request::getParam('id');

        if (empty($id)) {
            Response::error('Task ID is required', 400);
        }

        if (!$this->maintenanceModel->getTaskById($id)) {
            Response::error('Task not found', 404);
        }

        $result = $this->maintenanceModel->deleteTask($id);

        if (!$result['success']) {
            Response::error($result['message'], 500);
        }

        Response::success(null, 'Task deleted successfully');
    }

    /**
     * Upload a receipt/scan file for a maintenance task and save its URL
     */
    public function uploadReceipt()
    {
        $user = Middleware::requireAuth();

        // Auto-migration: ensure receipt_url column exists
        $this->maintenanceModel->ensureReceiptUrlColumn();

        $taskId = $_POST['task_id'] ?? ($_GET['task_id'] ?? null);

        if (empty($taskId)) {
            Response::error('task_id is required', 400);
        }

        if (!isset($_FILES['receipt']) || $_FILES['receipt']['error'] !== UPLOAD_ERR_OK) {
            Response::error('No valid file uploaded', 400);
        }

        $file = $_FILES['receipt'];
        $allowedTypes = [
            'image/jpeg', 'image/png',
            'application/pdf'
        ];
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];

        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

        if (!in_array($file['type'], $allowedTypes) || !in_array($ext, $allowedExtensions)) {
            Response::error('Only JPG, PNG, and PDF files are allowed', 400);
        }

        if ($file['size'] > 10 * 1024 * 1024) {
            Response::error('File size must be under 10MB', 400);
        }

        $uploadDir = __DIR__ . '/../uploads/receipts/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        // Clean filename
        $safeTaskId = preg_replace('/[^a-zA-Z0-9_-]/', '_', $taskId);
        $filename = 'maint_receipt_' . $safeTaskId . '_' . time() . '.' . $ext;
        $destination = $uploadDir . $filename;

        if (move_uploaded_file($file['tmp_name'], $destination)) {
            $receiptUrl = '/uploads/receipts/' . $filename;

            // Update database
            $updateResult = $this->maintenanceModel->updateTask($taskId, ['receipt_url' => $receiptUrl]);

            if ($updateResult['success']) {
                if ($this->historyModel) {
                    $task = $this->maintenanceModel->getTaskById($taskId);
                    if ($task) {
                        $this->historyModel->log(
                            $task['asset_id'],
                            $task['asset_type'],
                            'Maintenance Receipt Uploaded',
                            "A receipt was uploaded for maintenance task {$taskId}",
                            $user['id'] ?? 'System'
                        );
                    }
                }
                Response::success(['receipt_url' => $receiptUrl], 'Receipt uploaded successfully');
            } else {
                // If DB update fails, attempt to delete the uploaded file
                @unlink($destination);
                Response::error('Failed to save receipt URL to database: ' . $updateResult['message'], 500);
            }
        }

        Response::error('Failed to move uploaded file', 500);
    }
}
