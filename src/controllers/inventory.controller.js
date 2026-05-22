const InventoryService = require('../services/inventory.service');

class InventoryController {
    static async getStock(req, res, next) {
        try {
            const { productId } = req.params;
            const stock = await InventoryService.getStock(productId);

            res.status(200).json({
                success: true,
                message: 'Stock retrieved successfully',
                payload: {
                    product_id: productId,
                    redis_stock: stock,
                    source: 'inventory:' + productId,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    static async syncInventory(req, res, next) {
        try {
            const result = await InventoryService.syncFromPostgres();

            res.status(200).json({
                success: true,
                message: `Inventory synced successfully`,
                payload: result,
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = InventoryController;
