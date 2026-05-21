const express = require('express');
const router = express.Router();
const InventoryController = require('../controllers/inventory.controller');
const { authenticateToken } = require('../middleware/authMiddleware');

// Anyone authenticated can check stock
router.get('/:productId', authenticateToken, InventoryController.getStock);
// Admin-only
router.post('/sync', authenticateToken, InventoryController.syncInventory);

module.exports = router;
