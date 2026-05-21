const Redis = require("ioredis");
require('dotenv').config();

const redis = new Redis({
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD,

    // Don't connect immediately — wait until first command is issued.
    // This lets the HTTP server start even if Redis is momentarily unreachable.
    lazyConnect: true,

    // Timeout for a single connect attempt (ms)
    connectTimeout: 10000,

    // Exponential backoff retry: wait 2^attempt * 50ms, cap at 10s, give up after 20 tries
    retryStrategy(times) {
        if (times > 20) {
            console.error('[Redis] Max reconnection attempts reached. Giving up.');
            return null; // stop retrying
        }
        const delay = Math.min(Math.pow(2, times) * 50, 10000);
        console.warn(`[Redis] Reconnecting... attempt ${times}, next try in ${delay}ms`);
        return delay;
    },
});

redis.on('connect', () => console.log('[Redis] Connected'));
redis.on('ready',   () => console.log('[Redis] Ready'));
redis.on('error',   (err) => console.error('[Redis] Error:', err.message));
redis.on('close',   () => console.warn('[Redis] Connection closed'));
redis.on('reconnecting', () => console.warn('[Redis] Reconnecting...'));

module.exports = { redis };