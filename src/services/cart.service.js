const CartModel = require('../models/cart.model');
const { AppError } = require('../middleware/errorHandler');
const { redis } = require('../config/redis');
const InventoryService = require('./inventory.service');

const CART_TTL = 60 * 60 * 24; // 24-hour TTL

class CartService {
    // SQL Ops
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

    // Redis ops
    static async addToCartRedis(userId, productId, qty = 1) {
        if (!productId) throw new AppError('Product ID is required', 400);
        if (qty <= 0) throw new AppError('Quantity must be greater than 0', 400);
        const newStock = await InventoryService.decrementStock(productId, qty);
        const cartKey = `cart:${userId}`;
        const updatedQty = await redis.hincrby(cartKey, productId, qty);
        await redis.expire(cartKey, CART_TTL);

        return {
            product_id: productId,
            quantity: updatedQty,
            remaining_stock: newStock,
        };
    }

    static async getCartRedis(userId) {
        const cartKey = `cart:${userId}`;
        const cartData = await redis.hgetall(cartKey);

        if (!cartData || Object.keys(cartData).length === 0) return [];

        return Object.entries(cartData).map(([productId, qty]) => ({
            product_id: productId,
            quantity: parseInt(qty, 10),
        }));
    }

    static async updateItemRedis(userId, productId, qty) {
        if (!productId || qty === undefined)
            throw new AppError('Product ID and quantity are required', 400);

        const cartKey = `cart:${userId}`;

        if (qty <= 0) {
            const currentQty = parseInt(await redis.hget(cartKey, productId), 10) || 0;
            if (currentQty > 0) {
                await InventoryService.incrementStock(productId, currentQty);
            }
            await redis.hdel(cartKey, productId);
            await redis.expire(cartKey, CART_TTL);
            return { product_id: productId, quantity: 0, removed: true };
        }

        const currentQty = parseInt(await redis.hget(cartKey, productId), 10) || 0;
        const delta = qty - currentQty;

        if (delta > 0) {
            await InventoryService.decrementStock(productId, delta);
        } else if (delta < 0) {
            await InventoryService.incrementStock(productId, Math.abs(delta));
        }

        await redis.hset(cartKey, productId, qty);
        await redis.expire(cartKey, CART_TTL);
        return { product_id: productId, quantity: qty };
    }

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

    static async checkoutRedis(userId) {
        const cartKey = `cart:${userId}`;
        const cartData = await redis.hgetall(cartKey);

        if (!cartData || Object.keys(cartData).length === 0) {
            throw new AppError('Your Redis cart is empty', 400);
        }
        const savedItems = [];
        for (const [productId, qty] of Object.entries(cartData)) {
            const item = await CartModel.addToCart(userId, productId, parseInt(qty, 10));
            savedItems.push(item);
        }

        await redis.del(cartKey);

        return {
            message: 'Checkout successful. Cart flushed from Redis to database.',
            items_saved: savedItems.length,
            items: savedItems,
        };
    }

    /**
     * Retrieve ALL active Redis carts across every user.
     * Uses SCAN (non-blocking) to find every `cart:*` key, then
     * pipelines HGETALL for each one so we hit Redis in one round-trip.
     */
    static async getAllCartsRedis() {
        // SCAN iterates the keyspace without blocking Redis (unlike KEYS)
        let cursor = '0';
        const cartKeys = [];

        do {
            const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', 'cart:*', 'COUNT', 100);
            cursor = nextCursor;
            cartKeys.push(...keys);
        } while (cursor !== '0');

        if (cartKeys.length === 0) {
            return { total_carts: 0, carts: [] };
        }

        // Pipeline all HGETALL calls into a single Redis round-trip
        const pipeline = redis.pipeline();
        for (const key of cartKeys) {
            pipeline.hgetall(key);
        }
        const results = await pipeline.exec();

        const carts = [];
        for (let i = 0; i < cartKeys.length; i++) {
            const [err, cartData] = results[i];
            if (err || !cartData || Object.keys(cartData).length === 0) continue;

            // Key format is  cart:{userId}  — extract the userId
            const userId = cartKeys[i].replace('cart:', '');

            carts.push({
                user_id: userId,
                item_count: Object.keys(cartData).length,
                items: Object.entries(cartData).map(([productId, qty]) => ({
                    product_id: productId,
                    quantity: parseInt(qty, 10),
                })),
            });
        }

        return { total_carts: carts.length, carts };
    }
}

module.exports = CartService;
