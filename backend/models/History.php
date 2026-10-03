<?php
/**
 * History Model - Handle asset audit logs
 */

class History {
    private $db;
    private $table = 'asset_history';

    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Get recent activity logs
     */
    public function getAll($limit = 20) {
        $query = "SELECT h.*, u.name as performed_by_name 
                  FROM " . $this->table . " h
                  LEFT JOIN users u ON h.performed_by = u.id
                  ORDER BY performed_at DESC 
                  LIMIT " . intval($limit);
        
        $result = $this->db->query($query);
        $data = [];
        
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }
        }
        
        return $data;
    }

    /**
     * Log a new activity
     */
    public function log($asset_id, $asset_type, $action, $description, $performed_by, $old_values = null, $new_values = null) {
        $asset_id = $this->db->real_escape_string($asset_id);
        $asset_type = $this->db->real_escape_string($asset_type);
        $action = $this->db->real_escape_string($action);
        $description = $this->db->real_escape_string($description);
        $perf_sql = 'NULL';
        if (!empty($performed_by)) {
            $check = $this->db->query("SELECT id FROM users WHERE id = '" . $this->db->real_escape_string($performed_by) . "' LIMIT 1");
            if ($check && $check->num_rows > 0) {
                $perf_sql = "'" . $this->db->real_escape_string($performed_by) . "'";
            }
        }
        
        $old_json = $old_values ? $this->db->real_escape_string(json_encode($old_values)) : 'NULL';
        $new_json = $new_values ? $this->db->real_escape_string(json_encode($new_values)) : 'NULL';

        $query = "INSERT INTO " . $this->table . " 
                  (asset_id, asset_type, action, description, performed_by, old_values, new_values) 
                  VALUES 
                  ('$asset_id', '$asset_type', '$action', '$description', $perf_sql, 
                  " . ($old_json === 'NULL' ? 'NULL' : "'$old_json'") . ", 
                  " . ($new_json === 'NULL' ? 'NULL' : "'$new_json'") . ")";
        
        return $this->db->query($query);
    }

    /**
     * Get history logs for a specific asset
     */
    public function getByAssetId($asset_id, $limit = 50) {
        $asset_id = $this->db->real_escape_string($asset_id);
        
        $query = "SELECT h.*, u.name as performed_by_name 
                  FROM " . $this->table . " h
                  LEFT JOIN users u ON h.performed_by = u.id
                  WHERE h.asset_id = '$asset_id'
                  ORDER BY performed_at DESC 
                  LIMIT " . intval($limit);
        
        $result = $this->db->query($query);
        $data = [];
        
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }
        }
        
        return $data;
    }
}
