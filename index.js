#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { readConfig, writeData, copyFile, deleteFiles, createDirectory } = require('./file-operations');
const { processUserData, calculateAverage, parseCSV, divide, getNestedValue } = require('./data-processor');
const logger = require('./logger');

/**
 * File Backup Manager - Main Application
 * Demonstrates comprehensive error handling in a real-world application
 */

class BackupManager {
    constructor(configPath = './config.json') {
        this.configPath = configPath;
        this.config = null;
        this.backupHistory = [];
    }

    /**
     * Initialize the backup manager
     */
    async initialize() {
        try {
            logger.info('Initializing Backup Manager...');

            // Load configuration
            try {
                this.config = readConfig(this.configPath);
                logger.success(`Configuration loaded from ${this.configPath}`);
            } catch (error) {
                logger.warn(`No configuration file found at ${this.configPath}`);
                logger.info('Creating default configuration...');
                this.config = this.createDefaultConfig();
                writeData(this.configPath, this.config);
                logger.success('Default configuration created');
            }

            // Validate configuration
            this.validateConfig();

            // Ensure backup directory exists
            createDirectory(this.config.backupDirectory);
            logger.success(`Backup directory ready: ${this.config.backupDirectory}`);

            return true;
        } catch (error) {
            logger.error(`Failed to initialize: ${error.message}`);
            throw error;
        }
    }

    /**
     * Create default configuration
     */
    createDefaultConfig() {
        return {
            backupDirectory: './backups',
            sourceDirectories: ['./data'],
            excludePatterns: ['*.tmp', '*.log', 'node_modules'],
            maxBackups: 5,
            compressionEnabled: false
        };
    }

    /**
     * Validate configuration
     */
    validateConfig() {
        if (!this.config.backupDirectory) {
            throw new Error('Configuration error: backupDirectory is required');
        }

        if (!Array.isArray(this.config.sourceDirectories)) {
            throw new Error('Configuration error: sourceDirectories must be an array');
        }

        if (this.config.sourceDirectories.length === 0) {
            throw new Error('Configuration error: at least one source directory is required');
        }
    }

