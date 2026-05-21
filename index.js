require('dotenv').config();
const app = require('./src/app');
const db = require('./src/config/postgres');
const InventoryService = require('./src/services/inventory.service');

const PORT = process.env.PORT || 4000;

// Test database connection, then sync inventory to Redis, then start server
db.query('SELECT NOW()')
    .then(async () => {
        console.log('Database connected successfully');

        await InventoryService.syncFromPostgres();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    })
    .catch((err) => {
        console.error('Database connection failed:', err);
        process.exit(1);
    });
