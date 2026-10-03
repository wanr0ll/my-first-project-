<?php
/**
 * Database Configuration Class
 * Handles MySQL database connection for XAMPP environment
 */

class Database {
    // XAMPP database configuration
    private $host = 'localhost';
    private $user = 'root';
    private $pass = '';
    private $db_name = 'gha_asset_manager';
    private $charset = 'utf8mb4';
    
    // Database connection
    public $conn;

    /**
     * Connect to database
     */
    public function connect() {
        // Create connection using MySQLi
        $this->conn = new mysqli(
            $this->host,
            $this->user,
            $this->pass,
            $this->db_name
        );

        // Check connection
        if ($this->conn->connect_error) {
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'message' => 'Database connection failed: ' . $this->conn->connect_error
            ]);
            exit;
        }

        // Set charset
        $this->conn->set_charset($this->charset);

        return $this->conn;
    }

    /**
     * Get connection
     */
    public function getConnection() {
        return $this->conn;
    }

    /**
     * Close database connection
     */
    public function close() {
        if ($this->conn) {
            $this->conn->close();
        }
    }
}
?>
