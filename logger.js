const fs = require('fs');
const path = require('path');

/**
 * Simple logger with color support and file logging
 * Demonstrates error handling in logging utilities
 */

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m'
};

class Logger {
    constructor(options = {}) {
        this.logToFile = options.logToFile || false;
        this.logFilePath = options.logFilePath || './logs/app.log';
        this.logLevel = options.logLevel || 'info'; // debug, info, warn, error
        this.enableColors = options.enableColors !== false;

        if (this.logToFile) {
            this.ensureLogDirectory();
        }
    }

    /**
     * Ensure log directory exists
     */
    ensureLogDirectory() {
        try {
            const logDir = path.dirname(this.logFilePath);
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }
        } catch (error) {
            console.error(`Failed to create log directory: ${error.message}`);
        }
    }

    /**
     * Write to log file
     */
    writeToFile(message) {
        if (!this.logToFile) return;

        try {
            const timestamp = new Date().toISOString();
            const logEntry = `[${timestamp}] ${message}\n`;
            fs.appendFileSync(this.logFilePath, logEntry, 'utf8');
        } catch (error) {
            // Don't throw error from logger to avoid infinite loops
            console.error(`Failed to write to log file: ${error.message}`);
        }
    }

    /**
     * Format message with timestamp
     */
    formatMessage(level, message) {
        const timestamp = new Date().toLocaleTimeString();
        return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    }

    /**
     * Log with color
     */
    log(level, message, color = colors.reset) {
        const formattedMessage = this.formatMessage(level, message);

        if (this.enableColors) {
            console.log(`${color}${formattedMessage}${colors.reset}`);
        } else {
            console.log(formattedMessage);
        }

        this.writeToFile(`${level.toUpperCase()}: ${message}`);
    }

    /**
     * Debug level logging
     */
    debug(message) {
        if (this.logLevel === 'debug') {
            this.log('debug', message, colors.gray);
        }
    }

    /**
     * Info level logging
     */
    info(message) {
        if (['debug', 'info'].includes(this.logLevel)) {
            this.log('info', message, colors.cyan);
        }
    }

    /**
     * Success logging
     */
    success(message) {
        if (['debug', 'info'].includes(this.logLevel)) {
            this.log('success', message, colors.green);
        }
    }

    /**
     * Warning level logging
     */
    warn(message) {
        if (['debug', 'info', 'warn'].includes(this.logLevel)) {
            this.log('warn', message, colors.yellow);
        }
    }

    /**
     * Error level logging
     */
    error(message) {
        this.log('error', message, colors.red);
    }

    /**
     * Log with custom color
     */
    custom(message, color) {
        console.log(`${color}${message}${colors.reset}`);
        this.writeToFile(message);
    }
}

// Export singleton instance
module.exports = new Logger({
    logToFile: false,
    logLevel: 'info',
    enableColors: true
});
