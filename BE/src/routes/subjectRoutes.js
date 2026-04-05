import express from 'express';
import * as subjectController from '../controllers/subjectController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Admin only routes
router.use(authenticateToken);
// Allow both Admin and Teacher to view subjects
router.get('/', authorizeRoles('admin', 'teacher'), subjectController.getAllSubjects);

// Only Admin can modify subjects
router.post('/', authorizeRoles('admin'), subjectController.createSubject);
router.put('/:id', authorizeRoles('admin'), subjectController.updateSubject);
router.delete('/:id', authorizeRoles('admin'), subjectController.deleteSubject);

export default router;
