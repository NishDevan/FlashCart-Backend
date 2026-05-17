const CartModel = require('../models/cart.model');
const { AppError } = require('../middleware/errorHandler');
const { redis } = require('../config/redis');

class CartService {
    static async addToCartSQL(userId, productId, qty = 1) {
        if (!productId) {
            throw new AppError('Product ID is required', 400);
        }

        if (qty <= 0) {
            throw new AppError('Quantity must be greater than 0', 400);
        }

        const addedItem = await CartModel.addToCart(userId, productId, qty);
        return addedItem;
    }

    static async getCartSQL(userId) {
        const cartItems = await CartModel.getCart(userId);
        return cartItems;
    }

    static async addToCartRedis(userId, productId, qty = 1) {
        if (!productId) {
            throw new AppError('Product ID is required', 400);
        }

        if (qty <= 0) {
            throw new AppError('Quantity must be greater than 0', 400);
        }

        const cartKey = `cart:${userId}`;

        const updatedQty = await redis.hincrby(cartKey, productId, qty);

        return {
            product_id: productId,
            quantity: updatedQty
        };
    }

    static async getCartRedis(userId) {
        const cartKey = `cart:${userId}`;
        
        const cartData = await redis.hgetall(cartKey);

        const formattedCart = Object.keys(cartData).map(key => ({
            product_id: key,
            quantity: parseInt(cartData[key], 10)
        }));

        return formattedCart;
    }

    static async clearCartRedis(userId) {
        const cartKey = `cart:${userId}`;
        await redis.del(cartKey);
        return { message: 'Cart cleared successfully' };
    }

    static async updateItemSQL(userId, productId, qty) {
        if (!productId || qty === undefined) {
            throw new AppError('Product ID and quantity are required', 400);
        }
        const updatedItem = await CartModel.updateItemQty(userId, productId, qty);
        return updatedItem;
    }

    static async removeItemSQL(userId, productId) {
        if (!productId) {
            throw new AppError('Product ID is required', 400);
        }
        const removedItem = await CartModel.removeItem(userId, productId);
        return removedItem;
    }

    static async updateItemRedis(userId, productId, qty) {
        if (!productId || qty === undefined) {
            throw new AppError('Product ID and quantity are required', 400);
        }
        const cartKey = `cart:${userId}`;
        
        if (qty <= 0) {
            await redis.hdel(cartKey, productId);
            return { product_id: productId, quantity: 0, removed: true };
        } else {
            await redis.hset(cartKey, productId, qty);
            return { product_id: productId, quantity: qty };
        }
    }

    static async removeItemRedis(userId, productId) {
        if (!productId) {
            throw new AppError('Product ID is required', 400);
        }
        const cartKey = `cart:${userId}`;
        await redis.hdel(cartKey, productId);
        return { product_id: productId, removed: true };
    }
}

module.exports = CartService;