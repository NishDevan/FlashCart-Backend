const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/product.controller');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', ProductController.getAllProducts);
router.get('/:id', ProductController.getProductById);

router.post('/', authenticateToken, ProductController.createProduct);
router.put('/:id', authenticateToken, ProductController.updateProduct);
router.delete('/:id', authenticateToken, ProductController.deleteProduct);

module.exports = router;