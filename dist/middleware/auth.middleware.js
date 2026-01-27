import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
export const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            res.status(401).json({ success: false, message: 'No token provided' });
            return;
        }
        const decoded = jwt.verify(token, config.jwtSecret);
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};
//# sourceMappingURL=auth.middleware.js.map