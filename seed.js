require('dotenv').config();
const bcrypt = require('bcrypt');

const db = require('./src/config/postgres'); 

async function runSeeder() {
    try {
        console.log('🌱 Memulai proses seeding database...');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);
        
        const sellerEmail = 'admin_toko@example.com';
        let sellerId;

        const checkUser = await db.query('SELECT id FROM users WHERE email = $1', [sellerEmail]);
        
        if (checkUser.rows.length > 0) {
            sellerId = checkUser.rows[0].id;
            console.log('ℹ️ User penjual sudah ada, menggunakan ID yang sudah ada.');
        } else {
            const newUser = await db.query(
                `INSERT INTO users (username, email, password) 
                 VALUES ($1, $2, $3) RETURNING id`,
                ['Admin Toko', sellerEmail, hashedPassword]
            );
            sellerId = newUser.rows[0].id;
            console.log('✅ User penjual berhasil dibuat.');
        }

        const dummyProducts = [
            { name: 'Nvidia GeForce RTX 3050 8GB', price: 4500000, stock: 15 },
            { name: 'ATmega328P Microcontroller IC', price: 45000, stock: 150 },
            { name: 'Cisco Catalyst 2960-X 24 GigE', price: 6200000, stock: 5 },
            { name: 'Thermal Paste Arctic MX-4 4g', price: 85000, stock: 80 },
            { name: 'FloorIsLava Official Hoodie', price: 350000, stock: 25 },
            { name: 'Anime Streaming Premium Pass (1 Month)', price: 49000, stock: 1000 },
            { name: 'RJ45 Crimping Tool Pro', price: 125000, stock: 40 },
            { name: 'LibGDX Platformer Asset Pack', price: 150000, stock: 99 }
        ];

        let insertedCount = 0;
        for (const item of dummyProducts) {
            const checkProduct = await db.query('SELECT id FROM products WHERE name = $1', [item.name]);
            
            if (checkProduct.rows.length === 0) {
                await db.query(
                    `INSERT INTO products (seller_id, name, price, stock) 
                     VALUES ($1, $2, $3, $4)`,
                    [sellerId, item.name, item.price, item.stock]
                );
                insertedCount++;
            }
        }

        console.log(`✅ Seeding Selesai! Berhasil memasukkan ${insertedCount} produk baru.`);

    } catch (error) {
        console.error('❌ Terjadi kesalahan saat seeding:', error);
    } finally {
        process.exit(0); 
    }
}

runSeeder();