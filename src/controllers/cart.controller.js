const CartService = require('../services/cart.service');

class CartController {
    static async addToCartSQL(req, res, next) {
        try {
            const userId = req.user.id;
            const { product_id, quantity } = req.body;

            const addedItem = await CartService.addToCartSQL(userId, product_id, quantity);

            res.status(201).json({
                success: true,
                message: 'Item added to SQL cart successfully',
                payload: addedItem,
            });
        } catch (error) {
            next(error);
        }
    }

    static async getCartSQL(req, res, next) {
        try {
            const userId = req.user.id;
            const cartItems = await CartService.getCartSQL(userId);

            res.status(200).json({
                success: true,
                message: 'SQL Cart retrieved successfully',
                payload: cartItems,
            });
        } catch (error) {
            next(error);
        }
    }

    static async addToCartRedis(req, res, next) {
        try {
            const userId = req.user.id;
            const { product_id, quantity } = req.body;

            const addedItem = await CartService.addToCartRedis(userId, product_id, quantity);

            res.status(201).json({
                success: true,
                message: 'Item added to Redis cart successfully',
                payload: addedItem,
            });
        } catch (error) {
            next(error);
        }
    }

    static async getCartRedis(req, res, next) {
        try {
            const userId = req.user.id;
            const cartItems = await CartService.getCartRedis(userId);

            res.status(200).json({
                success: true,
                message: 'Redis Cart retrieved successfully',
                payload: cartItems,
            });
        } catch (error) {
            next(error);
        }
    }

    static async updateCartSQL(req, res, next) {
        try {
            const userId = req.user.id;
            const { productId } = req.params;
            const { quantity } = req.body;

            const updatedItem = await CartService.updateItemSQL(userId, productId, quantity);
            res.status(200).json({
                success: true,
                message: 'SQL Cart item updated successfully',
                payload: updatedItem,
            });
        } catch (error) { next(error); }
    }

    static async removeItemSQL(req, res, next) {
        try {
            const userId = req.user.id;
            const { productId } = req.params;

            await CartService.removeItemSQL(userId, productId);
            res.status(200).json({
                success: true,
                message: 'SQL Cart item removed successfully',
                payload: null,
            });
        } catch (error) { next(error); }
    }

    static async updateCartRedis(req, res, next) {
        try {
            const userId = req.user.id;
            const { productId } = req.params;
            const { quantity } = req.body;

            const updatedItem = await CartService.updateItemRedis(userId, productId, quantity);
            res.status(200).json({
                success: true,
                message: 'Redis Cart item updated successfully',
                payload: updatedItem,
            });
        } catch (error) { next(error); }
    }

    static async removeItemRedis(req, res, next) {
        try {
            const userId = req.user.id;
            const { productId } = req.params;

            await CartService.removeItemRedis(userId, productId);
            res.status(200).json({
                success: true,
                message: 'Redis Cart item removed successfully',
                payload: null,
            });
        } catch (error) { next(error); }
    }

    /**
     * POST /carts/redis/checkout
     * Flush the Redis cart into Postgres and clear the Redis key.
     */
    static async checkoutRedis(req, res, next) {
        try {
            const userId = req.user.id;
            const result = await CartService.checkoutRedis(userId);

            res.status(200).json({
                success: true,
                message: result.message,
                payload: {
                    items_saved: result.items_saved,
                    items: result.items,
                },
            });
        } catch (error) { next(error); }
    }
}

module.exports = CartController;