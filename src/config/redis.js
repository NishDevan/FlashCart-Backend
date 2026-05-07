const Redis = require("ioredis");
require('dotenv').config();

const redis = new Redis({
    port: process.env.REDIS_PORT, // Redis port
    host: process.env.REDIS_HOST, // Redis host
    password: process.env.REDIS_PASSWORD, // Redis password
});

module.exports = { redis };