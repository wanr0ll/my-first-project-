<?php

/**
 * Database Configuration & Abstraction Class
 * Supports both PostgreSQL and MySQL transparently via PDO.
 * Maintains complete backwards compatibility with mysqli methods (query, prepare, real_escape_string, fetch_assoc, etc.)
 */

defined('MYSQLI_ASSOC') || define('MYSQLI_ASSOC', 1);
defined('MYSQLI_NUM')   || define('MYSQLI_NUM', 2);
defined('MYSQLI_BOTH')  || define('MYSQLI_BOTH', 3);

class Database
{
    private $driver = 'pgsql';
    private $host;
    private $user;
    private $pass;
    private $db_name;
    private $port;
    private $charset = 'utf8mb4';

    public $conn;

    public function __construct()
    {
        // 1. Check for standard DATABASE_URL / POSTGRES_URL (e.g. Railway, Supabase, Render, Neon, Heroku)
        $db_url = $_SERVER['DATABASE_URL'] ?? $_ENV['DATABASE_URL'] ?? getenv('DATABASE_URL')
            ?: ($_SERVER['POSTGRES_URL'] ?? $_ENV['POSTGRES_URL'] ?? getenv('POSTGRES_URL') ?: null);

        if (!empty($db_url)) {
            $parsed = parse_url($db_url);
            $scheme = strtolower($parsed['scheme'] ?? 'pgsql');
            $this->driver  = ($scheme === 'postgres' || $scheme === 'postgresql') ? 'pgsql' : $scheme;
            $this->host    = $parsed['host'] ?? 'localhost';
            $this->user    = $parsed['user'] ?? '';
            $this->pass    = urldecode($parsed['pass'] ?? '');
            $rawPath = explode('?', ltrim($parsed['path'] ?? '', '/'))[0];
            $cleanDbName = trim($rawPath, " \t\n\r\0\x0B_");
            $this->db_name = !empty($cleanDbName) ? $cleanDbName : 'postgres';
            $this->port    = (int)($parsed['port'] ?? ($this->driver === 'pgsql' ? 5432 : 3306));
            return;
        }

        // 2. Check explicit DB_DRIVER env variable ('pgsql' or 'mysql')
        $driver_env = strtolower($_SERVER['DB_DRIVER'] ?? $_ENV['DB_DRIVER'] ?? getenv('DB_DRIVER') ?: '');
        
        // Check for Postgres specific environment variables
        $pg_host = $_SERVER['PGHOST'] ?? $_ENV['PGHOST'] ?? getenv('PGHOST') 
            ?? $_SERVER['POSTGRES_HOST'] ?? $_ENV['POSTGRES_HOST'] ?? getenv('POSTGRES_HOST') ?: null;

        if ($driver_env === 'pgsql' || ($driver_env === '' && $pg_host !== null)) {
            $this->driver  = 'pgsql';
            $this->host    = $pg_host ?: 'localhost';
            $this->user    = $_SERVER['PGUSER'] ?? $_ENV['PGUSER'] ?? getenv('PGUSER') ?? $_SERVER['POSTGRES_USER'] ?? $_ENV['POSTGRES_USER'] ?? getenv('POSTGRES_USER') ?: 'postgres';
            $this->pass    = $_SERVER['PGPASSWORD'] ?? $_ENV['PGPASSWORD'] ?? getenv('PGPASSWORD') ?? $_SERVER['POSTGRES_PASSWORD'] ?? $_ENV['POSTGRES_PASSWORD'] ?? getenv('POSTGRES_PASSWORD') ?: '';
            $this->db_name = $_SERVER['PGDATABASE'] ?? $_ENV['PGDATABASE'] ?? getenv('PGDATABASE') ?? $_SERVER['POSTGRES_DB'] ?? $_ENV['POSTGRES_DB'] ?? getenv('POSTGRES_DB') ?: 'gha_asset_manager';
            $this->port    = (int)($_SERVER['PGPORT'] ?? $_ENV['PGPORT'] ?? getenv('PGPORT') ?? $_SERVER['POSTGRES_PORT'] ?? $_ENV['POSTGRES_PORT'] ?? getenv('POSTGRES_PORT') ?: 5432);
        } else {
            // Fall back to MySQL credentials if DB_DRIVER=mysql or MYSQLHOST is set
            $this->driver  = 'mysql';
            $this->host    = $_SERVER['MYSQLHOST'] ?? $_ENV['MYSQLHOST'] ?? getenv('MYSQLHOST') ?? (defined('DB_HOST') ? DB_HOST : 'localhost');
            $this->user    = $_SERVER['MYSQLUSER'] ?? $_ENV['MYSQLUSER'] ?? getenv('MYSQLUSER') ?? (defined('DB_USER') ? DB_USER : 'root');
            $this->pass    = $_SERVER['MYSQLPASSWORD'] ?? $_ENV['MYSQLPASSWORD'] ?? getenv('MYSQLPASSWORD') ?? (defined('DB_PASS') ? DB_PASS : '');
            $this->db_name = $_SERVER['MYSQLDATABASE'] ?? $_ENV['MYSQLDATABASE'] ?? getenv('MYSQLDATABASE') ?? $_SERVER['MYSQL_DATABASE'] ?? $_ENV['MYSQL_DATABASE'] ?? getenv('MYSQL_DATABASE') ?? (defined('DB_NAME') ? DB_NAME : 'gha_asset_manager');
            $this->port    = (int)($_SERVER['MYSQLPORT'] ?? $_ENV['MYSQLPORT'] ?? getenv('MYSQLPORT') ?: 3306);
        }
    }

