const db = require('../config/postgres');

class User {
    static async createUser(username, email, password) {
        const query = 'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email, role, created_at';
        const values = [username, email, password];
        const result = await db.query(query, values);
        return result.rows[0];
    }

    static async findByEmail(email) {
        const query = 'SELECT id, username, email, password, role, created_at FROM users WHERE email = $1';
        const values = [email];
        const result = await db.query(query, values);
        return result.rows[0];
    }

    static async findById(id) {
        const query = 'SELECT id, username, email, created_at FROM users WHERE id = $1';
        const values = [id];
        const result = await db.query(query, values);
        return result.rows[0];
    }

    static async update(id, { username, email, password }) {
        const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        const user = result.rows[0];
        const updatedUsername = username || user.username;
        const updatedEmail = email || user.email;
        const updatedPassword = password || user.password;

        const updateQuery = 'UPDATE users SET username = $1, email = $2, password = $3 WHERE id = $4 RETURNING id, username, email, created_at RETURNING id, username, email, created_at';
        const updateValues = [updatedUsername, updatedEmail, updatedPassword, id];
        const updateResult = await db.query(updateQuery, updateValues);
        return updateResult.rows[0];
    }
}

module.exports = User;