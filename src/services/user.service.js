const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { AppError } = require('../middleware/errorHandler');

class UserService {
    static async register({ username, email, password }) {
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            throw new AppError('User already exists', 400);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = await User.createUser(username, email, hashedPassword);
        return user;
    }

    static async login(email, password) {
        const user = await User.findByEmail(email);
        if (!user) {
            throw new AppError('Invalid email or password', 401);
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new AppError('Invalid email or password', 401);
        }

        return user; 
    }

    static async updateProfile(id, updateData) {
    // If password is being updated, hash it
    if (updateData.password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(updateData.password, salt);
        }

        const updatedUser = await User.update(id, updateData);
        if (!updatedUser) {
            throw new AppError('User not found', 404);
        }
        return updatedUser;
    }

    static async getUserByEmail(email){
        const user = await User.findByEmail(email);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        return user;
    }

    static async getUserById(id){
        const user = await User.findById(id);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        return user;
    }
}

module.exports = UserService;