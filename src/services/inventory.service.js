const { redis } = require('../config/redis');
const { query } = require('../config/postgres');
const { AppError } = require('../middleware/errorHandler');

const INVENTORY_TTL = 60 * 60 * 24; // 24 hours (refresh on each write)

class InventoryService {
    /**
     * Build the canonical Redis key for a product's stock counter.
     */
    static inventoryKey(productId) {
        return `inventory:${productId}`;
    }

    /**
     * Sync ALL product stocks from Postgres into Redis.
     * Called once on server startup and via the admin endpoint.
     * Uses a pipeline for efficiency.
     */
    static async syncFromPostgres() {
        const { rows } = await query('SELECT id, stock FROM products');

        if (rows.length === 0) {
            console.log('[Inventory] No products found – nothing to sync.');
            return { synced: 0 };
        }

        const pipeline = redis.pipeline();
        for (const product of rows) {
            const key = InventoryService.inventoryKey(product.id);
            pipeline.set(key, product.stock, 'EX', INVENTORY_TTL);
        }
        await pipeline.exec();

        console.log(`[Inventory] Synced ${rows.length} products to Redis.`);
        return { synced: rows.length };
    }

    /**
     * Get current Redis stock for a product.
     * Falls back to Postgres if the key is missing (cold-cache).
     */
    static async getStock(productId) {
        const key = InventoryService.inventoryKey(productId);
        let stock = await redis.get(key);

        if (stock === null) {
            // Cold cache – load from Postgres
            const { rows } = await query('SELECT stock FROM products WHERE id = $1', [productId]);
            if (rows.length === 0) throw new AppError('Product not found', 404);

            stock = rows[0].stock;
            await redis.set(key, stock, 'EX', INVENTORY_TTL);
        }

        return parseInt(stock, 10);
    }

    /**
     * Atomically decrement the Redis counter by `qty`.
     * Returns the new stock value.
     * Throws 400 if stock would go below 0 (oversell guard).
     */
    static async decrementStock(productId, qty = 1) {
        const key = InventoryService.inventoryKey(productId);

        // Ensure the key exists before decrementing
        const currentStock = await InventoryService.getStock(productId);

        if (currentStock < qty) {
            throw new AppError(
                `Insufficient stock. Available: ${currentStock}, Requested: ${qty}`,
                400
            );
        }

        // Atomic decrement – safe under concurrent load
        const newStock = await redis.decrby(key, qty);

        // Edge case: two requests passed the check simultaneously
        if (newStock < 0) {
            await redis.incrby(key, qty); // roll back
            throw new AppError('Stock just ran out. Please try again.', 409);
        }

        // Refresh TTL on every write
        await redis.expire(key, INVENTORY_TTL);

        return newStock;
    }

    /**
     * Atomically increment the Redis counter by `qty`.
     * Used when a cart item is removed or a checkout is cancelled.
     */
    static async incrementStock(productId, qty = 1) {
        const key = InventoryService.inventoryKey(productId);
        const newStock = await redis.incrby(key, qty);
        await redis.expire(key, INVENTORY_TTL);
        return newStock;
    }

    /**
     * Hard-set the Redis counter (e.g. after a product stock update in Postgres).
     */
    static async setStock(productId, stock) {
        const key = InventoryService.inventoryKey(productId);
        await redis.set(key, stock, 'EX', INVENTORY_TTL);
        return stock;
    }
}

module.exports = InventoryService;
