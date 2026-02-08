const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');
const { PDFDocument } = require('pdf-lib');
const QRCode = require('qrcode');
const { calculateFontSize, sanitizeFilename } = require('../utils/helpers');

/**
 * Certificate service for generating certificates
 */
class CertificateService {
    constructor(logger, config) {
        this.logger = logger;
        this.config = config;

        // Register custom font if provided
        if (config.fontPath && fs.existsSync(config.fontPath)) {
            try {
                registerFont(config.fontPath, { family: 'CustomFont' });
                this.fontFamily = 'CustomFont';
                this.logger.success('Custom font loaded successfully');
            } catch (error) {
                this.logger.warning('Failed to load custom font, using default');
                this.fontFamily = 'Arial';
            }
        } else {
            this.fontFamily = 'Arial';
        }
    }

    /**
     * Generate certificate for a participant
     * @param {Object} participant - Participant data
     * @returns {string} - Path to generated PDF
     */
    async generateCertificate(participant) {
        try {
            this.logger.info(`Generating certificate for ${participant.name}`);

            // Load template image
            const template = await loadImage(this.config.templatePath);

            // Create canvas with template dimensions
            const canvas = createCanvas(template.width, template.height);
            const ctx = canvas.getContext('2d');

            // Draw template
            ctx.drawImage(template, 0, 0);

            // Add participant name (only if enabled)
            if (this.config.nameEnabled !== false) {
                await this.addText(
                    ctx,
                    participant.name,
                    this.config.nameX,
                    this.config.nameY,
                    this.config.nameFontSize,
                    this.config.nameColor,
                    this.config.nameFont || 'Arial',
                    template.width * 0.7 // Max width for name
                );
            }

            // Add event name (only if enabled)
            /* TEMPORARILY DISABLED
            if (this.config.eventEnabled !== false) {
                await this.addText(
                    ctx,
                    participant.event,
                    this.config.eventX,
                    this.config.eventY,
                    this.config.eventFontSize,
                    this.config.eventColor,
                    this.config.eventFont || 'Arial'
                );
            }
            */

            // Add certificate ID (only if enabled)
            if (this.config.certIdEnabled !== false) {
                await this.addText(
                    ctx,
                    participant.certificateId,
                    this.config.certIdX,
                    this.config.certIdY,
                    this.config.certIdFontSize,
                    this.config.certIdColor,
                    this.config.certIdFont || 'Arial'
                );
            }

            // Add QR code if enabled
            if (this.config.qrEnabled) {
                await this.addQRCode(
                    ctx,
                    participant.certificateId,
                    this.config.qrX,
                    this.config.qrY,
                    this.config.qrSize
                );
            }

            // Convert canvas to PDF
            const pdfPath = await this.convertToPDF(canvas, participant);

            this.logger.success(`Certificate generated: ${pdfPath}`);
            return pdfPath;
        } catch (error) {
            this.logger.error(`Failed to generate certificate for ${participant.name}`, error);
            throw error;
        }
    }

    /**
     * Add text to canvas with auto font sizing
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {string} text - Text to add
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} fontSize - Base font size
     * @param {string} color - Text color
     * @param {string} fontFamily - Font family to use
     * @param {number} maxWidth - Maximum width (optional)
     */
    async addText(ctx, text, x, y, fontSize, color, fontFamily = 'Arial', maxWidth = null) {
        // Calculate optimal font size if maxWidth is provided
        let finalFontSize = fontSize;
        if (maxWidth) {
            finalFontSize = calculateFontSize(text, maxWidth, fontSize);
        }

        ctx.font = `bold ${finalFontSize}px "${fontFamily}"`;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillText(text, x, y);
    }

    /**
     * Add QR code to canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {string} certificateId - Certificate ID
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} size - QR code size
     */
    async addQRCode(ctx, certificateId, x, y, size) {
        try {
            const verificationUrl = `${this.config.verificationUrl}${certificateId}`;
            const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
                width: size,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });

            const qrImage = await loadImage(qrDataUrl);
            ctx.drawImage(qrImage, x, y, size, size);
        } catch (error) {
            this.logger.warning('Failed to generate QR code', error);
        }
    }

    /**
     * Convert canvas to PDF
     * @param {Canvas} canvas - Canvas object
     * @param {Object} participant - Participant data
     * @returns {string} - Path to PDF file
     */
    async convertToPDF(canvas, participant) {
        // Create PDF document
        const pdfDoc = await PDFDocument.create();

        // Convert canvas to PNG buffer
        const pngBuffer = canvas.toBuffer('image/png');

        // Embed PNG in PDF
        const pngImage = await pdfDoc.embedPng(pngBuffer);
        const pngDims = pngImage.scale(1);

        // Add page with image dimensions
        const page = pdfDoc.addPage([pngDims.width, pngDims.height]);
        page.drawImage(pngImage, {
            x: 0,
            y: 0,
            width: pngDims.width,
            height: pngDims.height
        });

        // Save PDF
        const pdfBytes = await pdfDoc.save();

        // Generate filename
        const filename = this.generateFilename(participant);
        const outputPath = path.join(this.config.outputDir, filename);

        // Ensure output directory exists
        if (!fs.existsSync(this.config.outputDir)) {
            fs.mkdirSync(this.config.outputDir, { recursive: true });
        }

        fs.writeFileSync(outputPath, pdfBytes);

        return outputPath;
    }

    /**
     * Generate unique filename for certificate
     * @param {Object} participant - Participant data
     * @returns {string} - Filename
     */
    generateFilename(participant) {
        const sanitizedName = sanitizeFilename(participant.name);
        return `certificate_${participant.certificateId}_${sanitizedName}.pdf`;
    }
}

module.exports = CertificateService;
