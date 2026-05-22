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

### API Documetation

### Disclaimer:
Untuk autentikasi, karena menggunakan cookies, gunakan kode seperti ini (contoh saja) di frontend:
```javascript
// Contoh jika menggunakan Next.js dan fetch untuk fetching data
const response = await fetch('http://localhost:8080/users/me', {
    method: 'GET',
    credentials: 'include', // <--- INI KUNCI UTAMANYA
    headers: {
        'Content-Type': 'application/json'
    }
});


// Dan ini jika menggunakan axios
import axios from 'axios';

// Buat instance axios khusus untuk backend
const api = axios.create({
    baseURL: 'http://localhost:8080',
    withCredentials: true // <--- INI KUNCI UTAMANYA
});

// Nanti tinggal panggil:
const response = await api.get('/users/me');
```

#### USERS
- POST /users/register
    Untuk daftar akun, body requestnya:
    ```json
    {
        "username" : "",
        "email"    : "",
        "password" : ""
    }
    ```
    ![image](https://hackmd.io/_uploads/S1_y1AL1fe.png)
- POST /auth/login
Untuk login, body requestnya:
    ```json
    {
        "email"    : "",
        "password" : ""
    }
    ```
    ![image](https://hackmd.io/_uploads/H1BXkRIJfe.png)
- POST /auth/logout
Untuk melakukan Logout

    Sebelum  Logout
    ![image](https://hackmd.io/_uploads/H19dDE_1zx.png)
    
    Logout (POST dengan body kosong)
    ![image](https://hackmd.io/_uploads/HJXaPNOyfg.png)

    Setelah Logout
    ![image](https://hackmd.io/_uploads/HygZ_Eukze.png)

- GET /users/me
Untuk mendapatkan informasi user yang sedang login saat ini
![image](https://hackmd.io/_uploads/Byxk80IJGl.png)
- GET /users/email/:email
Untuk cari user dengan email, parameter nya email user
![image](https://hackmd.io/_uploads/BJLKkALkMg.png)
- GET /users/id/:id
Untuk cari user berdasarkan id, parameternya id user
![image](https://hackmd.io/_uploads/S1UhJRLkMx.png)

#### PRODUCTS
- GET /products
Mendapatkan informasi semua product yang ada
![image](https://hackmd.io/_uploads/SkZlxA81fe.png)
- POST /products
    Menjual sebuah item dengan request body (hanya user yang sudah login):
    ```json
    {
        "name"  : "",
        "price" : [harga],
        "stock" : [stok]
    }
    ```
    ![image](https://hackmd.io/_uploads/rknwlRU1Mg.png)
- GET /product/:id
Mendapatkan informasi sebuah product spesifik
![image](https://hackmd.io/_uploads/HyzAe081Gl.png)
- PUT /products/:id
Mengupdate informasi barang (hanya pemilik / seller yang bisa). request body nya:
    ```json
        {
            "name" : "", (opsional)
            "price": [harga], (opsional)
            "stock": [stok] (opsional)
        }
    ```
    ![image](https://hackmd.io/_uploads/rkJEbCUyGx.png)
- Delete /products/:id
    Menghapus barang dari toko (hanya pemilik / seller yang bisa).
![image](https://hackmd.io/_uploads/S1rPZRIkze.png)
![image](https://hackmd.io/_uploads/Bk62WRLyfx.png)

#### CARTS
Memiliki 2 jenis route, menggunakan sql (postgres) dan nosql (redis)

#### SQL
- POST /carts/sql
Memasukkan barang spesifik ke cart atau menambah jumlah barang tersebut di cart sebanyak quantity yang dimasukkan (hanya user yang sudah login), request body nya:
    ```json
        {
            "product_id" : "",
            "quantity"   : [jumlah barang di cart]
        }
    ```
    ![image](https://hackmd.io/_uploads/r1sOzC8yzg.png)
- GET /carts/sql
Mendapatkan informasi semua barang di dalam cart (hanya user yang sudah login dan masing-masing user memiliki cartnya sendiri)
![image](https://hackmd.io/_uploads/ryXkQA8yze.png)
- PUT /carts/sql/:product_id
    Mengubah jumlah barang spesifik di dalam cart menjadi suatu angka spesifik (hanya user yang sudah login dan masing-masing user memiliki cartnya sendiri), request body nya:
    ```json
        {
            "quantity" : [jumlah barang]
        }
    ```
    ![image](https://hackmd.io/_uploads/SyQSQAIJzx.png)
- DELETE /carts/sql/:product_id
Menghapus sebuah barang dari cart user (hanya user yang sudah login dan masing-masing user memiliki cartnya sendiri)
![image](https://hackmd.io/_uploads/SJauXALkGe.png)
![image](https://hackmd.io/_uploads/S1vqQRUJMl.png)

#### Redis [penjelasannya sama seperti route SQL]
- POST /carts/redis
![image](https://hackmd.io/_uploads/ryyNE0Ukze.png)
- GET /carts/redis
![image](https://hackmd.io/_uploads/rJH8NRUkMe.png)
- PUT /carts/redis/:product_id
![image](https://hackmd.io/_uploads/SJiqECLkMx.png)
- DELETE /carts/redis/:product_id
![image](https://hackmd.io/_uploads/BJHAN08Jze.png)
![image](https://hackmd.io/_uploads/BJMgrC8JGx.png)

---
Example Test
![image](https://hackmd.io/_uploads/HJa3apIyfl.png)
![image](https://hackmd.io/_uploads/rkNgzR8yfx.png)

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
