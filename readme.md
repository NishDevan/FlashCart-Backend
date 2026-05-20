# FlashCart Backend

> **Kelompok 3** — Mini Project SBD (Sistem Basis Data)
> - Raihan Muhammad Nafis Al-Kautsar (2406413451)
> - Mirza Adi Raffiansyah (2306210323)
> -
> -
> -

FlashCart adalah backend service berkecepatan tinggi untuk manajemen keranjang belanja sementara dan validasi sesi pengguna secara real-time. Didesain untuk platform e-commerce skala menengah hingga besar yang sering mengadakan **flash sale**, di mana sistem harus menangani ribuan permintaan add-to-cart secara bersamaan tanpa membebani database utama (PostgreSQL).

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Runtime | Node.js (Express 5) |
| Primary DB | PostgreSQL (via `pg` + Neon serverless) |
| Cache & KV Store | Redis (via `ioredis` + Redis Cloud) |
| Auth | JWT + HttpOnly Cookie |
| Security | Helmet, CORS, Rate Limiting |

---

## Redis Key-Value Data Model

Sesuai paradigma **Key-Value Store**, proyek ini menggunakan tiga pola kunci Redis:

| Tipe | Key Pattern | Value | TTL |
|---|---|---|---|
| Session | `session:{user_id}` | JWT token string | 24 jam |
| Cart | `cart:{user_id}` | Hash `{product_id: quantity}` | 24 jam (diperbarui setiap write) |
| Inventory | `inventory:{product_id}` | Integer (stok tersedia) | 24 jam |

### Alur Kerja Redis

```
LOGIN  →  SET session:{userId} <token> EX 86400
            ↓
ADD TO CART  →  DECRBY inventory:{productId} qty   (atomic, anti-oversell)
                HINCRBY cart:{userId} {productId} qty
                EXPIRE  cart:{userId} 86400
            ↓
CHECKOUT  →  Flush cart:{userId} ke PostgreSQL
             DEL cart:{userId}
            ↓
LOGOUT  →  DEL session:{userId}   (token invalidated server-side)
```

---

## Project Structure

```
FlashCart-Backend/
├── src/
│   ├── config/
│   │   ├── postgres.js          # PostgreSQL connection pool
│   │   └── redis.js             # ioredis client
│   ├── controllers/
│   │   ├── auth.controller.js   # Login (SET session) & Logout (DEL session)
│   │   ├── cart.controller.js   # SQL & Redis cart + checkout
│   │   ├── inventory.controller.js  # Stock check & manual sync
│   │   ├── product.controller.js
│   │   └── user.controller.js
│   ├── middleware/
│   │   ├── authMiddleware.js    # JWT verify + Redis session check (2-layer)
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── cart.model.js
│   │   ├── product.model.js
│   │   └── user.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── cart.routes.js
│   │   ├── inventory.routes.js  # NEW
│   │   ├── product.routes.js
│   │   └── user.routes.js
│   ├── services/
│   │   ├── cart.service.js      # Redis cart logic + inventory integration
│   │   ├── inventory.service.js # NEW — atomic DECR/INCR + Postgres sync
│   │   ├── product.service.js
│   │   └── user.service.js
│   ├── utils/
│   │   └── validator.js
│   └── app.js
├── .env
├── .gitignore
├── cart_tes.lua     # wrk load test script
├── dump.sql         # PostgreSQL schema
├── index.js         # Entry point (runs inventory sync on startup)
├── package.json
├── readme.md
├── seed.js          # Seeds PostgreSQL with dummy products
└── test_local.js    # End-to-end local test suite
```

---

## Setup & Running Locally

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Buat file `.env` dengan variabel berikut:
```env
PORT=4000
CORS_ORIGIN=http://localhost:3000

# Redis
REDIS_HOST=<redis-host>
REDIS_PORT=<redis-port>
REDIS_PASSWORD=<redis-password>

# PostgreSQL
DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require

# JWT
JWT_SECRET=<your-secret>
```

### 3. Initialize database schema
```sql
-- Jalankan dump.sql ke PostgreSQL instance kamu
-- (bisa lewat psql, pgAdmin, atau Neon dashboard)
```

### 4. Seed database
```bash
node seed.js
```

### 5. Start server
```bash
node index.js
```