    public function connect()
    {
        try {
            if ($this->driver === 'pgsql') {
                $sslmode = (strpos($this->host, 'localhost') !== false || strpos($this->host, '127.0.0.1') !== false) ? 'prefer' : 'require';
                $dsn = "pgsql:host={$this->host};port={$this->port};dbname={$this->db_name};sslmode={$sslmode};connect_timeout=5;";
            } else {
                $dsn = "mysql:host={$this->host};port={$this->port};dbname={$this->db_name};charset={$this->charset}";
            }

            $pdo = new PDO($dsn, $this->user, $this->pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_TIMEOUT => 5
            ]);

            $this->conn = new PdoWrapper($pdo, $this->driver);
            return $this->conn;
        } catch (PDOException $e) {
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'message' => 'Database connection failed: ' . $e->getMessage()
            ]);
            exit;
        }
    }

    public function getConnection()
    {
        return $this->conn;
    }

    public function close()
    {
        if ($this->conn) {
            $this->conn->close();
        }
    }
}

/**
 * PDO Connection Wrapper for MySQL & PostgreSQL compatibility
 */
class PdoWrapper
{
    private $pdo;
    private $driver;
    public $insert_id = 0;
    public $error = '';
    public $errno = 0;

    public function __construct(PDO $pdo, string $driver = 'pgsql')
    {
        $this->pdo = $pdo;
        $this->driver = $driver;
    }

    public function getPdo(): PDO
    {
        return $this->pdo;
    }

    public function getDriver(): string
    {
        return $this->driver;
    }

    public function translateSql(string $sql): string
    {
        if ($this->driver === 'pgsql') {
            // Replace backticks with double quotes or standard identifiers
            $sql = preg_replace_callback('/`([^`]+)`/', function ($m) {
                return '"' . $m[1] . '"';
            }, $sql);

            // Replace IF(cond, val1, val2) with CASE WHEN cond THEN val1 ELSE val2 END
            $sql = preg_replace_callback('/IF\s*\(([^,]+),\s*([^,]+),\s*([^)]+)\)/i', function ($m) {
                return "CASE WHEN " . trim($m[1]) . " THEN " . trim($m[2]) . " ELSE " . trim($m[3]) . " END";
            }, $sql);

            // Replace DATE_SUB(NOW(), INTERVAL X MINUTE) with (NOW() - INTERVAL 'X minute')
            $sql = preg_replace('/DATE_SUB\s*\(\s*NOW\(\)\s*,\s*INTERVAL\s+(\d+)\s+MINUTE\s*\)/i', "(NOW() - INTERVAL '$1 minute')", $sql);

            // Replace MySQL LIMIT offset, count with LIMIT count OFFSET offset
            $sql = preg_replace('/LIMIT\s+(\d+)\s*,\s*(\d+)/i', 'LIMIT $2 OFFSET $1', $sql);
        } else {
            // Normalize LIMIT offset, count for MySQL as well if formatted with offset first
            $sql = preg_replace('/LIMIT\s+(\d+)\s*,\s*(\d+)/i', 'LIMIT $2 OFFSET $1', $sql);
        }

        return $sql;
    }

