const express = require('express');
const router = express.Router();
const CartController = require('../controllers/cart.controller');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.post('/sql', CartController.addToCartSQL);
router.get('/sql', CartController.getCartSQL);
router.put('/sql/:productId', CartController.updateCartSQL);
router.delete('/sql/:productId', CartController.removeItemSQL);

// Checkout must come before /:productId routes to avoid Express treating
// "checkout" as a :productId parameter.
router.post('/redis/checkout', CartController.checkoutRedis);

// All-carts view must also come before /:productId routes
router.get('/redis/all', CartController.getAllCartsRedis);

router.post('/redis', CartController.addToCartRedis);
router.get('/redis', CartController.getCartRedis);
router.put('/redis/:productId', CartController.updateCartRedis);
router.delete('/redis/:productId', CartController.removeItemRedis);


module.exports = router;