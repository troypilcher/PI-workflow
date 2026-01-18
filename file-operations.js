const fs = require('fs');
const path = require('path');

/**
 * Reads a configuration file and parses JSON
 * IMPROVED: Added comprehensive error handling with clear error messages
 */
function readConfig(filePath) {
    if (!filePath || typeof filePath !== 'string') {
        throw new Error('Invalid file path: filePath must be a non-empty string');
    }

    try {
        const data = fs.readFileSync(filePath, 'utf8');

        try {
            const config = JSON.parse(data);
            return config;
        } catch (parseError) {
            throw new Error(`Failed to parse JSON from file '${filePath}': ${parseError.message}`);
        }
    } catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error(`Configuration file not found: '${filePath}'`);
        } else if (error.code === 'EACCES') {
            throw new Error(`Permission denied reading file: '${filePath}'`);
        } else if (error.code === 'EISDIR') {
            throw new Error(`Expected a file but found a directory: '${filePath}'`);
        } else if (error.message.includes('Failed to parse JSON')) {
            throw error;
        } else {
            throw new Error(`Failed to read configuration file '${filePath}': ${error.message}`);
        }
    }
}

/**
 * Writes data to a file
 * IMPROVED: Added error handling for various write failures
 */
function writeData(filePath, data) {
    if (!filePath || typeof filePath !== 'string') {
        throw new Error('Invalid file path: filePath must be a non-empty string');
    }

    if (data === undefined) {
        throw new Error('Invalid data: data cannot be undefined');
    }

    try {
        const jsonString = JSON.stringify(data);
        fs.writeFileSync(filePath, jsonString);
        return true;
    } catch (error) {
        if (error.code === 'EACCES') {
            throw new Error(`Permission denied writing to file: '${filePath}'`);
        } else if (error.code === 'ENOSPC') {
            throw new Error(`Not enough disk space to write file: '${filePath}'`);
        } else if (error.code === 'ENOENT') {
            throw new Error(`Directory does not exist for file: '${filePath}'`);
        } else if (error.code === 'EISDIR') {
            throw new Error(`Cannot write to a directory: '${filePath}'`);
        } else {
            throw new Error(`Failed to write data to file '${filePath}': ${error.message}`);
        }
    }
}

/**
 * Copies a file from source to destination
 * IMPROVED: Added validation and comprehensive error handling
 */
function copyFile(source, destination) {
    if (!source || typeof source !== 'string') {
        throw new Error('Invalid source path: source must be a non-empty string');
    }

    if (!destination || typeof destination !== 'string') {
        throw new Error('Invalid destination path: destination must be a non-empty string');
    }

    if (source === destination) {
        throw new Error('Source and destination paths must be different');
    }

    try {
        // Check if source exists and is a file
        const stats = fs.statSync(source);
        if (!stats.isFile()) {
            throw new Error(`Source is not a file: '${source}'`);
        }

        const content = fs.readFileSync(source);

        try {
            fs.writeFileSync(destination, content);
        } catch (writeError) {
            if (writeError.code === 'EACCES') {
                throw new Error(`Permission denied writing to destination: '${destination}'`);
            } else if (writeError.code === 'ENOSPC') {
                throw new Error(`Not enough disk space to copy file to: '${destination}'`);
            } else {
                throw new Error(`Failed to write to destination '${destination}': ${writeError.message}`);
            }
        }
    } catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error(`Source file not found: '${source}'`);
        } else if (error.code === 'EACCES') {
            throw new Error(`Permission denied reading source file: '${source}'`);
        } else if (error.message.includes('Source is not a file') ||
                   error.message.includes('Permission denied') ||
                   error.message.includes('Not enough disk space') ||
                   error.message.includes('Failed to write')) {
            throw error;
        } else {
            throw new Error(`Failed to copy file from '${source}' to '${destination}': ${error.message}`);
        }
    }
}

/**
 * Deletes multiple files
 * IMPROVED: Added error collection and reporting for failed deletions
 */
function deleteFiles(filePaths) {
    if (!Array.isArray(filePaths)) {
        throw new Error('Invalid input: filePaths must be an array');
    }

    if (filePaths.length === 0) {
        return { deleted: [], failed: [] };
    }

    const results = {
        deleted: [],
        failed: []
    };

    filePaths.forEach(filePath => {
        if (!filePath || typeof filePath !== 'string') {
            results.failed.push({
                path: filePath,
                error: 'Invalid file path: must be a non-empty string'
            });
            return;
        }

        try {
            fs.unlinkSync(filePath);
            results.deleted.push(filePath);
        } catch (error) {
            let errorMessage;
            if (error.code === 'ENOENT') {
                errorMessage = `File not found: '${filePath}'`;
            } else if (error.code === 'EACCES') {
                errorMessage = `Permission denied: '${filePath}'`;
            } else if (error.code === 'EISDIR') {
                errorMessage = `Cannot delete directory with unlink: '${filePath}'`;
            } else if (error.code === 'EBUSY') {
                errorMessage = `File is in use: '${filePath}'`;
            } else {
                errorMessage = `Failed to delete '${filePath}': ${error.message}`;
            }

            results.failed.push({
                path: filePath,
                error: errorMessage
            });
        }
    });

    if (results.failed.length > 0) {
        const failedSummary = results.failed.map(f => `  - ${f.error}`).join('\n');
        console.warn(`Warning: ${results.failed.length} file(s) failed to delete:\n${failedSummary}`);
    }

    return results;
}

/**
 * Creates a directory structure
 * IMPROVED: Added recursive option and proper error handling
 */
function createDirectory(dirPath, options = { recursive: true }) {
    if (!dirPath || typeof dirPath !== 'string') {
        throw new Error('Invalid directory path: dirPath must be a non-empty string');
    }

    try {
        fs.mkdirSync(dirPath, options);
        return true;
    } catch (error) {
        if (error.code === 'EEXIST') {
            // Directory already exists - check if it's actually a directory
            try {
                const stats = fs.statSync(dirPath);
                if (stats.isDirectory()) {
                    return false; // Already exists, not created
                } else {
                    throw new Error(`Path exists but is not a directory: '${dirPath}'`);
                }
            } catch (statError) {
                throw new Error(`Failed to verify existing path '${dirPath}': ${statError.message}`);
            }
        } else if (error.code === 'EACCES') {
            throw new Error(`Permission denied creating directory: '${dirPath}'`);
        } else if (error.code === 'ENOENT' && !options.recursive) {
            throw new Error(`Parent directory does not exist: '${dirPath}'. Use recursive option to create parent directories.`);
        } else if (error.code === 'ENOSPC') {
            throw new Error(`Not enough disk space to create directory: '${dirPath}'`);
        } else {
            throw new Error(`Failed to create directory '${dirPath}': ${error.message}`);
        }
    }
}

module.exports = {
    readConfig,
    writeData,
    copyFile,
    deleteFiles,
    createDirectory
};
