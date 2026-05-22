## Databse Structure

### SQL
ERD for the SQL database
![image](https://hackmd.io/_uploads/BkMMr10kzg.png)

Schema
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

## NoSQL

### Redis Key-Value Data Model

| Tipe | Key Pattern | Value | TTL |
|---|---|---|---|
| Session | `session:{user_id}` | JWT token string | 24 jam |
| Cart | `cart:{user_id}` | Hash `{product_id: quantity}` | 24 jam (diperbarui setiap write) |
| Inventory | `inventory:{product_id}` | Integer (stok tersedia) | 24 jam |

### Operations

| Method | Route | Deskripsi | Redis Operation |
|---|---|---|---|
| `POST` | `/carts/redis` | Tambah item + kurangi stok | `DECRBY inventory:{id}` + `HINCRBY cart:{userId}` |
| `GET` | `/carts/redis` | Lihat cart Redis | `HGETALL cart:{userId}` |
| `PUT` | `/carts/redis/:productId` | Update jumlah (delta inventory disesuaikan) | `HSET` + `DECRBY`/`INCRBY` |
| `DELETE` | `/carts/redis/:productId` | Hapus item + kembalikan stok | `HDEL` + `INCRBY inventory:{id}` |
| `POST` | `/carts/redis/checkout` | Flush cart Redis → PostgreSQL | `HGETALL` + `DEL cart:{userId}` |