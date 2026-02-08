const fs = require('fs');
const path = require('path');

/**
 * Logger utility for tracking application events and delivery status
 */
class Logger {
  constructor(logDir = './logs') {
    this.logDir = logDir;
    this.logFile = path.join(logDir, `app-${this.getDateString()}.log`);
    this.deliveryLogFile = path.join(logDir, `delivery-${this.getDateString()}.csv`);
    
    // Ensure log directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    // Initialize delivery log CSV
    if (!fs.existsSync(this.deliveryLogFile)) {
      fs.writeFileSync(
        this.deliveryLogFile,
        'Timestamp,Name,Email,CertificateID,Status,Error\n'
      );
    }
  }

  getDateString() {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  formatMessage(level, message) {
    return `[${this.getTimestamp()}] [${level}] ${message}`;
  }

  writeToFile(message) {
    try {
      fs.appendFileSync(this.logFile, message + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }

  info(message) {
    const formatted = this.formatMessage('INFO', message);
    console.log('\x1b[36m%s\x1b[0m', formatted); // Cyan
    this.writeToFile(formatted);
  }

  success(message) {
    const formatted = this.formatMessage('SUCCESS', message);
    console.log('\x1b[32m%s\x1b[0m', formatted); // Green
    this.writeToFile(formatted);
  }

  error(message, error = null) {
    const errorMsg = error ? `${message}: ${error.message}` : message;
    const formatted = this.formatMessage('ERROR', errorMsg);
    console.error('\x1b[31m%s\x1b[0m', formatted); // Red
    this.writeToFile(formatted);
    if (error && error.stack) {
      this.writeToFile(error.stack);
    }
  }

  warning(message) {
    const formatted = this.formatMessage('WARNING', message);
    console.warn('\x1b[33m%s\x1b[0m', formatted); // Yellow
    this.writeToFile(formatted);
  }

  /**
   * Log delivery status to CSV file
   */
  logDelivery(participant, status, error = null) {
    const { name, email, certificateId } = participant;
    const timestamp = this.getTimestamp();
    const errorMsg = error ? error.message.replace(/,/g, ';') : '';
    
    const csvLine = `${timestamp},"${name}","${email}","${certificateId}","${status}","${errorMsg}"`;
    
    try {
      fs.appendFileSync(this.deliveryLogFile, csvLine + '\n');
    } catch (err) {
      this.error('Failed to write delivery log', err);
    }
  }

  separator() {
    const line = '='.repeat(80);
    console.log(line);
    this.writeToFile(line);
  }
}

module.exports = Logger;
