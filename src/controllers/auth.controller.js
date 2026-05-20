const UserService = require('../services/user.service');
const jwt = require('jsonwebtoken');
const { redis } = require('../config/redis');

const SESSION_TTL = 60 * 60 * 24; // 24 hours in seconds

class AuthController {
    static async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const user = await UserService.login(email, password);

            const token = jwt.sign(
                { id: user.id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );

            // ── Redis: store session token with 24-hour TTL ──────────────────
            // Key pattern: session:{user_id}
            await redis.set(`session:${user.id}`, token, 'EX', SESSION_TTL);

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: SESSION_TTL * 1000,
            });

            res.status(200).json({
                success: true,
                message: 'Login successful',
                payload: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    static async logout(req, res, next) {
        try {
            // ── Redis: delete session key so token is truly invalidated ───────
            if (req.user?.id) {
                await redis.del(`session:${req.user.id}`);
            }

            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
            });

            res.status(200).json({
                success: true,
                message: 'Logout successful',
                payload: null,
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = AuthController;