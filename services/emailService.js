const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { sleep } = require('../utils/helpers');

/**
 * Email service for sending certificates
 */
class EmailService {
    constructor(logger, config) {
        this.logger = logger;
        this.config = config;
        this.transporter = null;
        this.emailTemplate = null;

        this.initializeTransporter();
        this.loadEmailTemplate();
    }

    /**
     * Initialize email transporter
     */
    initializeTransporter() {
        try {
            this.transporter = nodemailer.createTransport({
                host: this.config.emailHost,
                port: this.config.emailPort,
                secure: this.config.emailSecure,
                auth: {
                    user: this.config.emailUser,
                    pass: this.config.emailPassword
                }
            });

            this.logger.success('Email transporter initialized');
        } catch (error) {
            this.logger.error('Failed to initialize email transporter', error);
            throw error;
        }
    }

    /**
     * Load HTML email template
     */
    loadEmailTemplate() {
        const templatePath = path.join(__dirname, '../templates/email-template.html');

        if (fs.existsSync(templatePath)) {
            this.emailTemplate = fs.readFileSync(templatePath, 'utf-8');
            this.logger.success('Email template loaded');
        } else {
            // Use default template if file doesn't exist
            this.emailTemplate = this.getDefaultTemplate();
            this.logger.warning('Using default email template');
        }
    }

    /**
     * Get default email template
     * @returns {string} - HTML template
     */
    getDefaultTemplate() {
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .certificate-id {
      background: #fff;
      padding: 15px;
      border-left: 4px solid #2c5364;
      margin: 20px 0;
      font-family: monospace;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏆 Certificate of Participation</h1>
  </div>

  <div class="content">
    <p>Dear <strong>{{name}}</strong>,</p>

    <p>
      Thank you for participating in the <strong>LeetCode October Contest</strong>.
      We appreciate your enthusiasm and dedication towards competitive programming.
    </p>

    <p>
      As a token of recognition, we are pleased to award you the
      <strong>Certificate of Participation</strong>.  
      Your certificate is attached with this email.
    </p>

    <div class="certificate-id">
      <strong>Certificate ID:</strong> {{certificateId}}
    </div>

    <p>
      Please retain this Certificate ID for future reference or verification.
    </p>

    <p>
      We hope you enjoyed solving the challenges and look forward to your
      participation in upcoming contests.
    </p>

    <p>
      Happy Coding! 🚀<br>
      <strong>{{fromName}}</strong>
    </p>
  </div>

  <div class="footer">
    <p>This is an automated email. Please do not reply.</p>
  </div>
</body>
</html>

    `;
    }

    /**
     * Send certificate email
     * @param {Object} participant - Participant data
     * @param {string} certificatePath - Path to certificate PDF
     * @param {boolean} dryRun - Dry run mode (don't actually send)
     * @returns {Object} - { success: boolean, messageId: string }
     */
    async sendCertificate(participant, certificatePath, dryRun = false) {
        try {
            // Prepare email content
            const htmlContent = this.prepareEmailContent(participant);

            const mailOptions = {
                from: `"${this.config.emailFromName}" <${this.config.emailUser}>`,
                to: participant.email,
                subject: this.config.emailSubject,
                html: htmlContent,
                attachments: [
                    {
                        filename: path.basename(certificatePath),
                        path: certificatePath
                    }
                ]
            };

            if (dryRun) {
                this.logger.info(`[DRY RUN] Would send email to ${participant.email}`);
                return { success: true, messageId: 'dry-run-' + Date.now() };
            }

            // Send email
            const info = await this.transporter.sendMail(mailOptions);

            this.logger.success(`Email sent to ${participant.email} (ID: ${info.messageId})`);

            return { success: true, messageId: info.messageId };
        } catch (error) {
            this.logger.error(`Failed to send email to ${participant.email}`, error);
            return { success: false, error };
        }
    }

    /**
     * Send certificate with retry mechanism
     * @param {Object} participant - Participant data
     * @param {string} certificatePath - Path to certificate PDF
     * @param {boolean} dryRun - Dry run mode
     * @returns {Object} - { success: boolean, attempts: number }
     */
    async sendWithRetry(participant, certificatePath, dryRun = false) {
        const maxRetries = this.config.maxRetries || 3;
        const retryDelay = this.config.retryDelay || 5000;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            this.logger.info(`Attempt ${attempt}/${maxRetries} for ${participant.email}`);

            const result = await this.sendCertificate(participant, certificatePath, dryRun);

            if (result.success) {
                return { success: true, attempts: attempt, messageId: result.messageId };
            }

            if (attempt < maxRetries) {
                this.logger.warning(`Retrying in ${retryDelay / 1000} seconds...`);
                await sleep(retryDelay);
            }
        }

        return { success: false, attempts: maxRetries };
    }

    /**
     * Prepare email content with participant data
     * @param {Object} participant - Participant data
     * @returns {string} - HTML content
     */
    prepareEmailContent(participant) {
        return this.emailTemplate
            .replace(/{{name}}/g, participant.name)
            .replace(/{{event}}/g, participant.event)
            .replace(/{{certificateId}}/g, participant.certificateId)
            .replace(/{{fromName}}/g, this.config.emailFromName);
    }

    /**
     * Verify email configuration
     * @returns {Promise<boolean>} - True if valid
     */
    async verifyConnection() {
        try {
            await this.transporter.verify();
            this.logger.success('Email configuration verified');
            return true;
        } catch (error) {
            this.logger.error('Email configuration verification failed', error);
            return false;
        }
    }
}

module.exports = EmailService;
