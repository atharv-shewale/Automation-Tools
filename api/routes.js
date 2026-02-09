const express = require('express');
const router = express.Router();
const upload = require('./uploadMiddleware');
const fs = require('fs');
const path = require('path');
const ExcelService = require('../services/excelService');
const ValidatorService = require('../services/validatorService');
const CertificateService = require('../services/certificateService');
const AutomationService = require('../services/automationService');
const Logger = require('../utils/logger');

// In-memory storage for processing status
let processingStatus = {
    isProcessing: false,
    progress: 0,
    total: 0,
    success: 0,
    failed: 0,
    currentParticipant: '',
    logs: []
};

// SSE clients for real-time updates
let sseClients = [];

/**
 * GET /api/config - Get current configuration
 */
router.get('/config', (req, res) => {
    try {
        // Load config directly from file to bypass cache
        let envConfig = {};
        try {
            envConfig = require('dotenv').parse(fs.readFileSync('.env'));
        } catch (e) {
            console.warn('Could not read .env file, falling back to process.env');
        }

        // Helper to get value
        const getEnv = (key) => envConfig[key] !== undefined ? envConfig[key] : process.env[key];

        const config = {
            templatePath: getEnv('CERTIFICATE_TEMPLATE_PATH') || './templates/certificate.png',
            excelPath: getEnv('EXCEL_FILE_PATH') || './data/participants.xlsx',
            eventName: getEnv('EVENT_NAME') || '',
            certificateIdPrefix: getEnv('CERTIFICATE_ID_PREFIX') || 'CERT',
            email: {
                fromName: getEnv('EMAIL_FROM_NAME') || '',
                subject: getEnv('EMAIL_SUBJECT') || '',
                delay: parseInt(getEnv('EMAIL_DELAY')) || 3000
            },
            positions: {
                name: {
                    x: parseInt(getEnv('NAME_X')) || 1240,
                    y: parseInt(getEnv('NAME_Y')) || 1400,
                    fontSize: parseInt(getEnv('NAME_FONT_SIZE')) || 80,
                    color: getEnv('NAME_COLOR') || '#1a1a1a',
                    font: getEnv('NAME_FONT') || 'Arial',
                    enabled: getEnv('NAME_ENABLED') !== 'false'
                },
                event: {
                    x: parseInt(getEnv('EVENT_X')) || 1240,
                    y: parseInt(getEnv('EVENT_Y')) || 1600,
                    fontSize: parseInt(getEnv('EVENT_FONT_SIZE')) || 50,
                    color: getEnv('EVENT_COLOR') || '#4a4a4a',
                    font: getEnv('EVENT_FONT') || 'Arial',
                    enabled: getEnv('EVENT_ENABLED') !== 'false'
                },
                certId: {
                    x: parseInt(getEnv('CERT_ID_X')) || 200,
                    y: parseInt(getEnv('CERT_ID_Y')) || 3200,
                    fontSize: parseInt(getEnv('CERT_ID_FONT_SIZE')) || 30,
                    color: getEnv('CERT_ID_COLOR') || '#888888',
                    font: getEnv('CERT_ID_FONT') || 'Arial',
                    enabled: getEnv('CERT_ID_ENABLED') !== 'false'
                },
                qr: {
                    x: parseInt(process.env.QR_X) || 2100,
                    y: parseInt(process.env.QR_Y) || 3000,
                    size: parseInt(process.env.QR_SIZE) || 200,
                    enabled: process.env.QR_ENABLED === 'true'
                }
            },
            email: {
                fromName: process.env.EMAIL_FROM_NAME || '',
                subject: process.env.EMAIL_SUBJECT || '',
                delay: parseInt(process.env.EMAIL_DELAY) || 3000
            }
        };

        res.json(config);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /api/config - Update configuration
 */
router.put('/config', (req, res) => {
    try {
        const { positions, eventName, certificateIdPrefix, email } = req.body;

        // Update .env file
        let envContent = fs.readFileSync('.env', 'utf-8');

        if (positions) {
            if (positions.name) {
                envContent = updateEnvVar(envContent, 'NAME_X', positions.name.x);
                envContent = updateEnvVar(envContent, 'NAME_Y', positions.name.y);
                envContent = updateEnvVar(envContent, 'NAME_FONT_SIZE', positions.name.fontSize);
                envContent = updateEnvVar(envContent, 'NAME_COLOR', positions.name.color);
                envContent = updateEnvVar(envContent, 'NAME_FONT', positions.name.font || 'Arial');
                envContent = updateEnvVar(envContent, 'NAME_ENABLED', positions.name.enabled !== false);
            }
            if (positions.event) {
                envContent = updateEnvVar(envContent, 'EVENT_X', positions.event.x);
                envContent = updateEnvVar(envContent, 'EVENT_Y', positions.event.y);
                envContent = updateEnvVar(envContent, 'EVENT_FONT_SIZE', positions.event.fontSize);
                envContent = updateEnvVar(envContent, 'EVENT_COLOR', positions.event.color);
                envContent = updateEnvVar(envContent, 'EVENT_FONT', positions.event.font || 'Arial');
                envContent = updateEnvVar(envContent, 'EVENT_ENABLED', positions.event.enabled !== false);
            }
            if (positions.certId) {
                envContent = updateEnvVar(envContent, 'CERT_ID_X', positions.certId.x);
                envContent = updateEnvVar(envContent, 'CERT_ID_Y', positions.certId.y);
                envContent = updateEnvVar(envContent, 'CERT_ID_FONT_SIZE', positions.certId.fontSize);
                envContent = updateEnvVar(envContent, 'CERT_ID_COLOR', positions.certId.color);
                envContent = updateEnvVar(envContent, 'CERT_ID_FONT', positions.certId.font || 'Arial');
                envContent = updateEnvVar(envContent, 'CERT_ID_ENABLED', positions.certId.enabled !== false);
            }
            if (positions.qr) {
                envContent = updateEnvVar(envContent, 'QR_X', positions.qr.x);
                envContent = updateEnvVar(envContent, 'QR_Y', positions.qr.y);
                envContent = updateEnvVar(envContent, 'QR_SIZE', positions.qr.size);
                envContent = updateEnvVar(envContent, 'QR_ENABLED', positions.qr.enabled === true);
            }
        }

        if (eventName) {
            envContent = updateEnvVar(envContent, 'EVENT_NAME', eventName);
        }

        if (certificateIdPrefix) {
            envContent = updateEnvVar(envContent, 'CERTIFICATE_ID_PREFIX', certificateIdPrefix);
        }

        if (email) {
            if (email.fromName) envContent = updateEnvVar(envContent, 'EMAIL_FROM_NAME', email.fromName);
            if (email.subject) envContent = updateEnvVar(envContent, 'EMAIL_SUBJECT', email.subject);
            if (email.delay) envContent = updateEnvVar(envContent, 'EMAIL_DELAY', email.delay);
        }

        fs.writeFileSync('.env', envContent);

        // Reload process.env from file to ensure immediate updates
        const newEnvConfig = require('dotenv').parse(envContent);
        for (const k in newEnvConfig) {
            process.env[k] = newEnvConfig[k];
        }

        console.log('Configuration saved and process.env updated');

        res.json({ success: true, message: 'Configuration updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/upload-csv - Upload participant CSV/Excel file
 */
router.post('/upload-csv', upload.single('csvFile'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Validate the file
        const logger = new Logger('./logs');
        const excelService = new ExcelService(logger);
        const validatorService = new ValidatorService(logger);

        const participants = excelService.readExcelFile(req.file.path);
        const validation = validatorService.validateExcelData(participants);

        res.json({
            success: true,
            filename: req.file.filename,
            totalRows: participants.length,
            validRows: validation.validParticipants.length,
            invalidRows: validation.errors.length,
            errors: validation.errors,
            preview: validation.validParticipants.slice(0, 5) // First 5 rows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/upload-template - Upload certificate template PNG
 */
router.post('/upload-template', upload.single('templateImage'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { createCanvas, loadImage } = require('canvas');

        // Validate it's a valid image
        loadImage(req.file.path).then(img => {
            res.json({
                success: true,
                filename: req.file.filename,
                width: img.width,
                height: img.height,
                path: req.file.path
            });
        }).catch(err => {
            res.status(400).json({ error: 'Invalid image file' });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/preview - Generate preview certificate
 */
router.post('/preview', async (req, res) => {
    try {
        const { name, event } = req.body;

        const logger = new Logger('./logs');

        // Load current config directly from file to bypass cache
        const envConfig = require('dotenv').parse(fs.readFileSync('.env'));

        // Helper to get value from env file or process.env
        const getEnv = (key) => envConfig[key] !== undefined ? envConfig[key] : process.env[key];

        console.log('Generating preview with config:', {
            nameX: getEnv('NAME_X'),
            nameY: getEnv('NAME_Y'),
            nameEnabled: getEnv('NAME_ENABLED')
        });

        const certConfig = {
            templatePath: getEnv('CERTIFICATE_TEMPLATE_PATH') || './templates/certificate.png',
            fontPath: getEnv('FONT_PATH') || './templates/font.ttf',
            outputDir: './output/previews',
            nameX: parseInt(getEnv('NAME_X')) || 1240,
            nameY: parseInt(getEnv('NAME_Y')) || 1400,
            nameFontSize: parseInt(getEnv('NAME_FONT_SIZE')) || 80,
            nameColor: getEnv('NAME_COLOR') || '#1a1a1a',
            nameFont: getEnv('NAME_FONT') || 'Arial',
            nameEnabled: getEnv('NAME_ENABLED') !== 'false',
            eventX: parseInt(getEnv('EVENT_X')) || 1240,
            eventY: parseInt(getEnv('EVENT_Y')) || 1600,
            eventFontSize: parseInt(getEnv('EVENT_FONT_SIZE')) || 50,
            eventColor: getEnv('EVENT_COLOR') || '#4a4a4a',
            eventFont: getEnv('EVENT_FONT') || 'Arial',
            eventEnabled: getEnv('EVENT_ENABLED') !== 'false',
            certIdX: parseInt(getEnv('CERT_ID_X')) || 200,
            certIdY: parseInt(getEnv('CERT_ID_Y')) || 3200,
            certIdFontSize: parseInt(getEnv('CERT_ID_FONT_SIZE')) || 30,
            certIdColor: getEnv('CERT_ID_COLOR') || '#888888',
            certIdFont: getEnv('CERT_ID_FONT') || 'Arial',
            certIdEnabled: getEnv('CERT_ID_ENABLED') !== 'false',
            qrEnabled: getEnv('QR_ENABLED') === 'true',
            qrX: parseInt(getEnv('QR_X')) || 2100,
            qrY: parseInt(getEnv('QR_Y')) || 3000,
            qrSize: parseInt(getEnv('QR_SIZE')) || 200,
            verificationUrl: getEnv('VERIFICATION_URL') || 'https://yourclub.com/verify/'
        };

        const certificateService = new CertificateService(logger, certConfig);

        const participant = {
            name: name || 'John Smith',
            event: event || process.env.EVENT_NAME || 'Sample Event',
            certificateId: 'PREVIEW-001'
        };

        const pdfPath = await certificateService.generateCertificate(participant);

        res.json({
            success: true,
            pdfPath: pdfPath,
            downloadUrl: `/preview/${path.basename(pdfPath)}`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/process - Start certificate processing
 */
router.post('/process', async (req, res) => {
    try {
        if (processingStatus.isProcessing) {
            return res.status(409).json({ error: 'Processing is already in progress' });
        }

        // Reset status
        processingStatus = {
            isProcessing: true,
            progress: 0,
            total: 0,
            success: 0,
            failed: 0,
            currentParticipant: 'Initializing...',
            logs: []
        };
        broadcastStatus(processingStatus);

        // Create a custom logger that captures logs for the UI
        class WebLogger extends Logger {
            log(level, message, ...args) {
                super.log(level, message, ...args);

                // Add to memory logs
                const timestamp = new Date().toISOString();
                const logEntry = { type: level, message, timestamp };
                processingStatus.logs.push(logEntry);

                // Keep log size manageable
                if (processingStatus.logs.length > 500) {
                    processingStatus.logs.shift();
                }

                // Broadcast update
                broadcastStatus(processingStatus);
            }
        }

        const webLogger = new WebLogger('./logs');
        const automationService = new AutomationService(webLogger);

        // Run asynchronously
        automationService.run({
            mode: req.body.mode || process.env.MODE || 'production',
            onProgress: (status) => {
                processingStatus = { ...processingStatus, ...status };
                broadcastStatus(processingStatus);
            }
        }).then(results => {
            processingStatus.isProcessing = false;
            processingStatus.currentParticipant = 'Completed';
            broadcastStatus(processingStatus);
        }).catch(error => {
            processingStatus.isProcessing = false;
            processingStatus.currentParticipant = 'Error: ' + error.message;
            const logEntry = { type: 'error', message: error.message, timestamp: new Date().toISOString() };
            processingStatus.logs.push(logEntry);
            broadcastStatus(processingStatus);
        });

        res.json({ success: true, message: 'Processing started' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/status - Server-Sent Events for real-time status
 */
router.get('/status', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Add client to list
    sseClients.push(res);

    // Send initial status
    res.write(`data: ${JSON.stringify(processingStatus)}\n\n`);

    // Remove client on disconnect
    req.on('close', () => {
        sseClients = sseClients.filter(client => client !== res);
    });
});

/**
 * GET /api/logs - Get delivery logs
 */
router.get('/logs', (req, res) => {
    try {
        const logDir = './logs';
        const files = fs.readdirSync(logDir);
        const deliveryLogs = files.filter(f => f.startsWith('delivery-'));

        if (deliveryLogs.length === 0) {
            return res.json({ logs: [] });
        }

        // Get most recent log
        const latestLog = deliveryLogs.sort().reverse()[0];
        const logPath = path.join(logDir, latestLog);
        const content = fs.readFileSync(logPath, 'utf-8');

        // Parse CSV
        const lines = content.split('\n').filter(l => l.trim());
        const headers = lines[0].split(',');
        const logs = lines.slice(1).map(line => {
            const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g);
            if (!values) return null;

            const obj = {};
            headers.forEach((header, i) => {
                obj[header.trim()] = values[i] ? values[i].replace(/"/g, '').trim() : '';
            });
            return obj;
        }).filter(Boolean);

        res.json({ logs });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Helper function to update environment variable
 */
function updateEnvVar(content, key, value) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
        return content.replace(regex, `${key}=${value}`);
    } else {
        return content + `\n${key}=${value}`;
    }
}

/**
 * Broadcast status update to all SSE clients
 */
function broadcastStatus(status) {
    processingStatus = { ...processingStatus, ...status };
    sseClients.forEach(client => {
        client.write(`data: ${JSON.stringify(processingStatus)}\n\n`);
    });
}

module.exports = { router, broadcastStatus, processingStatus };
