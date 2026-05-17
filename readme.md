## FlashCart

```
Disclaimer: To test the cart with lua file, please install the wrk with code bellow

sudo apt update
sudo apt install wrk
```

### Kelompok 3
- Raihan Muhammad Nafis Al-Kautsar (2406413451)
- 
- 
- 
- 

---
### Project Diagram
```
FlashCart-Backend/
├── src/
│   ├── config/
│   │   ├── postgres.js
│   │   └── redis.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── cart.controller.js
│   │   ├── product.controller.js
│   │   └── user.controller.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── cart.model.js
│   │   ├── product.model.js
│   │   └── user.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── cart.routes.js
│   │   ├── product.routes.js
│   │   └── user.routes.js
│   ├── services/
│   │   ├── cart.service.js
│   │   ├── product.service.js
│   │   └── user.service.js
│   ├── utils/
│   │   └── validator.js
│   └── app.js
├── .gitignore
├── cart_tes.lua
├── dump.sql
├── index.js
├── package-lock.json
├── package.json
├── readme.md
└── seed.js
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
