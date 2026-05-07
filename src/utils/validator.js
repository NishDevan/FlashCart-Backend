const { body, param, query } = require('express-validator');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{10,}$/;
const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

const userRegistrationValidation = [
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .matches(usernameRegex).withMessage('Username must be 3-20 characters and contain only letters, numbers, and underscores'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .matches(emailRegex).withMessage('Invalid email format'),
    body('password')
        .trim()
        .notEmpty().withMessage('Password is required')
        .matches(passwordRegex).withMessage('Password must be at least 10 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
];

const userUpdateValidation = [
    body('id')
        .isInt().withMessage('User ID must be an integer'),
    body('username')
        .optional()
        .trim()
        .matches(usernameRegex).withMessage('Username must be 3-20 characters and contain only letters, numbers, and underscores'),
    body('email')
        .optional()
        .trim()
        .matches(emailRegex).withMessage('Invalid email format'),
    body('password')
        .optional()
        .trim()
        .matches(passwordRegex).withMessage('Password must be at least 10 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
];

const validate = (req, res, next) => {
    const errors = require('express-validator').validationResult(req);
    if (!errors.isEmpty()) {
        const messages = errors.array().map(err => err.msg);
        return res.status(400).json({
        success: false,
        message: messages.join('. '),
        payload: null,
        });
    }
    next();
};

module.exports = {
    emailRegex,
    passwordRegex,
    usernameRegex,
    userRegistrationValidation,
    userUpdateValidation,
    validate,
};