Saat startup, server otomatis:
1. Memeriksa koneksi PostgreSQL
2. Men-sync seluruh stok produk dari PostgreSQL ke Redis (`inventory:{id}`)
3. Mulai listening di port 4000

Output startup yang diharapkan:
```
Database connected successfully
[Inventory] Synced 9 products to Redis.
Server running on port 4000
Environment: development
```

---

## Authentication

Autentikasi menggunakan **JWT yang disimpan di HttpOnly Cookie** dan divalidasi dengan **dua lapis pengecekan**:

1. **JWT signature** — memverifikasi token tidak dimanipulasi dan belum expired
2. **Redis session check** — memverifikasi key `session:{userId}` masih ada; jika user sudah logout, key ini dihapus sehingga request ditolak meskipun JWT masih valid secara kriptografis

> **Catatan untuk frontend:** Sertakan `credentials: 'include'` pada setiap request.

```javascript
// fetch
const response = await fetch('http://localhost:4000/users/me', {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
});

// axios
const api = axios.create({
    baseURL: 'http://localhost:4000',
    withCredentials: true
});
```

---

## API Documentation

### AUTH

#### `POST /auth/login`
Login dan membuat sesi Redis.
```json
{
    "email": "user@example.com",
    "password": "YourPass@123"
}
```
Response menyertakan cookie `token` (HttpOnly) dan menjalankan `SET session:{userId} <token> EX 86400` di Redis.

#### `POST /auth/logout`
*(Requires auth)*
Logout yang benar-benar valid: menghapus `session:{userId}` dari Redis sehingga token lama langsung ditolak, lalu membersihkan cookie.

---

### USERS

#### `POST /users/register`
Daftar akun baru.
```json
{
    "username": "namauser",
    "email": "email@example.com",
    "password": "MinimumPass@10char"
}
```
> Password harus min. 10 karakter, mengandung huruf besar, huruf kecil, angka, dan karakter spesial.

#### `GET /users/me`
*(Requires auth)* Mendapatkan profil user yang sedang login.

#### `GET /users/email/:email`
*(Requires auth)* Mencari user berdasarkan email.

#### `GET /users/id/:id`
*(Requires auth)* Mencari user berdasarkan ID.

#### `PUT /users/me`
*(Requires auth)* Mengupdate profil (username, email, atau password).

---

### PRODUCTS

#### `GET /products`
Mendapatkan semua produk. Response di-cache ke Redis (`products:all`, TTL 5 menit). Cache di-invalidate otomatis saat ada produk yang dibuat/diupdate/dihapus.

#### `GET /products/:id`
Mendapatkan satu produk berdasarkan ID.

#### `POST /products`
*(Requires auth)* Membuat produk baru. Saat produk dibuat, stok juga di-sync ke Redis `inventory:{id}`.
```json
{
    "name": "Nama Produk",
    "price": 100000,
    "stock": 50
}
```

#### `PUT /products/:id`
*(Requires auth, seller only)* Mengupdate produk. Cache `products:all` di-invalidate.
```json
{
    "name": "Nama Baru",
    "price": 120000,
    "stock": 45
}
```

#### `DELETE /products/:id`
*(Requires auth, seller only)* Menghapus produk.

---

### INVENTORY *(NEW)*

Endpoint untuk melihat dan mengelola **stok real-time di Redis** (`inventory:{product_id}`).

#### `GET /inventory/:productId`
*(Requires auth)* Melihat stok Redis saat ini untuk sebuah produk. Jika key belum ada (cold cache), otomatis mengambil dari PostgreSQL.

**Response:**
```json
{
    "success": true,
    "payload": {
        "product_id": "fca046c7-...",
        "redis_stock": 148,
        "source": "inventory:fca046c7-..."
    }
}
```

#### `POST /inventory/sync`
*(Requires auth)* Menyinkronkan ulang **semua** stok produk dari PostgreSQL ke Redis menggunakan pipeline. Berguna setelah operasi langsung di database.

**Response:**
```json
{
    "success": true,
    "payload": { "synced": 9 }
}
```

---

### CARTS

Semua route cart memerlukan autentikasi. Tersedia dua jalur: **SQL** (PostgreSQL — data permanen) dan **Redis** (in-memory — kecepatan tinggi, cocok untuk flash sale).

