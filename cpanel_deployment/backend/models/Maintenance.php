<?php

/**
 * Maintenance Model
 */

class Maintenance
{
    private $db;

    public function __construct($database)
    {
        $this->db = $database;
    }

    /**
     * Create maintenance task
     */
    public function createTask($data)
    {
        $id = isset($data['id']) ? $data['id'] : generateId('MT');

        $query = "INSERT INTO maintenance_tasks 
                  (id, asset_id, asset_type, description, task_type, priority, status, 
                   assigned_to, scheduled_date, estimated_cost, notes, created_by, parts_maintained) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        $stmt = $this->db->prepare($query);

        $asset_id = $data['asset_id'];
        $asset_type = $data['asset_type'];
        $description = $data['description'] ?? null;
        $task_type = $data['task_type'] ?? null;
        $priority = $data['priority'] ?? 'Medium';
        $status = $data['status'] ?? 'Scheduled';
        $assigned_to = $data['assigned_to'] ?? null;
        $scheduled_date = $data['scheduled_date'];
        $estimated_cost = $data['estimated_cost'] ?? null;
        $notes = $data['notes'] ?? null;
        $created_by = $data['created_by'];
        $parts_maintained = $data['parts_maintained'] ?? null;

        $stmt->bind_param("sssssssssssss", $id, $asset_id, $asset_type, $description, $task_type, $priority, $status, $assigned_to, $scheduled_date, $estimated_cost, $notes, $created_by, $parts_maintained);

        if ($stmt->execute()) {
            return ['success' => true, 'id' => $id];
        }

        return ['success' => false, 'message' => $stmt->error];
    }

    /**
     * Get all tasks with pagination
     */
    public function getAllTasks($page = 1, $per_page = 10, $filters = [])
    {
        $offset = ($page - 1) * $per_page;

        $where = "WHERE 1=1";

        if (!empty($filters['status'])) {
            $where .= " AND status = '" . $this->db->real_escape_string($filters['status']) . "'";
        }

        if (!empty($filters['priority'])) {
            $where .= " AND priority = '" . $this->db->real_escape_string($filters['priority']) . "'";
        }

        if (!empty($filters['asset_id'])) {
            $where .= " AND asset_id = '" . $this->db->real_escape_string($filters['asset_id']) . "'";
        }

        // Get total
        $count_result = $this->db->query("SELECT COUNT(*) as total FROM maintenance_tasks " . $where);
        $total = $count_result->fetch_assoc()['total'];

        // Get results
        $query = "SELECT * FROM maintenance_tasks " . $where . " 
                  ORDER BY scheduled_date ASC LIMIT " . intval($offset) . ", " . intval($per_page);

        $result = $this->db->query($query);

        return [
            'total' => $total,
            'data' => $result ? $result->fetch_all(MYSQLI_ASSOC) : []
        ];
    }

    /**
     * Get task by ID
     */
    public function getTaskById($id)
    {
        $query = "SELECT * FROM maintenance_tasks WHERE id = ? LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("s", $id);
        $stmt->execute();

        return $stmt->get_result()->fetch_assoc();
    }

    /**
     * Update task
     */
    public function updateTask($id, $data)
    {
        $updates = [];
        $params = [];
        $types = '';

        $allowed_fields = [
            'description',
            'task_type',
            'priority',
            'status',
            'assigned_to',
            'scheduled_date',
            'completed_date',
            'estimated_cost',
            'actual_cost',
            'notes',
            'parts_maintained'
        ];

        foreach ($data as $key => $value) {
            if (in_array($key, $allowed_fields)) {
                $updates[] = "$key = ?";
                $params[] = $value;
                $types .= ($key === 'estimated_cost' || $key === 'actual_cost') ? 'd' : 's';
            }
        }

        if (empty($updates)) {
            return ['success' => false, 'message' => 'No fields to update'];
        }

        $query = "UPDATE maintenance_tasks SET " . implode(', ', $updates) . " WHERE id = ?";

        $params[] = $id;
        $types .= 's';

        $stmt = $this->db->prepare($query);

        // Dynamically bind params
        $stmt->bind_param($types, ...$params);

        if ($stmt->execute()) {
            return ['success' => true];
        }

        return ['success' => false, 'message' => $stmt->error];
    }

    /**
     * Delete task
     */
    public function deleteTask($id)
    {
        $query = "DELETE FROM maintenance_tasks WHERE id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("s", $id);

        if ($stmt->execute()) {
            return ['success' => true];
        }

        return ['success' => false, 'message' => $stmt->error];
    }
}
