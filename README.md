# Error Handling Improvement Project

This project demonstrates best practices for implementing robust error handling in JavaScript applications. All functions have been improved with comprehensive error handling, input validation, and clear error messages.

## Files

- `file-operations.js` - File system operations with comprehensive error handling
- `api-client.js` - Network requests with timeout and error handling
- `data-processor.js` - Data processing functions with validation
- `database.js` - Database operations with connection state management

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
