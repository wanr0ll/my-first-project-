const config = require('../config/config');

/**
 * Send email via Brevo Transactional Email API (HTTPS)
 */
async function send(to, subject, htmlMessage) {
    const apiKey = config.brevoApiKey;

    if (!apiKey) {
        console.warn(`[Mail] Brevo API key not configured. Email to ${to} was not sent.`);
        return false;
    }

    const payload = {
        sender: {
            name: config.smtpFromName,
            email: config.smtpFrom
        },
        to: [{ email: to }],
        subject,
        htmlContent: htmlMessage
    };

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.status === 201 || response.ok) {
            console.log(`[Mail] Email sent successfully to ${to} via Brevo`);
            return true;
        }

        const errText = await response.text();
        console.error(`[Mail] Brevo API error (Status ${response.status}):`, errText);
        return false;
    } catch (err) {
        console.error(`[Mail] Network error while sending email to ${to}:`, err.message);
        return false;
    }
}

module.exports = {
    send
};
