/**
 * Helper utilities for certificate automation
 */

/**
 * Format name to proper case (Title Case)
 * @param {string} name - Raw name string
 * @returns {string} - Formatted name
 */
function formatName(name) {
    if (!name) return '';

    return name
        .trim()
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Generate unique certificate ID
 * @param {string} prefix - Certificate ID prefix from env
 * @param {number} index - Participant index
 * @returns {string} - Unique certificate ID
 */
function generateCertificateId(prefix, index) {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const paddedIndex = String(index).padStart(4, '0');
    return `${prefix}-${date}-${paddedIndex}`;
}

/**
 * Sanitize filename to remove invalid characters
 * @param {string} filename - Original filename
 * @returns {string} - Sanitized filename
 */
function sanitizeFilename(filename) {
    return filename
        .replace(/[^a-z0-9_\-\.]/gi, '_')
        .replace(/_+/g, '_')
        .toLowerCase();
}

/**
 * Create delay for rate limiting
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} - Resolves after delay
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate optimal font size for text to fit within max width
 * @param {string} text - Text to measure
 * @param {number} maxWidth - Maximum width in pixels
 * @param {number} baseFontSize - Starting font size
 * @returns {number} - Optimal font size
 */
function calculateFontSize(text, maxWidth, baseFontSize) {
    // Rough estimation: average character width is ~60% of font size
    const estimatedWidth = text.length * (baseFontSize * 0.6);

    if (estimatedWidth <= maxWidth) {
        return baseFontSize;
    }

    // Scale down proportionally
    const scaleFactor = maxWidth / estimatedWidth;
    return Math.floor(baseFontSize * scaleFactor);
}

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} - True if valid
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Get file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Clean up generated files
 * @param {Array} filePaths - Array of file paths to delete
 * @param {Logger} logger - Logger instance
 */
async function cleanupFiles(filePaths, logger) {
    const fs = require('fs').promises;

    for (const filePath of filePaths) {
        try {
            await fs.unlink(filePath);
            logger.info(`Cleaned up: ${filePath}`);
        } catch (error) {
            logger.warning(`Failed to cleanup ${filePath}: ${error.message}`);
        }
    }
}

module.exports = {
    formatName,
    generateCertificateId,
    sanitizeFilename,
    sleep,
    calculateFontSize,
    isValidEmail,
    formatFileSize,
    cleanupFiles
};
