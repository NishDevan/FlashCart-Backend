const pool = require('../config/postgres'); 

class ProductModel {
    static async create({ seller_id, name, price, stock }) {
        const query = `
            INSERT INTO products (seller_id, name, price, stock)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const values = [seller_id, name, price, stock || 0];
        
        const { rows } = await pool.query(query, values);
        return rows[0];
    }

    static async findById(id) {
        const query = `SELECT * FROM products WHERE id = $1;`;
        const { rows } = await pool.query(query, [id]);
        return rows[0];
    }

    static async findAll() {
        const query = `
            SELECT p.*, u.username as seller_name 
            FROM products p
            JOIN users u ON p.seller_id = u.id
            ORDER BY p.name ASC;
        `;
        const { rows } = await pool.query(query);
        return rows;
    }

    static async findBySellerId(seller_id) {
        const query = `SELECT * FROM products WHERE seller_id = $1 ORDER BY name ASC;`;
        const { rows } = await pool.query(query, [seller_id]);
        return rows;
    }

    static async update(id, { name, price, stock }) {
        const query = `
            UPDATE products
            SET name = COALESCE($1, name),
                price = COALESCE($2, price),
                stock = COALESCE($3, stock)
            WHERE id = $4
            RETURNING *;
        `;
        const values = [name, price, stock, id];
        const { rows } = await pool.query(query, values);
        return rows[0];
    }

    static async delete(id) {
        const query = `DELETE FROM products WHERE id = $1 RETURNING *;`;
        const { rows } = await pool.query(query, [id]);
        return rows[0];
    }
}

module.exports = ProductModel;