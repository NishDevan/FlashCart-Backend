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

---------------------
Project Diagram
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
