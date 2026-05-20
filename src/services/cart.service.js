const CartModel = require('../models/cart.model');
const { AppError } = require('../middleware/errorHandler');
const { redis } = require('../config/redis');
const InventoryService = require('./inventory.service');

const CART_TTL = 60 * 60 * 24; // 24-hour TTL – refreshed on every write

class CartService {
    // ─────────────────────────────────────────────────────────────────────────
    // SQL (PostgreSQL) cart operations
    // ─────────────────────────────────────────────────────────────────────────

    static async addToCartSQL(userId, productId, qty = 1) {
        if (!productId) throw new AppError('Product ID is required', 400);
        if (qty <= 0) throw new AppError('Quantity must be greater than 0', 400);

        const addedItem = await CartModel.addToCart(userId, productId, qty);
        return addedItem;
    }

    static async getCartSQL(userId) {
        return CartModel.getCart(userId);
    }

    static async updateItemSQL(userId, productId, qty) {
        if (!productId || qty === undefined)
            throw new AppError('Product ID and quantity are required', 400);
        return CartModel.updateItemQty(userId, productId, qty);
    }

    static async removeItemSQL(userId, productId) {
        if (!productId) throw new AppError('Product ID is required', 400);
        return CartModel.removeItem(userId, productId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Redis cart operations  (key: cart:{userId})
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Add a product to the Redis cart.
     *  1. Atomically decrement inventory:{productId} to guard against overselling.
     *  2. Increment the hash field for this product.
     *  3. Refresh the 24-hour TTL on the cart key.
     */
    static async addToCartRedis(userId, productId, qty = 1) {
        if (!productId) throw new AppError('Product ID is required', 400);
        if (qty <= 0) throw new AppError('Quantity must be greater than 0', 400);

        // ── Step 1: decrement inventory counter (throws if insufficient) ──────
        const newStock = await InventoryService.decrementStock(productId, qty);

        // ── Step 2: add to cart hash ──────────────────────────────────────────
        const cartKey = `cart:${userId}`;
        const updatedQty = await redis.hincrby(cartKey, productId, qty);

        // ── Step 3: refresh cart TTL on every write ───────────────────────────
        await redis.expire(cartKey, CART_TTL);

        return {
            product_id: productId,
            quantity: updatedQty,
            remaining_stock: newStock,
        };
    }

    /**
     * Read the Redis cart hash for a user.
     */
    static async getCartRedis(userId) {
        const cartKey = `cart:${userId}`;
        const cartData = await redis.hgetall(cartKey);

        if (!cartData || Object.keys(cartData).length === 0) return [];

        return Object.entries(cartData).map(([productId, qty]) => ({
            product_id: productId,
            quantity: parseInt(qty, 10),
        }));
    }

    /**
     * Update quantity of a specific item in the Redis cart.
     * If decreasing, the difference is returned to the inventory counter.
     * If increasing, the difference is decremented from inventory.
     */
    static async updateItemRedis(userId, productId, qty) {
        if (!productId || qty === undefined)
            throw new AppError('Product ID and quantity are required', 400);

        const cartKey = `cart:${userId}`;

        if (qty <= 0) {
            // Treat as removal – restore inventory
            const currentQty = parseInt(await redis.hget(cartKey, productId), 10) || 0;
            if (currentQty > 0) {
                await InventoryService.incrementStock(productId, currentQty);
            }
            await redis.hdel(cartKey, productId);
            await redis.expire(cartKey, CART_TTL);
            return { product_id: productId, quantity: 0, removed: true };
        }

        // Compute inventory delta
        const currentQty = parseInt(await redis.hget(cartKey, productId), 10) || 0;
        const delta = qty - currentQty;

        if (delta > 0) {
            // Requesting more units – check inventory
            await InventoryService.decrementStock(productId, delta);
        } else if (delta < 0) {
            // Returning units – restore inventory
            await InventoryService.incrementStock(productId, Math.abs(delta));
        }

        await redis.hset(cartKey, productId, qty);
        await redis.expire(cartKey, CART_TTL);
        return { product_id: productId, quantity: qty };
    }

    /**
     * Remove a single item from the Redis cart and restore its inventory.
     */
    static async removeItemRedis(userId, productId) {
        if (!productId) throw new AppError('Product ID is required', 400);

        const cartKey = `cart:${userId}`;
        const currentQty = parseInt(await redis.hget(cartKey, productId), 10) || 0;

        if (currentQty > 0) {
            await InventoryService.incrementStock(productId, currentQty);
        }

        await redis.hdel(cartKey, productId);
        await redis.expire(cartKey, CART_TTL);
        return { product_id: productId, removed: true };
    }

    /**
     * Clear the entire Redis cart and restore all inventory counters.
     */
    static async clearCartRedis(userId) {
        const cartKey = `cart:${userId}`;
        const cartData = await redis.hgetall(cartKey);

        if (cartData && Object.keys(cartData).length > 0) {
            for (const [productId, qty] of Object.entries(cartData)) {
                await InventoryService.incrementStock(productId, parseInt(qty, 10));
            }
        }

        await redis.del(cartKey);
        return { message: 'Cart cleared and inventory restored' };
    }

    /**
     * Checkout: flush the Redis cart into Postgres (carts + cart_items tables)
     * then delete the Redis cart key.
     * Inventory was already decremented at add-time, so no stock change here.
     */
    static async checkoutRedis(userId) {
        const cartKey = `cart:${userId}`;
        const cartData = await redis.hgetall(cartKey);

        if (!cartData || Object.keys(cartData).length === 0) {
            throw new AppError('Your Redis cart is empty', 400);
        }

        // Persist each item to Postgres via CartModel
        const savedItems = [];
        for (const [productId, qty] of Object.entries(cartData)) {
            const item = await CartModel.addToCart(userId, productId, parseInt(qty, 10));
            savedItems.push(item);
        }

        // Clear the Redis cart (do NOT restore inventory – items are checked out)
        await redis.del(cartKey);

        return {
            message: 'Checkout successful. Cart flushed from Redis to database.',
            items_saved: savedItems.length,
            items: savedItems,
        };
    }
}

module.exports = CartService;