#### SQL Cart

| Method | Route | Deskripsi |
|---|---|---|
| `POST` | `/carts/sql` | Tambah item ke cart PostgreSQL |
| `GET` | `/carts/sql` | Lihat semua item di cart |
| `PUT` | `/carts/sql/:productId` | Update jumlah item |
| `DELETE` | `/carts/sql/:productId` | Hapus item dari cart |

Request body `POST /carts/sql`:
```json
{
    "product_id": "uuid-produk",
    "quantity": 2
}
```

---

#### Redis Cart *(Key-Value paradigm)*

Stok dikelola secara **atomik** — setiap `POST /carts/redis` akan otomatis men-decrement `inventory:{productId}`. Jika stok tidak cukup, request langsung ditolak (HTTP 400) tanpa race condition.

| Method | Route | Deskripsi | Redis Operation |
|---|---|---|---|
| `POST` | `/carts/redis` | Tambah item + kurangi stok | `DECRBY inventory:{id}` + `HINCRBY cart:{userId}` |
| `GET` | `/carts/redis` | Lihat cart Redis | `HGETALL cart:{userId}` |
| `PUT` | `/carts/redis/:productId` | Update jumlah (delta inventory disesuaikan) | `HSET` + `DECRBY`/`INCRBY` |
| `DELETE` | `/carts/redis/:productId` | Hapus item + kembalikan stok | `HDEL` + `INCRBY inventory:{id}` |
| `POST` | `/carts/redis/checkout` | Flush cart Redis → PostgreSQL | `HGETALL` + `DEL cart:{userId}` |

Request body `POST /carts/redis`:
```json
{
    "product_id": "uuid-produk",
    "quantity": 2
}
```

Response menyertakan sisa stok setelah penambahan:
```json
{
    "success": true,
    "payload": {
        "product_id": "fca046c7-...",
        "quantity": 2,
        "remaining_stock": 148
    }
}
```

**`POST /carts/redis/checkout`** — Memindahkan semua item dari Redis ke PostgreSQL (tabel `carts` + `cart_items`), lalu menghapus key Redis. Stok **tidak dikembalikan** karena item sudah resmi di-checkout.

---

## Load Testing

Untuk membandingkan performa Redis vs PostgreSQL cart:

```bash
# Install wrk (Linux/WSL)
sudo apt update && sudo apt install wrk

# Test Redis cart
wrk -t8 -c200 -d30s -s cart_tes.lua http://localhost:4000/carts/redis

# Test SQL cart
wrk -t8 -c200 -d30s -s cart_tes.lua http://localhost:4000/carts/sql
```

> Edit `cart_tes.lua` dan ganti `<GANTI_INI_JADI_TOKEN>` dengan cookie token yang valid dari browser/Postman.

---

## Local Test Suite

Untuk menjalankan end-to-end test yang mencakup seluruh alur Redis (register → login → cek inventory → add to cart → checkout → logout → verifikasi session invalid):

```bash
# Pastikan server sudah berjalan terlebih dahulu
node index.js

# Di terminal lain
node test_local.js
```

Output yang diharapkan — semua ✅:
```
✅ [201] POST /users/register
✅ [200] POST /auth/login  →  session:{userId} written to Redis
✅ [200] GET /products  (served from Redis cache)
✅ [200] GET /inventory/:id  (stock BEFORE add-to-cart)
✅ [201] POST /carts/redis  →  HINCRBY cart + DECRBY inventory
✅ [200] GET /inventory/:id  (stock AFTER add-to-cart, should be -2)
✅ [200] GET /carts/redis  →  HGETALL cart:{userId}
✅ [200] POST /carts/redis/checkout  →  Redis→Postgres flush
✅ [200] GET /carts/redis  (should be empty after checkout)
✅ [200] GET /carts/sql  (item should be persisted here)
✅ [200] POST /auth/logout  →  DEL session:{userId} from Redis
❌ [401] GET /carts/redis after logout  (should be 401) ← ini yang diharapkan!
```

---

## PostgreSQL Schema

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0
);

CREATE TYPE cart_status AS ENUM ('active', 'checked_out', 'canceled');

CREATE TABLE carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status cart_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (cart_id, product_id)
);
```
