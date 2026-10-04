<?php

/**
 * Mail Utility - Sends emails via Brevo (Sendinblue) HTTP API
 * Uses cURL over HTTPS (port 443) - works on Railway without SMTP port restrictions.
 */

class Mail
{
    /**
     * Send email via Brevo Transactional Email API
     *
     * @param string $to       Recipient email address
     * @param string $subject  Email subject
     * @param string $message  HTML email body
     * @return bool            True on success, false on failure
     */
    public static function send($to, $subject, $message)
    {
        $apiKey = defined('BREVO_API_KEY') ? BREVO_API_KEY : '';

        if (empty($apiKey)) {
            error_log("Brevo API key not configured. Email to $to not sent.");
            return false;
        }

        $payload = json_encode([
            'sender' => [
                'name'  => defined('SMTP_FROM_NAME') ? SMTP_FROM_NAME : 'Ghana Highway Authority',
                'email' => defined('SMTP_FROM')      ? SMTP_FROM      : 'ghaassetmanagementsystem@gmail.com',
            ],
            'to' => [
                ['email' => $to]
            ],
            'subject'     => $subject,
            'htmlContent' => $message,
        ]);

        $ch = curl_init('https://api.brevo.com/v3/smtp/email');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_HTTPHEADER     => [
                'accept: application/json',
                'api-key: ' . $apiKey,
                'content-type: application/json',
            ],
            CURLOPT_TIMEOUT        => 5,
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            error_log("Mail cURL Error: $curlError");
            return false;
        }

        // Brevo returns 201 Created on success
        if ($httpCode === 201) {
            error_log("Mail sent successfully to $to via Brevo (HTTP $httpCode)");
            return true;
        }

        error_log("Mail Error: Brevo returned HTTP $httpCode. Response: $response");
        return false;
    }
}
