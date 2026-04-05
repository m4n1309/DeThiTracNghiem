import express from 'express';
import * as userController from '../controllers/userController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes here are protected and require Admin role
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

// Fetch users
router.get('/', userController.getAllUsers);

// CRUD
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

// Specialized updates
router.patch('/:id/toggle-status', userController.toggleUserStatus);
router.patch('/:id/reset-password', userController.resetPassword);

export default router;
