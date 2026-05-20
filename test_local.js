require('dotenv').config();
const http = require('http');

// Utility to make HTTP requests
function request(method, path, body, cookies = '') {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : '';
        const options = {
            hostname: 'localhost',
            port: 4000,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
                ...(cookies ? { Cookie: cookies } : {}),
            },
        };
        const req = http.request(options, (res) => {
            let raw = '';
            res.on('data', (chunk) => (raw += chunk));
            res.on('end', () => {
                // Collect Set-Cookie header
                const setCookie = res.headers['set-cookie'] || [];
                const tokenCookie = setCookie.find((c) => c.startsWith('token='));
                const tokenVal = tokenCookie ? tokenCookie.split(';')[0] : null;
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(raw), cookie: tokenVal });
                } catch {
                    resolve({ status: res.statusCode, body: raw, cookie: tokenVal });
                }
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

function log(label, res) {
    const icon = res.body?.success ? '✅' : '❌';
    console.log(`\n${icon} [${res.status}] ${label}`);
    console.log(JSON.stringify(res.body, null, 2));
}

async function run() {
    console.log('═══════════════════════════════════════════');
    console.log('       FlashCart API – Local Test Suite     ');
    console.log('═══════════════════════════════════════════');

    // ── 1. Register ──────────────────────────────────────────────────────────
    const reg = await request('POST', '/users/register', {
        username: 'flashtester',
        email: 'flashtester@test.com',
        password: 'TestPass@2025',
    });
    log('POST /users/register', reg);

    // ── 2. Login (creates session:{userId} in Redis) ──────────────────────────
    const login = await request('POST', '/auth/login', {
        email: 'flashtester@test.com',
        password: 'TestPass@2025',
    });
    log('POST /auth/login  →  session:{userId} written to Redis', login);
    const cookie = login.cookie;
    const userId = login.body?.payload?.id;
    if (!cookie) { console.error('\n🚫 No cookie received – stopping.'); process.exit(1); }

    // ── 3. List products ──────────────────────────────────────────────────────
    const products = await request('GET', '/products', null, cookie);
    log('GET /products  (served from Redis cache)', products);
    const firstProduct = products.body?.payload?.[0];
    const productId = firstProduct?.id;
    const productName = firstProduct?.name;
    console.log(`\n   Using product: "${productName}" (${productId})`);

    // ── 4. Check inventory BEFORE add ─────────────────────────────────────────
    const stockBefore = await request('GET', `/inventory/${productId}`, null, cookie);
    log(`GET /inventory/${productId}  (stock BEFORE add-to-cart)`, stockBefore);

    // ── 5. Add to Redis cart (decrements inventory:{productId}) ───────────────
    const addRedis = await request('POST', '/carts/redis', { product_id: productId, quantity: 2 }, cookie);
    log('POST /carts/redis  →  HINCRBY cart + DECRBY inventory', addRedis);

    // ── 6. Check inventory AFTER add ──────────────────────────────────────────
    const stockAfter = await request('GET', `/inventory/${productId}`, null, cookie);
    log(`GET /inventory/${productId}  (stock AFTER add-to-cart, should be -2)`, stockAfter);

    // ── 7. Read Redis cart ────────────────────────────────────────────────────
    const cartRedis = await request('GET', '/carts/redis', null, cookie);
    log('GET /carts/redis  →  HGETALL cart:{userId}', cartRedis);

    // ── 8. Checkout Redis cart → flush to Postgres ────────────────────────────
    const checkout = await request('POST', '/carts/redis/checkout', null, cookie);
    log('POST /carts/redis/checkout  →  Redis→Postgres flush', checkout);

    // ── 9. Redis cart should now be empty ─────────────────────────────────────
    const cartAfterCheckout = await request('GET', '/carts/redis', null, cookie);
    log('GET /carts/redis  (should be empty after checkout)', cartAfterCheckout);

    // ── 10. Verify item landed in SQL cart ────────────────────────────────────
    const cartSQL = await request('GET', '/carts/sql', null, cookie);
    log('GET /carts/sql  (item should be persisted here)', cartSQL);

    // ── 11. Logout (DEL session:{userId} from Redis) ──────────────────────────
    const logout = await request('POST', '/auth/logout', null, cookie);
    log('POST /auth/logout  →  DEL session:{userId} from Redis', logout);

    // ── 12. Request with old cookie – should now be rejected ──────────────────
    const afterLogout = await request('GET', '/carts/redis', null, cookie);
    log('GET /carts/redis after logout  (should be 401)', afterLogout);

    console.log('\n═══════════════════════════════════════════');
    console.log('              Test Suite Complete           ');
    console.log('═══════════════════════════════════════════\n');
    process.exit(0);
}

run().catch((err) => { console.error('Fatal:', err); process.exit(1); });
