const XLSX = require('xlsx');
const { formatName } = require('../utils/helpers');

/**
 * Excel service for reading and parsing participant data
 */
class ExcelService {
    constructor(logger) {
        this.logger = logger;
    }

    /**
     * Read and parse Excel file
     * @param {string} filePath - Path to Excel file
     * @returns {Array} - Array of participant objects
     */
    readExcelFile(filePath) {
        try {
            this.logger.info(`Reading Excel file: ${filePath}`);

            // Read workbook
            const workbook = XLSX.readFile(filePath);

            // Get first sheet
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Convert to JSON
            const rawData = XLSX.utils.sheet_to_json(worksheet);

            if (rawData.length === 0) {
                throw new Error('Excel file is empty');
            }

            this.logger.success(`Read ${rawData.length} rows from Excel file`);

            // Parse and sanitize data
            const participants = this.parseParticipants(rawData);

            return participants;
        } catch (error) {
            this.logger.error('Failed to read Excel file', error);
            throw error;
        }
    }

    /**
     * Parse and sanitize participant data
     * @param {Array} rawData - Raw data from Excel
     * @returns {Array} - Sanitized participant objects
     */
    parseParticipants(rawData) {
        return rawData.map(row => {
            // Support multiple column name variations
            const name = this.getColumnValue(row, ['name', 'Name', 'NAME', 'Participant Name', 'Full Name']);
            const email = this.getColumnValue(row, ['email', 'Email', 'EMAIL', 'Email Address']);
            const event = this.getColumnValue(row, ['event', 'Event', 'EVENT', 'Event Name']);
            const phone = this.getColumnValue(row, ['phone', 'Phone', 'PHONE', 'Mobile', 'Contact']);
            const organization = this.getColumnValue(row, ['organization', 'Organization', 'ORGANIZATION', 'Company', 'Institution']);

            return {
                name: name ? formatName(name) : '',
                email: email ? email.trim().toLowerCase() : '',
                event: event ? event.trim() : process.env.EVENT_NAME || '',
                phone: phone ? phone.trim() : '',
                organization: organization ? organization.trim() : ''
            };
        });
    }

    /**
     * Get column value by trying multiple possible column names
     * @param {Object} row - Excel row object
     * @param {Array} possibleNames - Array of possible column names
     * @returns {string|null} - Column value or null
     */
    getColumnValue(row, possibleNames) {
        for (const name of possibleNames) {
            if (row[name] !== undefined && row[name] !== null) {
                return String(row[name]);
            }
        }
        return null;
    }

    /**
     * Validate Excel file structure
     * @param {string} filePath - Path to Excel file
     * @returns {Object} - { valid: boolean, message: string }
     */
    validateFileStructure(filePath) {
        try {
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet);

            if (data.length === 0) {
                return { valid: false, message: 'Excel file is empty' };
            }

            // Check for required columns
            const firstRow = data[0];
            const hasName = this.getColumnValue(firstRow, ['name', 'Name', 'NAME', 'Participant Name', 'Full Name']) !== null;
            const hasEmail = this.getColumnValue(firstRow, ['email', 'Email', 'EMAIL', 'Email Address']) !== null;

            if (!hasName || !hasEmail) {
                return {
                    valid: false,
                    message: 'Excel file must contain "Name" and "Email" columns'
                };
            }

            return { valid: true, message: 'File structure is valid' };
        } catch (error) {
            return { valid: false, message: error.message };
        }
    }
}

module.exports = ExcelService;
