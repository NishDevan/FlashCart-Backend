const UserService = require('../services/user.service');

class AuthController {
    static async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await UserService.login(email, password);
            res.status(200).json({
            success: true,
            message: 'Login successful',
            payload: result,
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = AuthController;