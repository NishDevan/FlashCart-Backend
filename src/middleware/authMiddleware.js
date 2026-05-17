const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');

const authenticateToken = (req, res, next) => {
    const token = req.cookies?.token; 

    if (!token) {
        return next(new AppError('Access token is required', 401));
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return next(new AppError('Invalid or expired token', 401));
        }
        req.user = user;
        next();
    });
};

module.exports = { authenticateToken };