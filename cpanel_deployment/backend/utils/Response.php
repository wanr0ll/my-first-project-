<?php
/**
 * Response Handler - Standardized API responses
 */

class Response {
    /**
     * Send JSON success response
     */
    public static function success($data = null, $message = 'Success', $code = 200) {
        http_response_code($code);
        echo json_encode([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        if (ob_get_length()) ob_end_flush();
        exit;
    }

    /**
     * Send JSON error response
     */
    public static function error($message = 'Error', $code = 400, $errors = null) {
        http_response_code($code);
        echo json_encode([
            'success' => false,
            'message' => $message,
            'errors' => $errors,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        if (ob_get_length()) ob_end_flush();
        exit;
    }

    /**
     * Send JSON response with pagination
     */
    public static function paginated($data, $total, $page, $per_page, $message = 'Success', $code = 200) {
        http_response_code($code);
        echo json_encode([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'pagination' => [
                'total' => (int) $total,
                'page' => (int) $page,
                'per_page' => (int) $per_page,
                'total_pages' => ceil($total / $per_page)
            ],
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        if (ob_get_length()) ob_end_flush();
        exit;
    }
}
?>
