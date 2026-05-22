const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');
const { redis } = require('../config/redis');

const authenticateToken = async (req, res, next) => {
    const token = req.cookies?.token;

    if (!token) {
        return next(new AppError('Access token is required', 401));
    }

    // Layer 1
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return next(new AppError('Invalid or expired token', 401));
    }

    // Layer 2
    const sessionToken = await redis.get(`session:${decoded.id}`);
    if (!sessionToken || sessionToken !== token) {
        return next(new AppError('Session expired or invalidated. Please log in again.', 401));
    }

    req.user = decoded;
    next();
};

module.exports = { authenticateToken };
