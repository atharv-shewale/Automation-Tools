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
    const AutomationService = require('./services/automationService');

    // Run the application
    const app = new AutomationService();
    app.run().catch(error => {
        console.error('Unhandled error:', error);
        process.exit(1);
    });
}

module.exports = isWebMode ? null : require('./utils/logger');