    public function query(string $sql)
    {
        $translatedSql = $this->translateSql($sql);
        try {
            $stmt = $this->pdo->query($translatedSql);
            if ($stmt === false) {
                $this->error = implode(' ', $this->pdo->errorInfo());
                return false;
            }
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return new PdoResultWrapper($rows);
        } catch (PDOException $e) {
            $this->error = $e->getMessage();
            return false;
        }
    }

    public function prepare(string $sql)
    {
        $translatedSql = $this->translateSql($sql);
        try {
            $stmt = $this->pdo->prepare($translatedSql);
            return new PdoStmtWrapper($stmt, $this);
        } catch (PDOException $e) {
            $this->error = $e->getMessage();
            return false;
        }
    }

    public function real_escape_string($string)
    {
        if ($string === null) return '';
        $quoted = $this->pdo->quote((string)$string);
        // Strip leading and trailing single quotes
        return (substr($quoted, 0, 1) === "'" && substr($quoted, -1) === "'") ? substr($quoted, 1, -1) : $quoted;
    }

    public function set_charset($charset)
    {
        return true;
    }

    public function close()
    {
        $this->pdo = null;
    }

    public function __get($name)
    {
        if ($name === 'insert_id') {
            try {
                return $this->pdo ? (int)$this->pdo->lastInsertId() : 0;
            } catch (Exception $e) {
                return 0;
            }
        }
        return null;
    }
}

/**
 * Prepared Statement Wrapper
 */
class PdoStmtWrapper
{
    private $stmt;
    private $dbWrapper;
    private $params = [];
    private $resultWrapper = null;
    public $error = '';
    public $affected_rows = 0;
    public $num_rows = 0;

    public function __construct(PDOStatement $stmt, PdoWrapper $dbWrapper)
    {
        $this->stmt = $stmt;
        $this->dbWrapper = $dbWrapper;
    }

    public function bind_param($types, ...$args)
    {
        $this->params = $args;
        return true;
    }

    public function execute($params = null)
    {
        if (is_array($params)) {
            $execParams = $params;
        } else {
            $execParams = $this->params;
        }

        try {
            $res = $this->stmt->execute($execParams);
            $this->affected_rows = $this->stmt->rowCount();
            
            // If it's a SELECT query, fetch results
            if ($res && $this->stmt->columnCount() > 0) {
                $rows = $this->stmt->fetchAll(PDO::FETCH_ASSOC);
                $this->num_rows = count($rows);
                $this->resultWrapper = new PdoResultWrapper($rows);
            }
            return $res;
        } catch (PDOException $e) {
            $this->error = $e->getMessage();
            $this->dbWrapper->error = $e->getMessage();
            return false;
        }
    }

    public function get_result()
    {
        return $this->resultWrapper ?: new PdoResultWrapper([]);
    }

    public function fetch_assoc()
    {
        return $this->resultWrapper ? $this->resultWrapper->fetch_assoc() : null;
    }
}

/**
 * Query Result Wrapper
 */
class PdoResultWrapper
{
    private $rows;
    private $pointer = 0;
    public $num_rows = 0;

    public function __construct(array $rows)
    {
        $this->rows = array_values($rows);
        $this->num_rows = count($this->rows);
    }

    public function fetch_assoc()
    {
        if ($this->pointer < $this->num_rows) {
            return $this->rows[$this->pointer++];
        }
        return null;
    }

    public function fetch_all($resulttype = MYSQLI_ASSOC)
    {
        return $this->rows;
    }

    public function fetch_object()
    {
        $row = $this->fetch_assoc();
        return $row ? (object)$row : null;
    }
}
