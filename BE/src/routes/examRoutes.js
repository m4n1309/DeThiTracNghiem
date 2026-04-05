import express from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import * as examController from '../controllers/examController.js';

const router = express.Router();

router.use(authenticateToken);

// All roles can list/get exams
router.get('/', examController.getExams);
router.get('/stats/:subject_id', examController.getExamStats);

// Admin/Teacher can create/update/delete
router.post('/', authorizeRoles('admin', 'teacher'), examController.createExam);
router.put('/:id', authorizeRoles('admin', 'teacher'), examController.updateExam);
router.delete('/:id', authorizeRoles('admin', 'teacher'), examController.deleteExam);

export default router;
