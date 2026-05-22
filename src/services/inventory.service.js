const { redis } = require('../config/redis');
const { query } = require('../config/postgres');
const { AppError } = require('../middleware/errorHandler');

const INVENTORY_TTL = 60 * 60 * 24; // 24 hours

class InventoryService {
    static inventoryKey(productId) {
        return `inventory:${productId}`;
    }

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

    static async getStock(productId) {
        const key = InventoryService.inventoryKey(productId);
        let stock = await redis.get(key);

        if (stock === null) {
            // Cold cache
            const { rows } = await query('SELECT stock FROM products WHERE id = $1', [productId]);
            
            if (rows.length === 0) throw new AppError('Product not found', 404);
            stock = rows[0].stock;
            await redis.set(key, stock, 'EX', INVENTORY_TTL);
        }

        return parseInt(stock, 10);
    }

    static async decrementStock(productId, qty = 1) {
        const key = InventoryService.inventoryKey(productId);
        const currentStock = await InventoryService.getStock(productId);

        if (currentStock < qty) {
            throw new AppError(
                `Insufficient stock. Available: ${currentStock}, Requested: ${qty}`,
                400
            );
        }
        const newStock = await redis.decrby(key, qty);

        if (newStock < 0) {
            await redis.incrby(key, qty); // roll back
            throw new AppError('Stock just ran out. Please try again.', 409);
        }

        // Refresh TTL on write
        await redis.expire(key, INVENTORY_TTL);

        return newStock;
    }
    
    static async incrementStock(productId, qty = 1) {
        const key = InventoryService.inventoryKey(productId);
        const newStock = await redis.incrby(key, qty);
        await redis.expire(key, INVENTORY_TTL);
        return newStock;
    }

    static async setStock(productId, stock) {
        const key = InventoryService.inventoryKey(productId);
        await redis.set(key, stock, 'EX', INVENTORY_TTL);
        return stock;
    }
}

module.exports = InventoryService;
