class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

    const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        res.status(err.statusCode).json({
        success: false,
        message: err.message,
        error: err,
        stack: err.stack,
        });
    } else {
        // Production: don't leak error details
        if (err.isOperational) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
            payload: null,
        });
        } else {
        // Programming or unknown errors
        console.error('ERROR 💥', err);
        res.status(500).json({
            success: false,
            message: 'Something went wrong',
            payload: null,
        });
        }
    }
};

module.exports = { AppError, errorHandler };