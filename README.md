# File Backup Manager

A production-ready file backup application demonstrating best practices for error handling in JavaScript. This is a complete, fully functional CLI application that you can use right now.

## Quick Start

```bash
# Run a backup
node index.js backup

# Check backup status
node index.js status

# Restore from a backup
node index.js restore backup-2026-01-18T12-00-00-000Z ./restored
```

## Features

- ✅ **Automated Backups**: Back up entire directories with a single command
- ✅ **Smart Exclusions**: Exclude temporary files, logs, and node_modules
- ✅ **Backup History**: Automatically maintains a configurable number of backups
- ✅ **Easy Restoration**: Restore any backup with one command
- ✅ **Detailed Logging**: Color-coded console output with comprehensive error messages
- ✅ **Robust Error Handling**: Continues backing up even if individual files fail
- ✅ **Metadata Tracking**: Stores backup information including file counts and sizes

## Application Structure

```
PI-workflow/
├── index.js                 # Main application and CLI interface
├── file-operations.js       # File operations with error handling
├── api-client.js            # Network operations (for future features)
├── data-processor.js        # Data validation and processing
├── database.js              # Database operations (for future features)
├── logger.js                # Logging utility
├── config.example.json      # Example configuration file
├── package.json             # Package metadata
├── data/                    # Sample source directory
│   ├── documents/
│   └── images/
└── backups/                 # Backup destination (created automatically)
```

## Installation & Setup

1. **Clone or download this repository**

2. **Navigate to the directory**
   ```bash
   cd PI-workflow
   ```

3. **The application is ready to use!** (No npm install needed - uses only Node.js built-in modules)

4. **Optional: Create a custom configuration**
   ```bash
   cp config.example.json config.json
   # Then edit config.json to customize your backup settings
   ```

## Usage

### 1. Create a Backup

```bash
node index.js backup
```

This will:
- Create a timestamped backup directory
- Copy all files from configured source directories
- Exclude files matching patterns (*.tmp, *.log, node_modules, etc.)
- Generate metadata about the backup
- Automatically clean up old backups (keeps latest 5 by default)

Output example:
```
[12:00:00] INFO: Initializing Backup Manager...
[12:00:00] SUCCESS: Configuration loaded from ./config.json
[12:00:00] SUCCESS: Backup directory ready: ./backups
[12:00:00] INFO: Starting backup operation...
[12:00:00] INFO: Created backup directory: ./backups/backup-2026-01-18T12-00-00-000Z
[12:00:00] INFO: Backing up from: ./data
[12:00:01] SUCCESS: Backup completed successfully!
[12:00:01] INFO: Files backed up: 3
[12:00:01] INFO: Files failed: 0
[12:00:01] INFO: Total size: 2.5 KB
```

### 2. Check Backup Status

```bash
node index.js status
```

This displays:
- Configuration details
- List of all backups
- File counts and sizes
- Backup timestamps

Output example:
```
[12:05:00] INFO: Backup Status
[12:05:00] INFO: ==================================================
[12:05:00] INFO: Configuration file: ./config.json
[12:05:00] INFO: Backup directory: ./backups
[12:05:00] INFO: Source directories: ./data
[12:05:00] INFO: Max backups to keep: 5
[12:05:00] INFO:
[12:05:00] INFO: Total backups: 2
[12:05:00] INFO: ==================================================
[12:05:00] INFO:
[12:05:00] INFO: 1. backup-2026-01-18T12-00-00-000Z
[12:05:00] INFO:    Date: 1/18/2026, 12:00:00 PM
[12:05:00] INFO:    Files: 3
[12:05:00] INFO:    Size: 2.5 KB
```

### 3. Restore from Backup

```bash
# Restore to default location (./restored)
node index.js restore backup-2026-01-18T12-00-00-000Z

# Restore to custom location
node index.js restore backup-2026-01-18T12-00-00-000Z ./my-restored-files
```

This will:
- Verify the backup exists
- Create the restore directory
- Copy all files from the backup
- Report results

### 4. Get Help

```bash
node index.js help
```

## Configuration

Edit `config.json` to customize your backup settings:

```json
{
  "backupDirectory": "./backups",
  "sourceDirectories": [
    "./data",
    "./documents",
    "./projects"
  ],
  "excludePatterns": [
    "*.tmp",
    "*.log",
    "node_modules",
    ".git"
  ],
  "maxBackups": 5,
  "compressionEnabled": false
}
```

**Configuration Options:**

- `backupDirectory` (string): Where to store backups
- `sourceDirectories` (array): Directories to back up
- `excludePatterns` (array): File patterns to exclude (supports wildcards)
- `maxBackups` (number): Maximum number of backups to keep (older ones are deleted)
- `compressionEnabled` (boolean): Reserved for future use

## Error Handling Demonstration

This application showcases comprehensive error handling across all operations:

### Real-World Error Handling Examples

**File Not Found:**
```
[12:00:00] WARN: Source directory not found, skipping: ./missing-dir
```

**Permission Denied:**
```
[12:00:00] ERROR: Failed to backup file ./protected.txt: Permission denied reading source file: './protected.txt'
```

**Disk Full:**
```
[12:00:00] ERROR: Failed to backup file ./large.dat: Not enough disk space to copy file to: './backups/backup-xxx/large.dat'
```

**Invalid Configuration:**
```
[12:00:00] ERROR: Failed to initialize: Configuration error: at least one source directory is required
```

The application continues operation even when individual files fail, collecting all errors and reporting them at the end.

## Error Handling Improvements Implemented

### 1. File Operations (`file-operations.js`)

**readConfig(filePath):**
- Input validation for file path
- Specific error messages for ENOENT (file not found), EACCES (permission denied), EISDIR (is directory)
- JSON parsing error handling with clear messages

