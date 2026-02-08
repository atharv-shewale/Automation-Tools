const { isValidEmail } = require('../utils/helpers');

/**
 * Validator service for data validation and sanitization
 */
class ValidatorService {
    constructor(logger) {
        this.logger = logger;
    }

    /**
     * Validate participant data
     * @param {Object} participant - Participant object
     * @returns {Object} - { valid: boolean, errors: Array }
     */
    validateParticipant(participant) {
        const errors = [];

        // Check required fields
        if (!participant.name || participant.name.trim() === '') {
            errors.push('Name is required');
        }

        if (!participant.email || participant.email.trim() === '') {
            errors.push('Email is required');
        } else if (!isValidEmail(participant.email.trim())) {
            errors.push('Invalid email format');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate Excel data structure
     * @param {Array} data - Array of participant objects
     * @returns {Object} - { valid: boolean, validParticipants: Array, errors: Array }
     */
    validateExcelData(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return {
                valid: false,
                validParticipants: [],
                errors: ['Excel file is empty or invalid']
            };
        }

        const validParticipants = [];
        const errors = [];

        data.forEach((participant, index) => {
            const validation = this.validateParticipant(participant);

            if (validation.valid) {
                validParticipants.push(participant);
            } else {
                errors.push({
                    row: index + 2, // +2 for header and 0-index
                    name: participant.name || 'N/A',
                    email: participant.email || 'N/A',
                    errors: validation.errors
                });
            }
        });

        if (errors.length > 0) {
            this.logger.warning(`Found ${errors.length} invalid entries in Excel file`);
            errors.forEach(err => {
                this.logger.warning(`Row ${err.row} (${err.name}): ${err.errors.join(', ')}`);
            });
        }

        return {
            valid: validParticipants.length > 0,
            validParticipants,
            errors
        };
    }

    /**
     * Check for duplicate emails
     * @param {Array} participants - Array of participant objects
     * @returns {Array} - Deduplicated participants
     */
    removeDuplicates(participants) {
        const seen = new Map();
        const duplicates = [];

        participants.forEach(participant => {
            const email = participant.email.toLowerCase().trim();

            if (seen.has(email)) {
                duplicates.push(participant);
            } else {
                seen.set(email, participant);
            }
        });

        if (duplicates.length > 0) {
            this.logger.warning(`Removed ${duplicates.length} duplicate email(s)`);
            duplicates.forEach(dup => {
                this.logger.warning(`Duplicate: ${dup.name} (${dup.email})`);
            });
        }

        return Array.from(seen.values());
    }
}

module.exports = ValidatorService;
