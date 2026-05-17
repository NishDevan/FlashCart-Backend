// services/product.service.js
const ProductModel = require('../models/product.model');
const { AppError } = require('../middleware/errorHandler');
const { redis } = require('../config/redis');

class ProductService {
    static async createProduct(sellerId, data) {
        const { name, price, stock } = data;

        if (!name || price === undefined) {
            throw new AppError('Product name and price are required', 400);
        }

        const product = await ProductModel.create({
            seller_id: sellerId,
            name,
            price,
            stock: stock || 0
        });

        await redis.del('products:all');

        return product;
    }

    static async getAllProducts() {
        const cacheKey = 'products:all';

        const cachedProducts = await redis.get(cacheKey);
        if (cachedProducts) {
            return JSON.parse(cachedProducts);
        }

        const products = await ProductModel.findAll();

        await redis.set(cacheKey, JSON.stringify(products), 'EX', 300);

        return products;
    }

    static async getProductById(id) {
        const product = await ProductModel.findById(id);
        if (!product) {
            throw new AppError('Product not found', 404);
        }
        return product;
    }

    static async updateProduct(id, sellerId, updateData) {
        const product = await ProductModel.findById(id);
        if (!product) {
            throw new AppError('Product not found', 404);
        }

        if (product.seller_id !== sellerId) {
            throw new AppError('You are not authorized to update this product', 403);
        }

        const updatedProduct = await ProductModel.update(id, updateData);

        await redis.del('products:all');

        return updatedProduct;
    }

    static async deleteProduct(id, sellerId) {
        const product = await ProductModel.findById(id);
        if (!product) {
            throw new AppError('Product not found', 404);
        }

        if (product.seller_id !== sellerId) {
            throw new AppError('You are not authorized to delete this product', 403);
        }

        const deletedProduct = await ProductModel.delete(id);

        await redis.del('products:all');

        return deletedProduct;
    }
}

module.exports = ProductService;