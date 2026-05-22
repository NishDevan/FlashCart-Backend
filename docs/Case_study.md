----------------------------------
## Case Study

### Brief Information
**Company**: Amazon.com, Inc.

**Usage Focus**: Shopping Cart Management using Key-Value Store architecture (their internal Dynamo system).

**Specific Problem**: In its early days (especially during the busy holiday season), Amazon's traditional relational database system (RDBMS) was unable to scale with massive traffic spikes. They often experience performance bottlenecks that cause shopping cart systems to fail, which could lead to sales losses.

**Why Key-Value Paradigm**: Amazon realized that for the shopping cart feature, they **didn't need complex queries**, relationships between tables (JOINs), or rigid data structures. They just need a **simple operation** with **extreme speed**: "Retrieve cart data for User ID X". The Key-Value paradigm provides read/write performance with O(1) time complexity, easy horizontal scalability, and high schema flexibility.

---

### Begin the Test

```
Requirements: 
- Install wrk on your device to start the test
- Make sure you have downloaded the cart_tes.lua script and have it on your working directory
```


![image](https://hackmd.io/_uploads/HygnV0ayzx.png)

```bash
wrk -t8 -c200 -d10s -s cart_tes.lua http://192.168.56.1:4000/carts/redis
wrk -t8 -c200 -d10s -s cart_tes.lua http://192.168.56.1:4000/carts/sql
```

#### What the script does?

It simulates a request from users to add much items (products) to their carts using a post method with random product_id hardcoded (in an array) inside. but, make sure to replace the token from your login result so that the test can run smoothly (since the `/carts/*` routes needs authentication).

Response from `/carts/redis`
```json
{
    "success": true,
    "message": "Redis Cart retrieved successfully",
    "payload": [
        {
            "product_id": "7544efec-a2c3-44ef-9656-b701437e6746",
            "quantity": 320
        },
        {
            "product_id": "fca046c7-9c73-46ee-9588-2be04fe32b1c",
            "quantity": 231
        },
        {
            "product_id": "e5f4ec79-76f9-4c7b-9c59-731eb82ed2a3",
            "quantity": 234
        },
        {
            "product_id": "fffbba09-c084-47c1-a853-1fd7c25fffee",
            "quantity": 272
        },
        {
            "product_id": "807a8947-4650-4110-8d41-49aabf57d483",
            "quantity": 359
        },
        {
            "product_id": "5005287f-d4d2-420e-b625-caa3312d123a",
            "quantity": 278
        },
        {
            "product_id": "520156c5-740e-4b61-b535-04721fa16403",
            "quantity": 249
        },
        {
            "product_id": "ebcae8d1-0dbe-4f58-bce4-09f3cfe72e87",
            "quantity": 298
        },
        {
            "product_id": "8c536bfb-267c-4fdf-9ab4-8eb03c2665f0",
            "quantity": 298
        }
    ]
}
```

Response from `/carts/sql`

```json
{
    "success": true,
    "message": "SQL Cart retrieved successfully",
    "payload": [
        {
            "cart_id": "ae6af5e8-0a53-4fda-ad27-31ed0e0be15a",
            "status": "active",
            "quantity": 141,
            "product_id": "fffbba09-c084-47c1-a853-1fd7c25fffee",
            "name": "LibGDX Platformer Asset Pack",
            "price": "150000.00"
        },
        {
            "cart_id": "ae6af5e8-0a53-4fda-ad27-31ed0e0be15a",
            "status": "active",
            "quantity": 90,
            "product_id": "7544efec-a2c3-44ef-9656-b701437e6746",
            "name": "Cisco Catalyst 2960-X 24 GigE",
            "price": "6200000.00"
        },
        {
            "cart_id": "ae6af5e8-0a53-4fda-ad27-31ed0e0be15a",
            "status": "active",
            "quantity": 85,
            "product_id": "520156c5-740e-4b61-b535-04721fa16403",
            "name": "RJ45 Crimping Tool Pro",
            "price": "125000.00"
        },
        {
            "cart_id": "ae6af5e8-0a53-4fda-ad27-31ed0e0be15a",
            "status": "active",
            "quantity": 127,
            "product_id": "fca046c7-9c73-46ee-9588-2be04fe32b1c",
            "name": "ATmega328P Microcontroller IC",
            "price": "45000.00"
        },
        {
            "cart_id": "ae6af5e8-0a53-4fda-ad27-31ed0e0be15a",
            "status": "active",
            "quantity": 161,
            "product_id": "807a8947-4650-4110-8d41-49aabf57d483",
            "name": "Anime Streaming Premium Pass (1 Month)",
            "price": "49000.00"
        },
        {
            "cart_id": "ae6af5e8-0a53-4fda-ad27-31ed0e0be15a",
            "status": "active",
            "quantity": 135,
            "product_id": "e5f4ec79-76f9-4c7b-9c59-731eb82ed2a3",
            "name": "Nvidia GeForce RTX 3050 8GB",
            "price": "4500000.00"
        },
        {
            "cart_id": "ae6af5e8-0a53-4fda-ad27-31ed0e0be15a",
            "status": "active",
            "quantity": 124,
            "product_id": "ebcae8d1-0dbe-4f58-bce4-09f3cfe72e87",
            "name": "Laptop ROG",
            "price": "20000000.00"
        },
        {
            "cart_id": "ae6af5e8-0a53-4fda-ad27-31ed0e0be15a",
            "status": "active",
            "quantity": 156,
            "product_id": "8c536bfb-267c-4fdf-9ab4-8eb03c2665f0",
            "name": "FloorIsLava Official Hoodie",
            "price": "350000.00"
        },
        {
            "cart_id": "ae6af5e8-0a53-4fda-ad27-31ed0e0be15a",
            "status": "active",
            "quantity": 114,
            "product_id": "5005287f-d4d2-420e-b625-caa3312d123a",
            "name": "Thermal Paste Arctic MX-4 4g",
            "price": "85000.00"
        },
        {
            "cart_id": "0d2ac74e-faae-45a2-a42c-c866ecd9bc4d",
            "status": "active",
            "quantity": 1,
            "product_id": "e5f4ec79-76f9-4c7b-9c59-731eb82ed2a3",
            "name": "Nvidia GeForce RTX 3050 8GB",
            "price": "4500000.00"
        },
        {
            "cart_id": "ba6fe973-24d3-42b1-8efd-68e69aaa6c70",
            "status": "active",
            "quantity": 1,
            "product_id": "7544efec-a2c3-44ef-9656-b701437e6746",
            "name": "Cisco Catalyst 2960-X 24 GigE",
            "price": "6200000.00"
        },
        {
            "cart_id": "0e18d4df-703d-4f3d-9619-41b17fe79457",
            "status": "active",
            "quantity": 1,
            "product_id": "5005287f-d4d2-420e-b625-caa3312d123a",
            "name": "Thermal Paste Arctic MX-4 4g",
            "price": "85000.00"
        },
        {
            "cart_id": "29deccb4-67fb-4758-982e-860c8cfa4051",
            "status": "active",
            "quantity": 1,
            "product_id": "8c536bfb-267c-4fdf-9ab4-8eb03c2665f0",
            "name": "FloorIsLava Official Hoodie",
            "price": "350000.00"
        },
        {
            "cart_id": "674bca1f-5ff9-4d17-b43c-2f877871a73c",
            "status": "active",
            "quantity": 1,
            "product_id": "e5f4ec79-76f9-4c7b-9c59-731eb82ed2a3",
            "name": "Nvidia GeForce RTX 3050 8GB",
            "price": "4500000.00"
        },
        {
            "cart_id": "6cbc10a4-88fc-4e55-84c3-c5cf6759bdf9",
            "status": "active",
            "quantity": 1,
            "product_id": "5005287f-d4d2-420e-b625-caa3312d123a",
            "name": "Thermal Paste Arctic MX-4 4g",
            "price": "85000.00"
        },
        {
            "cart_id": "6636cbea-b8f2-4ba8-8e72-4f8e885ba99b",
            "status": "active",
            "quantity": 1,
            "product_id": "8c536bfb-267c-4fdf-9ab4-8eb03c2665f0",
            "name": "FloorIsLava Official Hoodie",
            "price": "350000.00"
        },
        {
            "cart_id": "5129624d-0ce6-47f4-a1e3-b9773c8b7637",
            "status": "active",
            "quantity": 1,
            "product_id": "7544efec-a2c3-44ef-9656-b701437e6746",
            "name": "Cisco Catalyst 2960-X 24 GigE",
            "price": "6200000.00"
        }
    ]
}
```

---

### Analysis

#### Statistics (Speed and Scalability)
![image](https://hackmd.io/_uploads/H1P6sC61Mx.png)

if we look closely again from the wrk summary, the sql route has the average latency of `1390 ms` (`1.39s`) while redis has an average of `819,73 ms`, which is **41% faster** than SQL. Moreover, Redis can handle `191,44 requests/seconds`, whereas SQL can only handle `48,58 requests/seconds`. This means Redis can handle **~3,94 times** more requests than what SQL can does. Besides the requests/second, we also get that Redis have less timeout connection, `200 connections` where SQL on the other hand has `426 timeouts`, this means redis has **53% less** timeouts.

Why redis can become so fast?

Redis itself applying key-value paradigm, it means, redis store the data inside with a pair of key that used for identify each items, and a value that filled with the item's data. Moreover, Redis is in-memory database, which means, they can handle read & write operations faster than other disk-based database.

reference: https://www.automq.com/blog/in-memory-stream-processing-vs-disk-based-stream-processing

![image](https://hackmd.io/_uploads/ByDwi0pJGe.png)
![image](https://hackmd.io/_uploads/HkKlekAyMg.png)

---

#### Data Model

With the response we got from carts items retrieval, we can also know that with redis, the data model of carts system is really simpler compared to what sql has. here, we have:

ERD for the SQL database
![image](https://hackmd.io/_uploads/BkMMr10kzg.png)

Redis Structure
![image](https://hackmd.io/_uploads/BkxdL1RJMl.png)


Redis make the query simpler than what SQL does, why? it's because redis store the data with key-value pair, which is of we want search or insert an item in redis, we only need the key for that item, so that the query become simpler. In the other hand, SQL makes us to search into a lot of table just only to retrieve items on our carts, such as `Users` for knowing whose cart is the request try to fetch, `carts`, for knowing the `carts_id` for the reference to the `cart_items`, `cart_items` to know what is inside the `carts`, and `products` to know what product is this users have in the cart.

---

### Summary

By replacing complex relational queries, which require expensive JOIN operations across multiple tables (Users, Carts, Cart_Items, Products), with O(1) key-value lookups, the Redis implementation achieved vastly superior performance under heavy load. Specifically, the Key-Value architecture delivered:
- Massively Higher Throughput: Handling ~3.9x more requests per second than the SQL database.
- Significantly Lower Latency: Reducing average response times by 41% (819.73ms vs 1390ms).
- Greater System Stability: Cutting connection timeouts by more than half (200 vs 426).

For features like shopping carts that demand extreme read/write speeds and simple data retrieval, rigid relational data models become a liability. A Key-Value architecture strips away unnecessary complexity, providing the horizontal scalability and raw speed required to survive massive traffic spikes without crashing or losing sales.