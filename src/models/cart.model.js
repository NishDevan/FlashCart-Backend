const { query, getClient } = require('../config/postgres');

class CartModel {
    static async addToCart(userId, productId, qty = 1) {
        const client = await getClient(); 
        
        try {
            await client.query('BEGIN');

            let cartRes = await client.query(
                `SELECT id FROM carts WHERE user_id = $1 AND status = 'active' LIMIT 1`, 
                [userId]
            );

            let cartId;

            if (cartRes.rows.length === 0) {
                const newCart = await client.query(
                    `INSERT INTO carts (user_id) VALUES ($1) RETURNING id`,
                    [userId]
                );
                cartId = newCart.rows[0].id;
            } else {
                cartId = cartRes.rows[0].id;
            }

            const itemRes = await client.query(
                `INSERT INTO cart_items (cart_id, product_id, quantity) 
                 VALUES ($1, $2, $3)
                 ON CONFLICT (cart_id, product_id) 
                 DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
                 RETURNING *`,
                [cartId, productId, qty]
            );

            await client.query('COMMIT');
            
            return itemRes.rows[0];
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async getCart(userId) {
        const queryText = `
            SELECT 
                c.id as cart_id,
                c.status,
                ci.quantity,
                p.id as product_id,
                p.name,
                p.price
            FROM carts c
            LEFT JOIN cart_items ci ON c.id = ci.cart_id
            LEFT JOIN products p ON ci.product_id = p.id
            WHERE c.user_id = $1 AND c.status = 'active'
        `;
        const { rows } = await query(queryText, [userId]);
        return rows;
    }

    static async updateItemQty(userId, productId, qty) {
        const client = await getClient();
        try {
            await client.query('BEGIN');
            
            const cartRes = await client.query(
                `SELECT id FROM carts WHERE user_id = $1 AND status = 'active'`, 
                [userId]
            );
            
            if (cartRes.rows.length === 0) {
                throw new Error('Active cart not found');
            }
            const cartId = cartRes.rows[0].id;

            let result;
            if (qty <= 0) {
                result = await client.query(
                    `DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2 RETURNING *`,
                    [cartId, productId]
                );
            } else {
                result = await client.query(
                    `UPDATE cart_items SET quantity = $1 WHERE cart_id = $2 AND product_id = $3 RETURNING *`,
                    [qty, cartId, productId]
                );
            }

            await client.query('COMMIT');
            return result.rows[0] || null;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async removeItem(userId, productId) {
        const client = await getClient();
        try {
            await client.query('BEGIN');
            const cartRes = await client.query(
                `SELECT id FROM carts WHERE user_id = $1 AND status = 'active'`, 
                [userId]
            );
            
            if (cartRes.rows.length === 0) return null;
            const cartId = cartRes.rows[0].id;

            const result = await client.query(
                `DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2 RETURNING *`,
                [cartId, productId]
            );
            
            await client.query('COMMIT');
            return result.rows[0] || null;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = CartModel;