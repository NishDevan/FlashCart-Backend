const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const productRoutes = require('./routes/product.routes');
const cartRoutes = require('./routes/cart.routes');

const app = express();
const cookieParser = require('cookie-parser');

app.use(cors(
    {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 204,
}
));
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// Rate limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 25 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
});
app.use('/auth', authLimiter);
app.use('/users/register', authLimiter);

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/products', productRoutes);
app.use('/carts',cartRoutes);

app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API is healthy',
    });
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
});

app.use(errorHandler);

module.exports = app;