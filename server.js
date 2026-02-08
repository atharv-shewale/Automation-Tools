require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { router: apiRoutes } = require('./api/routes');

// Check if running in web mode
const isWebMode = process.argv.includes('--web');

if (isWebMode) {
    // Web server mode
    const app = express();
    const PORT = process.env.PORT || 3000;

    // Middleware
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Serve static files
    app.use(express.static('public'));
    app.use('/preview', express.static('output/previews'));
    app.use('/templates', express.static('templates'));

    // API routes
    app.use('/api', apiRoutes);

    // Serve main page
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    // Verification Route
    const StorageService = require('./services/storageService');
    const storageService = new StorageService(console); // simple console logger for simple server

    app.get('/verify/:id', (req, res) => {
        const certId = req.params.id;
        const certData = storageService.getCertificate(certId);

        const templatePath = path.join(__dirname, 'templates', 'verification.html');
        let html;
        try {
            html = fs.readFileSync(templatePath, 'utf-8');
        } catch (e) {
            return res.status(500).send('Verification template not found.');
        }

        if (certData) {
            // Valid Certificate
            const content = `
                <div class="icon-container status-valid">
                    ✓
                </div>
                <h1>Verified Certificate</h1>
                <p class="subtitle">This certificate is valid and issued by ACADS.</p>
                
                <div class="details-box">
                    <div class="detail-row">
                        <span class="detail-label">Participant Name</span>
                        <div class="detail-value">${certData.name}</div>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Event</span>
                        <div class="detail-value">${certData.event}</div>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Certificate ID</span>
                        <div class="detail-value">${certData.certificateId}</div>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Issue Date</span>
                        <div class="detail-value">${new Date(certData.issuedAt).toLocaleDateString()}</div>
                    </div>
                </div>

                <div class="badge badge-valid">OFFICIALLY VERIFIED</div>
            `;
            html = html.replace('{{CONTENT}}', content);
        } else {
            // Invalid Certificate
            const content = `
                <div class="icon-container status-invalid">
                    ✕
                </div>
                <h1>Invalid Certificate</h1>
                <p class="subtitle">We could not find a certificate with this ID.</p>
                
                <div class="details-box">
                    <div class="detail-row">
                        <span class="detail-label">Requested ID</span>
                        <div class="detail-value" style="color: var(--error)">${certId}</div>
                    </div>
                </div>

                <div class="badge badge-invalid">VERIFICATION FAILED</div>
            `;
            html = html.replace('{{CONTENT}}', content);
        }

        res.send(html);
    });

    // Start server
    app.listen(PORT, () => {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🚀 Certificate Automation Web UI`);
        console.log(`${'='.repeat(60)}`);
        console.log(`\n📍 Server running at: http://localhost:${PORT}`);
        console.log(`\n✨ Features:`);
        console.log(`   - Visual Position Editor`);
        console.log(`   - CSV Upload & Validation`);
        console.log(`   - Live Certificate Preview`);
        console.log(`   - Real-time Processing Dashboard`);
        console.log(`   - ✅ QRCode Verification: http://localhost:${PORT}/verify/:id`);
        console.log(`\n${'='.repeat(60)}\n`);
    });

} else {
    // CLI mode (original functionality)
    const Logger = require('./utils/logger');
    const { generateCertificateId, sleep, cleanupFiles } = require('./utils/helpers');
    const ExcelService = require('./services/excelService');
    const ValidatorService = require('./services/validatorService');
    const CertificateService = require('./services/certificateService');
    const EmailService = require('./services/emailService');
    const StorageService = require('./services/storageService');

    /**
     * Main application class
     */
    class CertificateAutomation {
        constructor() {
            this.logger = new Logger(process.env.LOG_DIR || './logs');
            this.mode = this.determineMode();
            this.generatedFiles = [];

            this.initializeServices();
        }

        /**
         * Determine running mode from command line arguments
         */
        determineMode() {
            const args = process.argv.slice(2);

            if (args.includes('--dry-run')) {
                return 'dry-run';
            } else if (args.includes('--test')) {
                return 'test';
            }

            return process.env.MODE || 'production';
        }

        /**
         * Initialize all services
         */
        initializeServices() {
            this.logger.info('Initializing services...');

            // Excel service
            this.excelService = new ExcelService(this.logger);

            // Validator service
            this.validatorService = new ValidatorService(this.logger);

            // Storage service
            this.storageService = new StorageService(this.logger);

            // Certificate service configuration
            const certConfig = {
                templatePath: process.env.CERTIFICATE_TEMPLATE_PATH || './templates/certificate.png',
                fontPath: process.env.FONT_PATH || './templates/font.ttf',
                outputDir: process.env.OUTPUT_DIR || './output/generated-certificates',
                nameX: parseInt(process.env.NAME_X) || 1240,
                nameY: parseInt(process.env.NAME_Y) || 1400,
                nameFontSize: parseInt(process.env.NAME_FONT_SIZE) || 80,
                nameColor: process.env.NAME_COLOR || '#1a1a1a',
                nameFont: process.env.NAME_FONT || 'Arial',
                nameEnabled: process.env.NAME_ENABLED !== 'false',
                eventX: parseInt(process.env.EVENT_X) || 1240,
                eventY: parseInt(process.env.EVENT_Y) || 1600,
                eventFontSize: parseInt(process.env.EVENT_FONT_SIZE) || 50,
                eventColor: process.env.EVENT_COLOR || '#4a4a4a',
                eventFont: process.env.EVENT_FONT || 'Arial',
                eventEnabled: process.env.EVENT_ENABLED !== 'false',
                certIdX: parseInt(process.env.CERT_ID_X) || 200,
                certIdY: parseInt(process.env.CERT_ID_Y) || 3200,
                certIdFontSize: parseInt(process.env.CERT_ID_FONT_SIZE) || 30,
                certIdColor: process.env.CERT_ID_COLOR || '#888888',
                certIdFont: process.env.CERT_ID_FONT || 'Arial',
                certIdEnabled: process.env.CERT_ID_ENABLED !== 'false',
                qrEnabled: process.env.QR_ENABLED === 'true',
                qrX: parseInt(process.env.QR_X) || 2100,
                qrY: parseInt(process.env.QR_Y) || 3000,
                qrSize: parseInt(process.env.QR_SIZE) || 200,
                verificationUrl: process.env.VERIFICATION_URL || 'https://yourclub.com/verify/'
            };
            this.certificateService = new CertificateService(this.logger, certConfig);

            // Email service configuration
            const emailConfig = {
                emailHost: process.env.EMAIL_HOST || 'smtp.gmail.com',
                emailPort: parseInt(process.env.EMAIL_PORT) || 587,
                emailSecure: process.env.EMAIL_SECURE === 'true',
                emailUser: process.env.EMAIL_USER,
                emailPassword: process.env.EMAIL_PASSWORD,
                emailFromName: process.env.EMAIL_FROM_NAME || 'Club Name',
                emailSubject: process.env.EMAIL_SUBJECT || 'Your Certificate of Participation',
                maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
                retryDelay: parseInt(process.env.RETRY_DELAY) || 5000
            };
            this.emailService = new EmailService(this.logger, emailConfig);

            this.logger.success('All services initialized');
        }

        /**
         * Main execution flow
         */
        async run() {
            try {
                this.logger.separator();
                this.logger.info(`Starting Certificate Automation Tool (Mode: ${this.mode})`);
                this.logger.separator();

                // Step 1: Read and validate Excel file
                const excelPath = process.env.EXCEL_FILE_PATH || './data/participants.xlsx';
                const rawParticipants = this.excelService.readExcelFile(excelPath);

                // Step 2: Validate data
                const validation = this.validatorService.validateExcelData(rawParticipants);
                if (!validation.valid) {
                    throw new Error('No valid participants found in Excel file');
                }

                // Step 3: Remove duplicates
                const participants = this.validatorService.removeDuplicates(validation.validParticipants);

                this.logger.success(`Processing ${participants.length} participants`);
                this.logger.separator();

                // Step 4: Generate certificate IDs
                participants.forEach((participant, index) => {
                    participant.certificateId = generateCertificateId(
                        process.env.CERTIFICATE_ID_PREFIX || 'CERT',
                        index + 1
                    );
                    participant.event = participant.event || process.env.EVENT_NAME || 'Event';
                });

                // Step 5: Verify email connection (skip in dry-run)
                if (this.mode !== 'dry-run') {
                    const emailValid = await this.emailService.verifyConnection();
                    if (!emailValid) {
                        throw new Error('Email configuration is invalid');
                    }
                }

                // Step 6: Process each participant
                const results = {
                    total: participants.length,
                    success: 0,
                    failed: 0,
                    errors: []
                };

                for (let i = 0; i < participants.length; i++) {
                    const participant = participants[i];

                    this.logger.info(`[${i + 1}/${participants.length}] Processing ${participant.name}`);

                    try {
                        // Generate certificate
                        const certificatePath = await this.certificateService.generateCertificate(participant);
                        this.generatedFiles.push(certificatePath);

                        // Save to storage for verification
                        this.storageService.saveCertificate(participant);

                        // Send email (or simulate in test/dry-run mode)
                        const emailResult = await this.sendEmail(participant, certificatePath);

                        if (emailResult.success) {
                            results.success++;
                            this.logger.logDelivery(participant, 'SUCCESS');
                        } else {
                            results.failed++;
                            this.logger.logDelivery(participant, 'FAILED', emailResult.error);
                            results.errors.push({
                                participant: participant.name,
                                error: emailResult.error
                            });
                        }

                        // Rate limiting (except for last participant)
                        if (i < participants.length - 1 && this.mode !== 'dry-run') {
                            const delay = parseInt(process.env.EMAIL_DELAY) || 3000;
                            await sleep(delay);
                        }
                    } catch (error) {
                        results.failed++;
                        this.logger.error(`Failed to process ${participant.name}`, error);
                        this.logger.logDelivery(participant, 'FAILED', error);
                        results.errors.push({
                            participant: participant.name,
                            error: error.message
                        });
                    }
                }

                // Step 7: Summary
                this.printSummary(results);

                // Step 8: Cleanup (if enabled)
                if (process.env.AUTO_CLEANUP === 'true' && results.success > 0) {
                    this.logger.info('Cleaning up generated files...');
                    await cleanupFiles(this.generatedFiles, this.logger);
                }

                this.logger.separator();
                this.logger.success('Certificate automation completed!');
                this.logger.info('To host the verification page, run: npm run web');
                this.logger.separator();

            } catch (error) {
                this.logger.error('Fatal error in certificate automation', error);
                process.exit(1);
            }
        }

        /**
         * Send email based on mode
         */
        async sendEmail(participant, certificatePath) {
            if (this.mode === 'dry-run') {
                this.logger.info(`[DRY RUN] Would send certificate to ${participant.email}`);
                return { success: true };
            }

            if (this.mode === 'test') {
                // In test mode, send all certificates to admin email
                const testParticipant = {
                    ...participant,
                    email: process.env.ADMIN_EMAIL || participant.email
                };
                this.logger.info(`[TEST MODE] Sending to admin: ${testParticipant.email}`);
                return await this.emailService.sendWithRetry(testParticipant, certificatePath, false);
            }

            // Production mode
            return await this.emailService.sendWithRetry(participant, certificatePath, false);
        }

        /**
         * Print execution summary
         */
        printSummary(results) {
            this.logger.separator();
            this.logger.info('EXECUTION SUMMARY');
            this.logger.separator();
            this.logger.info(`Total participants: ${results.total}`);
            this.logger.success(`Successfully processed: ${results.success}`);

            if (results.failed > 0) {
                this.logger.error(`Failed: ${results.failed}`);
                this.logger.separator();
                this.logger.error('Failed participants:');
                results.errors.forEach(err => {
                    this.logger.error(`- ${err.participant}: ${err.error}`);
                });
            }
        }
    }

    // Run the application
    const app = new CertificateAutomation();
    app.run().catch(error => {
        console.error('Unhandled error:', error);
        process.exit(1);
    });
}

module.exports = isWebMode ? null : require('./utils/logger');
