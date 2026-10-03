<?php

/**
 * Mail Utility - Handles sending emails via SMTP
 * Using Gmail SMTP with TLS
 */

class Mail
{
    /**
     * Send email
     * Note: This is a simplified SMTP sender. For production, PHPMailer is recommended.
     */
    public static function send($to, $subject, $message)
    {
        // In development, if not configured, just log it
        if (!defined('SMTP_PASS') || empty(SMTP_PASS)) {
            error_log("Email to $to: $subject (SMTP not configured)");
            return true;
        }

        try {
            $messageId = sprintf(
                '<%s.%s@%s>',
                base64_encode(random_bytes(16)),
                time(),
                $_SERVER['SERVER_NAME'] ?? 'localhost'
            );

            $headers = [
                'From: ' . SMTP_FROM_NAME . ' <' . SMTP_FROM . '>',
                'Reply-To: ' . SMTP_FROM,
                'Date: ' . date('r'),
                'Message-ID: ' . $messageId,
                'X-Mailer: PHP/' . phpversion(),
                'Content-Type: text/html; charset=UTF-8',
                'MIME-Version: 1.0'
            ];

            // If we are on Windows and have mail() configured, we can use it.
            // But Gmail SMTP requires authentication which mail() doesn't handle natively.
            // Therefore, we use a simple SMTP command sequence via fsockopen.

            return self::sendSMTP($to, $subject, $message, $headers);
        } catch (Exception $e) {
            error_log("Mail Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Simplified SMTP sender via fsockopen
     */
    private static function sendSMTP($to, $subject, $message, $headers)
    {
        $host = SMTP_HOST;
        $port = SMTP_PORT;
        $user = SMTP_USER;
        $pass = SMTP_PASS;

        $timeout = 10;
        $socket = fsockopen($host, $port, $errno, $errstr, $timeout);

        if (!$socket) {
            throw new Exception("Could not connect to SMTP host $host ($errno: $errstr)");
        }

        $getResponse = function ($socket) {
            $response = "";
            while ($line = fgets($socket, 515)) {
                $response .= $line;
                if (substr($line, 3, 1) == " ") break;
            }
            return $response;
        };

        $sendCommand = function ($socket, $command) use ($getResponse) {
            fputs($socket, $command . "\r\n");
            return $getResponse($socket);
        };

        $getResponse($socket); // 220
        $sendCommand($socket, "EHLO " . $_SERVER['SERVER_NAME']);
        $sendCommand($socket, "STARTTLS");

        // Switch to encrypted stream
        if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            throw new Exception("Failed to start TLS encryption");
        }

        $sendCommand($socket, "EHLO " . $_SERVER['SERVER_NAME']);
        $sendCommand($socket, "AUTH LOGIN");
        $sendCommand($socket, base64_encode($user));
        $sendCommand($socket, base64_encode($pass));

        $sendCommand($socket, "MAIL FROM: <$user>");
        $sendCommand($socket, "RCPT TO: <$to>");
        $sendCommand($socket, "DATA");

        $emailContent = "To: $to\r\n";
        $emailContent .= "Subject: $subject\r\n";
        foreach ($headers as $header) {
            $emailContent .= "$header\r\n";
        }
        $emailContent .= "\r\n";
        $emailContent .= $message;
        $emailContent .= "\r\n.";

        $response = $sendCommand($socket, $emailContent);
        $sendCommand($socket, "QUIT");
        fclose($socket);

        // Standard SMTP success code for DATA completion is 250
        return strpos($response, '250') !== false;
    }
}
