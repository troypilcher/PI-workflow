/**
 * Processes user data
 * IMPROVED: Added comprehensive validation and error handling
 */
function processUserData(userData) {
    if (!userData || typeof userData !== 'object') {
        throw new Error('Invalid userData: must be a non-null object');
    }

    // Validate and process age
    if (userData.age === undefined || userData.age === null) {
        throw new Error('Invalid userData: age is required');
    }

    const age = parseInt(userData.age, 10);
    if (isNaN(age)) {
        throw new Error(`Invalid age value: '${userData.age}' cannot be converted to a number`);
    }

    if (age < 0 || age > 150) {
        throw new Error(`Invalid age value: ${age} is out of valid range (0-150)`);
    }

    // Validate and process email
    if (!userData.email || typeof userData.email !== 'string') {
        throw new Error('Invalid userData: email must be a non-empty string');
    }

    const email = userData.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error(`Invalid email format: '${userData.email}'`);
    }

    // Validate and process name
    if (!userData.name || typeof userData.name !== 'string') {
        throw new Error('Invalid userData: name must be a non-empty string');
    }

    const name = userData.name.trim();
    if (name.length === 0) {
        throw new Error('Invalid userData: name cannot be empty or whitespace only');
    }

    if (name.length > 200) {
        throw new Error(`Invalid userData: name is too long (${name.length} chars, max 200)`);
    }

    return {
        age: age,
        email: email,
        name: name,
        isAdult: age >= 18
    };
}

/**
 * Calculates average from array
 * IMPROVED: Added validation for array and numeric values
 */
function calculateAverage(numbers) {
    if (!Array.isArray(numbers)) {
        throw new Error('Invalid input: numbers must be an array');
    }

    if (numbers.length === 0) {
        throw new Error('Cannot calculate average of empty array');
    }

    // Validate all elements are numbers
    for (let i = 0; i < numbers.length; i++) {
        if (typeof numbers[i] !== 'number' || isNaN(numbers[i])) {
            throw new Error(
                `Invalid array element at index ${i}: '${numbers[i]}' is not a valid number`
            );
        }

        if (!isFinite(numbers[i])) {
            throw new Error(
                `Invalid array element at index ${i}: '${numbers[i]}' must be a finite number`
            );
        }
    }

    const sum = numbers.reduce((acc, num) => acc + num, 0);
    return sum / numbers.length;
}

/**
 * Parses CSV string
 * IMPROVED: Added validation and error handling for malformed CSV
 */
function parseCSV(csvString) {
    if (typeof csvString !== 'string') {
        throw new Error('Invalid input: csvString must be a string');
    }

    if (csvString.trim().length === 0) {
        throw new Error('Invalid input: csvString cannot be empty');
    }

    const lines = csvString.split('\n').filter(line => line.trim().length > 0);

    if (lines.length === 0) {
        throw new Error('Invalid CSV: no data lines found');
    }

    if (lines.length === 1) {
        throw new Error('Invalid CSV: only header row found, no data rows');
    }

    const headers = lines[0].split(',').map(h => h.trim());

    if (headers.length === 0) {
        throw new Error('Invalid CSV: no headers found in first line');
    }

    // Check for duplicate headers
    const headerSet = new Set(headers);
    if (headerSet.size !== headers.length) {
        throw new Error('Invalid CSV: duplicate headers found');
    }

    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(',').map(v => v.trim());

        if (values.length !== headers.length) {
            throw new Error(
                `Invalid CSV at line ${i + 1}: expected ${headers.length} columns but found ${values.length}`
            );
        }

        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index];
        });
        data.push(row);
    }

    return data;
}

/**
 * Divides two numbers
 * IMPROVED: Added validation for division by zero and numeric inputs
 */
function divide(a, b) {
    if (typeof a !== 'number' || isNaN(a)) {
        throw new Error(`Invalid dividend: '${a}' is not a valid number`);
    }

    if (typeof b !== 'number' || isNaN(b)) {
        throw new Error(`Invalid divisor: '${b}' is not a valid number`);
    }

    if (!isFinite(a)) {
        throw new Error(`Invalid dividend: '${a}' must be a finite number`);
    }

    if (!isFinite(b)) {
        throw new Error(`Invalid divisor: '${b}' must be a finite number`);
    }

    if (b === 0) {
        throw new Error('Division by zero: divisor cannot be zero');
    }

    return a / b;
}

/**
 * Accesses nested property
 * IMPROVED: Added safe navigation and clear error messages
 */
function getNestedValue(obj, path, defaultValue = undefined) {
    if (obj === null || obj === undefined) {
        throw new Error('Invalid object: cannot access properties of null or undefined');
    }

    if (typeof path !== 'string' || path.trim().length === 0) {
        throw new Error('Invalid path: must be a non-empty string');
    }

    const keys = path.split('.').filter(k => k.length > 0);

    if (keys.length === 0) {
        throw new Error('Invalid path: no valid keys found after splitting');
    }

    let value = obj;
    const traversedPath = [];

    for (const key of keys) {
        traversedPath.push(key);

        if (value === null || value === undefined) {
            if (defaultValue !== undefined) {
                return defaultValue;
            }
            throw new Error(
                `Cannot read property '${key}' of ${value} at path '${traversedPath.join('.')}'`
            );
        }

        if (typeof value !== 'object') {
            if (defaultValue !== undefined) {
                return defaultValue;
            }
            throw new Error(
                `Cannot access property '${key}' on non-object type '${typeof value}' at path '${traversedPath.slice(0, -1).join('.')}'`
            );
        }

        if (!(key in value)) {
            if (defaultValue !== undefined) {
                return defaultValue;
            }
            throw new Error(
                `Property '${key}' does not exist at path '${traversedPath.join('.')}'`
            );
        }

        value = value[key];
    }

    return value;
}

module.exports = {
    processUserData,
    calculateAverage,
    parseCSV,
    divide,
    getNestedValue
};
