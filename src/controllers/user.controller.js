const UserService = require('../services/user.service');
const { AppError } = require('../middleware/errorHandler');
const { redis } = require('../config/redis');

class UserController {
    static async register(req, res, next) {
        try {
            const { username, email, password } = req.body;
            const user = await UserService.register({ username, email, password });
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                payload: user,
            });
        } catch(error) {
            next(error);
        }
    }

    static async updateProfile(req, res, next) {
        try {
            const id = req.user.id;
            const oldEmail = req.user.email;
            const { username, email, password } = req.body;
            const updatedUser = await UserService.updateProfile(id, { username, email, password });
            await redis.del(`user:${id}`);
            await redis.del(`user:${oldEmail}`);
            res.status(201).json({
                success: true,
                message: 'User updated successfully',
                payload: updatedUser,
            });
        } catch(error) {
            next(error);
        }
    }

    static async getUserByEmail(req, res, next) {
        try {
        const { email } = req.params;
        const cacheKey = `user:${email}`;

        const cached = await redis.get(cacheKey);
        if (cached) {
            return res.status(200).json({
            success: true,
            message: 'User retrieved (cache hit)',
            payload: JSON.parse(cached),
            });
        }
        const user = await UserService.getUserByEmail(email);
        await redis.set(cacheKey, JSON.stringify(user), 'EX', 60);
        return res.status(200).json({
            success: true,
            message: 'User retrieved (cache miss)',
            payload: user,
        });
        } catch (error) {
            next(error);
        }
    }

    static async getUserById(req, res, next) {
        try {
        const { id } = req.params;
        const cacheKey = `user:${id}`;

        const cached = await redis.get(cacheKey);
        if (cached) {
            return res.status(200).json({
            success: true,
            message: 'User retrieved (cache hit)',
            payload: JSON.parse(cached),
            });
        }
        const user = await UserService.getUserById(id);
        await redis.set(cacheKey, JSON.stringify(user), 'EX', 60);
        return res.status(200).json({
            success: true,
            message: 'User retrieved (cache miss)',
            payload: user,
        });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = UserController;