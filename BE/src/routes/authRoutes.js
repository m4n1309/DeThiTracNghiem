import express from 'express';
import authController from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/login', authController.login);
router.post('/student-login', authController.studentLogin);

// Protected routes
router.get('/me', authenticateToken, authController.getMe);

// Example of role-based route
router.get('/admin-only', authenticateToken, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  res.json({ message: 'Welcome Admin' });
});

export default router;
