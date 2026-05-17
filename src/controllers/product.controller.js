const ProductService = require('../services/product.service');

class ProductController {
    static async createProduct(req, res, next) {
        try {
            const sellerId = req.user.id;
            const productData = req.body;

            const product = await ProductService.createProduct(sellerId, productData);

            res.status(201).json({
                success: true,
                message: 'Product created successfully',
                payload: product,
            });
        } catch (error) {
            next(error);
        }
    }

    static async getAllProducts(req, res, next) {
        try {
            const products = await ProductService.getAllProducts();

            res.status(200).json({
                success: true,
                message: 'Products retrieved successfully',
                payload: products,
            });
        } catch (error) {
            next(error);
        }
    }

    static async getProductById(req, res, next) {
        try {
            const { id } = req.params;
            const product = await ProductService.getProductById(id);

            res.status(200).json({
                success: true,
                message: 'Product retrieved successfully',
                payload: product,
            });
        } catch (error) {
            next(error);
        }
    }

    static async updateProduct(req, res, next) {
        try {
            const { id } = req.params;
            const sellerId = req.user.id;
            const updateData = req.body;

            const updatedProduct = await ProductService.updateProduct(id, sellerId, updateData);

            res.status(200).json({
                success: true,
                message: 'Product updated successfully',
                payload: updatedProduct,
            });
        } catch (error) {
            next(error);
        }
    }

    static async deleteProduct(req, res, next) {
        try {
            const { id } = req.params;
            const sellerId = req.user.id;

            const deletedProduct = await ProductService.deleteProduct(id, sellerId);

            res.status(200).json({
                success: true,
                message: 'Product deleted successfully',
                payload: deletedProduct,
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = ProductController;