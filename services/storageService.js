const fs = require('fs');
const path = require('path');

/**
 * Service to handle certificate data persistence
 */
class StorageService {
    constructor(logger) {
        this.logger = logger;
        this.dataFile = path.join(__dirname, '../data/certificates.json');

        // Ensure data directory exists
        const dataDir = path.dirname(this.dataFile);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Initialize file if not exists
        if (!fs.existsSync(this.dataFile)) {
            fs.writeFileSync(this.dataFile, JSON.stringify({}, null, 2));
        }
    }

    /**
     * Save a certificate to the store
     * @param {Object} participant - Participant data including certificateId
     */
    saveCertificate(participant) {
        try {
            const data = this._readData();
            data[participant.certificateId] = {
                ...participant,
                issuedAt: new Date().toISOString(),
                status: 'VALID'
            };
            this._writeData(data);
            this.logger.info(`Saved verification data for ${participant.certificateId}`);
        } catch (error) {
            this.logger.error('Failed to save certificate data', error);
        }
    }

    /**
     * Get certificate details by ID
     * @param {string} certificateId 
     * @returns {Object|null}
     */
    getCertificate(certificateId) {
        try {
            const data = this._readData();
            return data[certificateId] || null;
        } catch (error) {
            this.logger.error('Failed to read certificate data', error);
            return null;
        }
    }

    _readData() {
        try {
            const content = fs.readFileSync(this.dataFile, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            return {};
        }
    }

    _writeData(data) {
        fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
    }
}

module.exports = StorageService;
