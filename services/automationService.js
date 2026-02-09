const Logger = require('../utils/logger');
const { generateCertificateId, sleep, cleanupFiles } = require('../utils/helpers');
const ExcelService = require('./excelService');
const ValidatorService = require('./validatorService');
const CertificateService = require('./certificateService');
const EmailService = require('./emailService');
const StorageService = require('./storageService');

class AutomationService {
    constructor(logger = null) {
        this.logger = logger || new Logger(process.env.LOG_DIR || './logs');
        this.mode = this.determineMode();
        this.generatedFiles = [];
        this.initializeServices();
    }

    determineMode() {
        const args = process.argv.slice(2);
        if (args.includes('--dry-run')) return 'dry-run';
        if (args.includes('--test')) return 'test';
        return process.env.MODE || 'production';
    }

    initializeServices() {
        this.logger.info('Initializing services...');

        this.excelService = new ExcelService(this.logger);
        this.validatorService = new ValidatorService(this.logger);
        this.storageService = new StorageService(this.logger);

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

    async run(options = {}) {
        // Allow overriding mode per run call (e.g. from web UI)
        if (options.mode) this.mode = options.mode;

        // Callback for progress updates
        const onProgress = options.onProgress || (() => { });

        try {
            this.logger.separator();
            this.logger.info(`Starting Certificate Automation Tool (Mode: ${this.mode})`);
            this.logger.separator();

            const excelPath = process.env.EXCEL_FILE_PATH || './data/participants.xlsx';
            const rawParticipants = this.excelService.readExcelFile(excelPath);

            const validation = this.validatorService.validateExcelData(rawParticipants);
            if (!validation.valid) {
                throw new Error('No valid participants found in Excel file');
            }

            const participants = this.validatorService.removeDuplicates(validation.validParticipants);
            this.logger.success(`Processing ${participants.length} participants`);
            this.logger.separator();

            onProgress({ total: participants.length, success: 0, failed: 0 });

            participants.forEach((participant, index) => {
                participant.certificateId = generateCertificateId(
                    process.env.CERTIFICATE_ID_PREFIX || 'CERT',
                    index + 1
                );
                participant.event = participant.event || process.env.EVENT_NAME || 'Event';
            });

            if (this.mode !== 'dry-run') {
                const emailValid = await this.emailService.verifyConnection();
                if (!emailValid) throw new Error('Email configuration is invalid');
            }

            const results = {
                total: participants.length,
                success: 0,
                failed: 0,
                errors: []
            };

            for (let i = 0; i < participants.length; i++) {
                const participant = participants[i];
                this.logger.info(`[${i + 1}/${participants.length}] Processing ${participant.name}`);

                // Update progress start of item
                onProgress({
                    progress: i,
                    total: participants.length,
                    currentParticipant: participant.name
                });

                try {
                    const certificatePath = await this.certificateService.generateCertificate(participant);
                    this.generatedFiles.push(certificatePath);
                    this.storageService.saveCertificate(participant);

                    const emailResult = await this.sendEmail(participant, certificatePath);

                    if (emailResult.success) {
                        results.success++;
                        this.logger.logDelivery(participant, 'SUCCESS');
                    } else {
                        results.failed++;
                        this.logger.logDelivery(participant, 'FAILED', emailResult.error);
                        results.errors.push({ participant: participant.name, error: emailResult.error });
                    }

                    if (i < participants.length - 1 && this.mode !== 'dry-run') {
                        const delay = parseInt(process.env.EMAIL_DELAY) || 3000;
                        await sleep(delay);
                    }
                } catch (error) {
                    results.failed++;
                    this.logger.error(`Failed to process ${participant.name}`, error);
                    this.logger.logDelivery(participant, 'FAILED', error);
                    results.errors.push({ participant: participant.name, error: error.message });
                }

                // Update progress end of item
                onProgress({
                    progress: i + 1,
                    success: results.success,
                    failed: results.failed
                });
            }

            this.printSummary(results);

            if (process.env.AUTO_CLEANUP === 'true' && results.success > 0) {
                this.logger.info('Cleaning up generated files...');
                await cleanupFiles(this.generatedFiles, this.logger);
            }

            this.logger.separator();
            this.logger.success('Certificate automation completed!');
            this.logger.separator();

            return results;

        } catch (error) {
            this.logger.error('Fatal error in certificate automation', error);
            throw error;
        }
    }

    async sendEmail(participant, certificatePath) {
        if (this.mode === 'dry-run') {
            this.logger.info(`[DRY RUN] Would send certificate to ${participant.email}`);
            return { success: true };
        }

        if (this.mode === 'test') {
            const testParticipant = {
                ...participant,
                email: process.env.ADMIN_EMAIL || participant.email
            };
            this.logger.info(`[TEST MODE] Sending to admin: ${testParticipant.email}`);
            return await this.emailService.sendWithRetry(testParticipant, certificatePath, false);
        }

        return await this.emailService.sendWithRetry(participant, certificatePath, false);
    }

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

module.exports = AutomationService;