    /**
     * Perform backup operation
     */
    async backup() {
        try {
            logger.info('Starting backup operation...');

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupDir = path.join(this.config.backupDirectory, `backup-${timestamp}`);

            createDirectory(backupDir);
            logger.info(`Created backup directory: ${backupDir}`);

            const results = {
                timestamp,
                backupDir,
                filesBackedUp: [],
                filesFailed: [],
                totalSize: 0
            };

            // Process each source directory
            for (const sourceDir of this.config.sourceDirectories) {
                try {
                    if (!fs.existsSync(sourceDir)) {
                        logger.warn(`Source directory not found, skipping: ${sourceDir}`);
                        continue;
                    }

                    logger.info(`Backing up from: ${sourceDir}`);
                    await this.backupDirectory(sourceDir, backupDir, results);
                } catch (error) {
                    logger.error(`Failed to backup ${sourceDir}: ${error.message}`);
                    results.filesFailed.push({ path: sourceDir, error: error.message });
                }
            }

            // Save backup metadata
            const metadataPath = path.join(backupDir, 'backup-metadata.json');
            writeData(metadataPath, results);

            // Add to history
            this.backupHistory.push(results);

            // Cleanup old backups
            await this.cleanupOldBackups();

            logger.success(`Backup completed successfully!`);
            logger.info(`Files backed up: ${results.filesBackedUp.length}`);
            logger.info(`Files failed: ${results.filesFailed.length}`);
            logger.info(`Total size: ${this.formatBytes(results.totalSize)}`);

            return results;
        } catch (error) {
            logger.error(`Backup operation failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Backup a directory recursively
     */
    async backupDirectory(sourceDir, backupDir, results) {
        const items = fs.readdirSync(sourceDir);

        for (const item of items) {
            const sourcePath = path.join(sourceDir, item);
            const stats = fs.statSync(sourcePath);

            // Skip excluded patterns
            if (this.shouldExclude(item)) {
                logger.debug(`Skipping excluded file: ${item}`);
                continue;
            }

            if (stats.isDirectory()) {
                const newBackupDir = path.join(backupDir, item);
                createDirectory(newBackupDir);
                await this.backupDirectory(sourcePath, newBackupDir, results);
            } else if (stats.isFile()) {
                try {
                    const destPath = path.join(backupDir, item);
                    copyFile(sourcePath, destPath);
                    results.filesBackedUp.push(sourcePath);
                    results.totalSize += stats.size;
                    logger.debug(`Backed up: ${sourcePath}`);
                } catch (error) {
                    logger.error(`Failed to backup file ${sourcePath}: ${error.message}`);
                    results.filesFailed.push({ path: sourcePath, error: error.message });
                }
            }
        }
    }

    /**
     * Check if file should be excluded
     */
    shouldExclude(filename) {
        if (!this.config.excludePatterns) return false;

        return this.config.excludePatterns.some(pattern => {
            const regex = new RegExp(pattern.replace(/\*/g, '.*'));
            return regex.test(filename);
        });
    }

    /**
     * Cleanup old backups
     */
    async cleanupOldBackups() {
        try {
            if (!this.config.maxBackups || this.config.maxBackups <= 0) {
                return;
            }

            const backupDirs = fs.readdirSync(this.config.backupDirectory)
                .filter(dir => dir.startsWith('backup-'))
                .map(dir => ({
                    name: dir,
                    path: path.join(this.config.backupDirectory, dir),
                    time: fs.statSync(path.join(this.config.backupDirectory, dir)).mtime
                }))
                .sort((a, b) => b.time - a.time);

            if (backupDirs.length > this.config.maxBackups) {
                const toDelete = backupDirs.slice(this.config.maxBackups);
                logger.info(`Cleaning up ${toDelete.length} old backup(s)...`);

                for (const backup of toDelete) {
                    try {
                        this.deleteDirectoryRecursive(backup.path);
                        logger.info(`Deleted old backup: ${backup.name}`);
                    } catch (error) {
                        logger.error(`Failed to delete old backup ${backup.name}: ${error.message}`);
                    }
                }
            }
        } catch (error) {
            logger.warn(`Failed to cleanup old backups: ${error.message}`);
        }
    }

    /**
     * Delete directory recursively
     */
    deleteDirectoryRecursive(dirPath) {
        if (fs.existsSync(dirPath)) {
            fs.readdirSync(dirPath).forEach((file) => {
                const curPath = path.join(dirPath, file);
                if (fs.lstatSync(curPath).isDirectory()) {
                    this.deleteDirectoryRecursive(curPath);
                } else {
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(dirPath);
        }
    }

    /**
     * Show backup status
     */
    async status() {
        try {
            logger.info('Backup Status');
            logger.info('='.repeat(50));
            logger.info(`Configuration file: ${this.configPath}`);
            logger.info(`Backup directory: ${this.config.backupDirectory}`);
            logger.info(`Source directories: ${this.config.sourceDirectories.join(', ')}`);
            logger.info(`Max backups to keep: ${this.config.maxBackups}`);

            if (!fs.existsSync(this.config.backupDirectory)) {
                logger.warn('No backups found');
                return;
            }

            const backups = fs.readdirSync(this.config.backupDirectory)
                .filter(dir => dir.startsWith('backup-'))
                .map(dir => {
                    const backupPath = path.join(this.config.backupDirectory, dir);
                    const metadataPath = path.join(backupPath, 'backup-metadata.json');

                    let metadata = { filesBackedUp: [], totalSize: 0 };
                    if (fs.existsSync(metadataPath)) {
                        try {
                            metadata = readConfig(metadataPath);
                        } catch (error) {
                            logger.warn(`Could not read metadata for ${dir}`);
                        }
                    }

                    return {
                        name: dir,
                        time: fs.statSync(backupPath).mtime,
                        fileCount: metadata.filesBackedUp ? metadata.filesBackedUp.length : 0,
                        size: metadata.totalSize || 0
                    };
                })
                .sort((a, b) => b.time - a.time);

            logger.info(`\nTotal backups: ${backups.length}`);
            logger.info('='.repeat(50));

            backups.forEach((backup, index) => {
                logger.info(`\n${index + 1}. ${backup.name}`);
                logger.info(`   Date: ${backup.time.toLocaleString()}`);
                logger.info(`   Files: ${backup.fileCount}`);
                logger.info(`   Size: ${this.formatBytes(backup.size)}`);
            });

        } catch (error) {
            logger.error(`Failed to get status: ${error.message}`);
            throw error;
        }
    }

    /**
     * Restore from a backup
     */
    async restore(backupName, restoreDirectory) {
        try {
            logger.info(`Starting restore operation...`);

            const backupPath = path.join(this.config.backupDirectory, backupName);

            if (!fs.existsSync(backupPath)) {
                throw new Error(`Backup not found: ${backupName}`);
            }

            createDirectory(restoreDirectory);
            logger.info(`Restoring to: ${restoreDirectory}`);

            const results = {
                filesRestored: [],
                filesFailed: []
            };

            await this.restoreDirectory(backupPath, restoreDirectory, results);

            logger.success(`Restore completed successfully!`);
            logger.info(`Files restored: ${results.filesRestored.length}`);
            logger.info(`Files failed: ${results.filesFailed.length}`);

            return results;
        } catch (error) {
            logger.error(`Restore operation failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Restore directory recursively
     */
    async restoreDirectory(backupPath, restoreDir, results) {
        const items = fs.readdirSync(backupPath);

        for (const item of items) {
            // Skip metadata file
            if (item === 'backup-metadata.json') continue;

            const sourcePath = path.join(backupPath, item);
            const destPath = path.join(restoreDir, item);
            const stats = fs.statSync(sourcePath);

            if (stats.isDirectory()) {
                createDirectory(destPath);
                await this.restoreDirectory(sourcePath, destPath, results);
            } else if (stats.isFile()) {
                try {
                    copyFile(sourcePath, destPath);
                    results.filesRestored.push(destPath);
                    logger.debug(`Restored: ${destPath}`);
                } catch (error) {
                    logger.error(`Failed to restore file ${sourcePath}: ${error.message}`);
                    results.filesFailed.push({ path: sourcePath, error: error.message });
                }
            }
        }
    }

    /**
     * Format bytes to human readable format
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'help';

    const manager = new BackupManager();

    try {
        await manager.initialize();

        switch (command) {
            case 'backup':
                await manager.backup();
                break;

            case 'status':
                await manager.status();
                break;

            case 'restore':
                const backupName = args[1];
                const restoreDir = args[2] || './restored';

                if (!backupName) {
                    logger.error('Usage: node index.js restore <backup-name> [restore-directory]');
                    process.exit(1);
                }

                await manager.restore(backupName, restoreDir);
                break;

            case 'help':
            default:
                console.log(`
File Backup Manager - Usage:

  node index.js backup                           Create a new backup
  node index.js status                           Show backup status
  node index.js restore <name> [restore-dir]     Restore from backup
  node index.js help                             Show this help

Examples:
  node index.js backup
  node index.js status
  node index.js restore backup-2026-01-18T12-00-00-000Z ./restored

Configuration:
  Edit config.json to customize backup settings
                `);
                break;
        }
    } catch (error) {
        logger.error(`Application error: ${error.message}`);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error.message);
        process.exit(1);
    });
}

module.exports = BackupManager;
