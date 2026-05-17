const UserService = require('../services/user.service');
const jwt = require('jsonwebtoken');

class AuthController {
    static async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const user = await UserService.login(email, password);
            const token = jwt.sign(
                { id: user.id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: '1d' } // Misal valid 1 hari
            );

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 24 * 60 * 60 * 1000
            });
            
            res.status(200).json({
                success: true,
                message: 'Login successful',
                payload: {
                    id: user.id,
                    username: user.username,
                    email: user.email
                },
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = AuthController;