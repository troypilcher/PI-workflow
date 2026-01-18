/**
 * Simulated database operations
 * IMPROVED: Added comprehensive error handling and validation
 */

class Database {
    constructor(connectionString) {
        if (!connectionString || typeof connectionString !== 'string') {
            throw new Error('Invalid connection string: must be a non-empty string');
        }

        if (connectionString.trim().length === 0) {
            throw new Error('Invalid connection string: cannot be empty or whitespace only');
        }

        this.connectionString = connectionString;
        this.connected = false;
        this.queryCount = 0;
    }

    /**
     * Connects to database
     * IMPROVED: Added connection state validation and error handling
     */
    connect() {
        if (this.connected) {
            throw new Error('Already connected to database');
        }

        try {
            // Simulated connection with validation
            if (!this.connectionString.includes('://')) {
                throw new Error(
                    `Invalid connection string format: '${this.connectionString}'. Expected format: protocol://host:port/database`
                );
            }

            // Simulate connection
            this.connected = true;
            this.queryCount = 0;
            return this.connected;
        } catch (error) {
            this.connected = false;
            if (error.message.includes('Invalid connection string format')) {
                throw error;
            }
            throw new Error(`Failed to connect to database: ${error.message}`);
        }
    }

    /**
     * Executes a query
     * IMPROVED: Added connection state check and query validation
     */
    query(sql, params = []) {
        if (!this.connected) {
            throw new Error('Cannot execute query: database is not connected. Call connect() first.');
        }

        if (!sql || typeof sql !== 'string') {
            throw new Error('Invalid SQL query: must be a non-empty string');
        }

        const trimmedSql = sql.trim();
        if (trimmedSql.length === 0) {
            throw new Error('Invalid SQL query: cannot be empty or whitespace only');
        }

        // Basic SQL injection prevention check (for demonstration)
        const dangerousPatterns = [/;\s*DROP/i, /;\s*DELETE\s+FROM/i, /;\s*TRUNCATE/i];
        for (const pattern of dangerousPatterns) {
            if (pattern.test(sql)) {
                throw new Error(
                    'Potentially dangerous SQL detected. Use parameterized queries instead.'
                );
            }
        }

        if (!Array.isArray(params)) {
            throw new Error('Invalid query parameters: params must be an array');
        }

        try {
            // Simulated query execution
            this.queryCount++;
            return [];
        } catch (error) {
            throw new Error(`Query execution failed: ${error.message}\nSQL: ${sql.substring(0, 100)}`);
        }
    }

    /**
     * Inserts a record
     * IMPROVED: Added validation and safer query construction
     */
    insert(table, data) {
        if (!this.connected) {
            throw new Error('Cannot insert: database is not connected');
        }

        if (!table || typeof table !== 'string' || table.trim().length === 0) {
            throw new Error('Invalid table name: must be a non-empty string');
        }

        // Validate table name to prevent SQL injection
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
            throw new Error(
                `Invalid table name: '${table}' contains invalid characters. Only alphanumeric and underscores allowed.`
            );
        }

        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            throw new Error('Invalid data: must be a non-null, non-array object');
        }

        const keys = Object.keys(data);
        if (keys.length === 0) {
            throw new Error('Invalid data: cannot insert empty object');
        }

        // Validate field names
        for (const key of keys) {
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
                throw new Error(
                    `Invalid field name: '${key}' contains invalid characters`
                );
            }
        }

        try {
            // Use parameterized query approach (simulated)
            const fields = keys.join(', ');
            const placeholders = keys.map(() => '?').join(', ');
            const sql = `INSERT INTO ${table} (${fields}) VALUES (${placeholders})`;
            const params = Object.values(data);

            return this.query(sql, params);
        } catch (error) {
            if (error.message.includes('duplicate key') || error.message.includes('UNIQUE constraint')) {
                throw new Error(`Insert failed: duplicate key violation in table '${table}'`);
            }
            throw new Error(`Failed to insert into table '${table}': ${error.message}`);
        }
    }

    /**
     * Updates a record
     * IMPROVED: Added validation and safer query construction
     */
    update(table, id, data) {
        if (!this.connected) {
            throw new Error('Cannot update: database is not connected');
        }

        if (!table || typeof table !== 'string' || table.trim().length === 0) {
            throw new Error('Invalid table name: must be a non-empty string');
        }

        // Validate table name
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
            throw new Error(
                `Invalid table name: '${table}' contains invalid characters`
            );
        }

        if (id === undefined || id === null) {
            throw new Error('Invalid id: id cannot be null or undefined');
        }

        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            throw new Error('Invalid data: must be a non-null, non-array object');
        }

        const keys = Object.keys(data);
        if (keys.length === 0) {
            throw new Error('Invalid data: cannot update with empty object');
        }

        // Validate field names
        for (const key of keys) {
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
                throw new Error(
                    `Invalid field name: '${key}' contains invalid characters`
                );
            }
        }

        try {
            // Use parameterized query approach (simulated)
            const sets = keys.map(k => `${k} = ?`).join(', ');
            const sql = `UPDATE ${table} SET ${sets} WHERE id = ?`;
            const params = [...Object.values(data), id];

            const result = this.query(sql, params);

            // Check if any rows were affected (simulated check)
            if (result && result.affectedRows === 0) {
                throw new Error(`No record found with id ${id} in table '${table}'`);
            }

            return result;
        } catch (error) {
            if (error.message.includes('No record found')) {
                throw error;
            }
            throw new Error(`Failed to update record in table '${table}': ${error.message}`);
        }
    }

    /**
     * Deletes a record
     * IMPROVED: Added validation and safer query construction
     */
    delete(table, id, options = { confirm: false }) {
        if (!this.connected) {
            throw new Error('Cannot delete: database is not connected');
        }

        if (!table || typeof table !== 'string' || table.trim().length === 0) {
            throw new Error('Invalid table name: must be a non-empty string');
        }

        // Validate table name
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
            throw new Error(
                `Invalid table name: '${table}' contains invalid characters`
            );
        }

        if (id === undefined || id === null) {
            throw new Error('Invalid id: id cannot be null or undefined');
        }

        // Require explicit confirmation for delete operations
        if (!options.confirm) {
            throw new Error(
                `Delete operation requires explicit confirmation. Pass { confirm: true } to proceed with deleting id ${id} from table '${table}'.`
            );
        }

        try {
            // Use parameterized query approach (simulated)
            const sql = `DELETE FROM ${table} WHERE id = ?`;
            const params = [id];

            const result = this.query(sql, params);

            // Check if any rows were affected (simulated check)
            if (result && result.affectedRows === 0) {
                throw new Error(`No record found with id ${id} in table '${table}'`);
            }

            return result;
        } catch (error) {
            if (error.message.includes('No record found')) {
                throw error;
            }
            throw new Error(`Failed to delete record from table '${table}': ${error.message}`);
        }
    }

    /**
     * Closes database connection
     * IMPROVED: Added connection state check and cleanup
     */
    close() {
        if (!this.connected) {
            throw new Error('Cannot close: database is not connected');
        }

        try {
            // Perform cleanup operations
            this.connected = false;
            this.queryCount = 0;
            return true;
        } catch (error) {
            throw new Error(`Failed to close database connection: ${error.message}`);
        }
    }

    /**
     * Gets the connection status
     */
    isConnected() {
        return this.connected;
    }

    /**
     * Gets query statistics
     */
    getStats() {
        return {
            connected: this.connected,
            queryCount: this.queryCount
        };
    }
}

module.exports = Database;