**writeData(filePath, data):**
- Input validation for path and data
- Error handling for EACCES, ENOSPC (disk full), ENOENT, EISDIR
- JSON serialization error handling

**copyFile(source, destination):**
- Validation that source and destination are different
- Source file existence and type checking
- Separate error handling for read and write operations
- Clear error messages indicating which operation failed

**deleteFiles(filePaths):**
- Array validation
- Individual file deletion with error collection
- Returns summary of successful and failed deletions
- Handles ENOENT, EACCES, EISDIR, EBUSY errors

**createDirectory(dirPath, options):**
- Path validation
- Recursive directory creation support
- Handles EEXIST gracefully (checks if it's actually a directory)
- Error handling for EACCES, ENOENT, ENOSPC

### 2. API Client (`api-client.js`)

**fetchData(url, timeout):**
- URL validation
- Configurable timeout (default 30s)
- HTTP status code validation (rejects non-2xx responses)
- Network error handling (ENOTFOUND, ECONNREFUSED, ETIMEDOUT)
- Empty response detection
- JSON parsing error handling
- Response stream error handling

**postData(url, payload, timeout):**
- URL and payload validation
- JSON serialization error handling
- Timeout support
- HTTP status code validation
- Network error handling with specific messages
- Handles empty responses appropriately

**fetchWithRetry(url, maxRetries, retryDelay):**
- Input validation for all parameters
- Exponential backoff retry strategy
- Error accumulation across attempts
- Smart retry logic (doesn't retry 4xx client errors)
- Comprehensive error summary on final failure

### 3. Data Processor (`data-processor.js`)

**processUserData(userData):**
- Object type validation
- Age validation (required, numeric, range 0-150)
- Email validation (format check with regex)
- Name validation (required, non-empty, max length 200)
- Returns sanitized data

**calculateAverage(numbers):**
- Array type validation
- Empty array detection
- Element-by-element validation (numeric, finite)
- Clear error messages with element index

**parseCSV(csvString):**
- String type validation
- Empty input detection
- Header validation
- Duplicate header detection
- Column count validation for each row
- Row-by-row error reporting with line numbers

**divide(a, b):**
- Type validation for both operands
- NaN detection
- Infinity detection
- Division by zero check

**getNestedValue(obj, path, defaultValue):**
- Null/undefined object validation
- Path validation and parsing
- Safe property traversal
- Optional default value support
- Clear error messages showing exact path traversal location

### 4. Database Operations (`database.js`)

**Constructor:**
- Connection string validation (non-empty, string type)
- Initializes connection state tracking

**connect():**
- Prevents duplicate connections
- Connection string format validation
- Connection state management
- Error handling with state cleanup

**query(sql, params):**
- Connection state validation
- SQL query validation
- Basic SQL injection prevention
- Parameter array validation
- Query execution error handling

**insert(table, data):**
- Connection state validation
- Table name validation (prevents SQL injection)
- Field name validation
- Empty object detection
- Parameterized query construction
- Duplicate key error handling

**update(table, id, data):**
- Connection state validation
- Table and field name validation
- ID validation
- Empty update detection
- Record existence checking
- Parameterized queries

**delete(table, id, options):**
- Requires explicit confirmation ({ confirm: true })
- Connection state validation
- Table name and ID validation
- Record existence checking
- Parameterized queries

**close():**
- Connection state validation
- Proper cleanup
- State reset

## Key Error Handling Principles Applied

1. **Input Validation**: All functions validate inputs before processing
2. **Clear Error Messages**: Error messages include context (file paths, URLs, table names, etc.)
3. **Error Codes**: Specific handling for common error codes (ENOENT, EACCES, etc.)
4. **Graceful Degradation**: Functions handle errors without crashing
5. **Error Propagation**: Errors include original error messages for debugging
6. **State Validation**: Operations check state (e.g., database connection) before proceeding
7. **Safety Features**: SQL injection prevention, confirmation for deletes
8. **Retry Logic**: Smart retry with exponential backoff for network requests
9. **Type Checking**: Validates argument types and values
10. **Default Values**: Optional default values where appropriate

## Usage Examples

### File Operations
```javascript
const { readConfig, writeData } = require('./file-operations');

try {
    const config = readConfig('/path/to/config.json');
    console.log('Config loaded:', config);
} catch (error) {
    console.error('Failed to load config:', error.message);
}
```

### API Client
```javascript
const { fetchWithRetry } = require('./api-client');

try {
    const data = await fetchWithRetry('https://api.example.com/data', 3, 1000);
    console.log('Data fetched:', data);
} catch (error) {
    console.error('All retry attempts failed:', error.message);
}
```

### Data Processor
```javascript
const { processUserData } = require('./data-processor');

try {
    const userData = processUserData({
        name: '  John Doe  ',
        email: 'JOHN@EXAMPLE.COM',
        age: '25'
    });
    console.log('Processed:', userData);
} catch (error) {
    console.error('Invalid user data:', error.message);
}
```

### Database
```javascript
const Database = require('./database');

const db = new Database('mysql://localhost:3306/mydb');

try {
    db.connect();
    db.insert('users', { name: 'Alice', email: 'alice@example.com' });
    db.delete('users', 123, { confirm: true }); // Requires explicit confirmation
    db.close();
} catch (error) {
    console.error('Database operation failed:', error.message);
}
```

## Best Practices Demonstrated

- Always validate inputs at function boundaries
- Provide context in error messages
- Handle specific error cases explicitly
- Use try-catch blocks for operations that can throw
- Validate state before operations (e.g., connection status)
- Use parameterized queries to prevent SQL injection
- Implement retry logic with exponential backoff for network operations
- Require confirmation for destructive operations
- Return detailed error information for debugging
- Clean up resources properly (connection cleanup, etc.)
