import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { config } from '../config/env';

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, name } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(400).json({ error: 'User already exists' });
            return;
        }

        // Create new user
        const user = new User({ email, password, name });
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id.toString() },
            config.jwtSecret,
            { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
        );

        res.status(201).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                apiKey: user.apiKey,
            },
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id.toString() },
            config.jwtSecret,
            { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
        );

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                apiKey: user.apiKey,
            },
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getMe = async (req: any, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json({ user });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
