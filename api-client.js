const https = require('https');

/**
 * Fetches data from an API endpoint
 * IMPROVED: Added comprehensive error handling for network, timeout, and response errors
 */
function fetchData(url, timeout = 30000) {
    return new Promise((resolve, reject) => {
        if (!url || typeof url !== 'string') {
            return reject(new Error('Invalid URL: url must be a non-empty string'));
        }

        const request = https.get(url, (res) => {
            const { statusCode } = res;
            const contentType = res.headers['content-type'];

            // Handle non-success status codes
            if (statusCode < 200 || statusCode >= 300) {
                let errorData = '';
                res.on('data', (chunk) => {
                    errorData += chunk;
                });
                res.on('end', () => {
                    reject(new Error(
                        `HTTP ${statusCode} error fetching ${url}: ${errorData.substring(0, 200)}`
                    ));
                });
                return;
            }

            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (!data) {
                    return reject(new Error(`Empty response received from ${url}`));
                }

                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed);
                } catch (parseError) {
                    reject(new Error(
                        `Failed to parse JSON response from ${url}: ${parseError.message}`
                    ));
                }
            });

            res.on('error', (error) => {
                reject(new Error(`Response stream error from ${url}: ${error.message}`));
            });
        });

        // Set timeout
        request.setTimeout(timeout, () => {
            request.destroy();
            reject(new Error(`Request timeout after ${timeout}ms for URL: ${url}`));
        });

        // Handle request errors
        request.on('error', (error) => {
            if (error.code === 'ENOTFOUND') {
                reject(new Error(`Host not found: ${url}`));
            } else if (error.code === 'ECONNREFUSED') {
                reject(new Error(`Connection refused: ${url}`));
            } else if (error.code === 'ETIMEDOUT') {
                reject(new Error(`Connection timeout: ${url}`));
            } else {
                reject(new Error(`Network error fetching ${url}: ${error.message}`));
            }
        });
    });
}

/**
 * Posts data to an API
 * IMPROVED: Added comprehensive error handling for POST requests
 */
function postData(url, payload, timeout = 30000) {
    return new Promise((resolve, reject) => {
        if (!url || typeof url !== 'string') {
            return reject(new Error('Invalid URL: url must be a non-empty string'));
        }

        if (payload === undefined || payload === null) {
            return reject(new Error('Invalid payload: payload cannot be null or undefined'));
        }

        let data;
        try {
            data = JSON.stringify(payload);
        } catch (error) {
            return reject(new Error(`Failed to serialize payload to JSON: ${error.message}`));
        }

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = https.request(url, options, (res) => {
            const { statusCode } = res;
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                // Handle non-success status codes
                if (statusCode < 200 || statusCode >= 300) {
                    return reject(new Error(
                        `HTTP ${statusCode} error posting to ${url}: ${responseData.substring(0, 200)}`
                    ));
                }

                if (!responseData) {
                    return resolve(null); // Empty response is acceptable for some POST requests
                }

                try {
                    const parsed = JSON.parse(responseData);
                    resolve(parsed);
                } catch (parseError) {
                    reject(new Error(
                        `Failed to parse JSON response from ${url}: ${parseError.message}. Response: ${responseData.substring(0, 100)}`
                    ));
                }
            });

            res.on('error', (error) => {
                reject(new Error(`Response stream error from ${url}: ${error.message}`));
            });
        });

        // Set timeout
        req.setTimeout(timeout, () => {
            req.destroy();
            reject(new Error(`Request timeout after ${timeout}ms for URL: ${url}`));
        });

        // Handle request errors
        req.on('error', (error) => {
            if (error.code === 'ENOTFOUND') {
                reject(new Error(`Host not found: ${url}`));
            } else if (error.code === 'ECONNREFUSED') {
                reject(new Error(`Connection refused: ${url}`));
            } else if (error.code === 'ETIMEDOUT') {
                reject(new Error(`Connection timeout: ${url}`));
            } else {
                reject(new Error(`Network error posting to ${url}: ${error.message}`));
            }
        });

        // Write data and end request
        try {
            req.write(data);
            req.end();
        } catch (error) {
            reject(new Error(`Failed to send request to ${url}: ${error.message}`));
        }
    });
}

/**
 * Fetches data with retry logic
 * IMPROVED: Added proper error handling, retry delays, and error accumulation
 */
async function fetchWithRetry(url, maxRetries = 3, retryDelay = 1000) {
    if (!url || typeof url !== 'string') {
        throw new Error('Invalid URL: url must be a non-empty string');
    }

    if (!Number.isInteger(maxRetries) || maxRetries < 1) {
        throw new Error('Invalid maxRetries: must be a positive integer');
    }

    if (!Number.isInteger(retryDelay) || retryDelay < 0) {
        throw new Error('Invalid retryDelay: must be a non-negative integer');
    }

    const errors = [];

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const data = await fetchData(url);
            return data;
        } catch (error) {
            errors.push(`Attempt ${attempt}/${maxRetries}: ${error.message}`);

            // Don't retry on client errors (4xx status codes)
            if (error.message.includes('HTTP 4')) {
                throw new Error(
                    `Request failed with client error (non-retryable): ${error.message}`
                );
            }

            // If this was the last attempt, throw with all error details
            if (attempt === maxRetries) {
                const errorSummary = errors.join('\n  ');
                throw new Error(
                    `Failed to fetch data from ${url} after ${maxRetries} attempts:\n  ${errorSummary}`
                );
            }

            // Wait before retrying (exponential backoff)
            const delay = retryDelay * Math.pow(2, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    // This should never be reached, but just in case
    throw new Error(`Failed to fetch data from ${url} after ${maxRetries} attempts`);
}

module.exports = {
    fetchData,
    postData,
    fetchWithRetry
};
