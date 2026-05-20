const express = require('express');
const router = express.Router();
const InventoryController = require('../controllers/inventory.controller');
const { authenticateToken } = require('../middleware/authMiddleware');

// Anyone authenticated can check stock
router.get('/:productId', authenticateToken, InventoryController.getStock);

// Admin-only: re-sync all inventory from Postgres to Redis
router.post('/sync', authenticateToken, InventoryController.syncInventory);

module.exports = router;
