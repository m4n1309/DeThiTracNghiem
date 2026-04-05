import express from 'express';
import * as resultController from '../controllers/resultController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All result routes require authentication
router.use(authenticateToken);

router.get('/exam/:examId', resultController.getResultsByExam);
router.get('/exam/:examId/stats', resultController.getExamStats);
router.get('/exam/:examId/distribution', resultController.getScoreDistribution);
router.get('/subjects/stats', resultController.getSubjectStats);

// Overall summaries
router.get('/summary/exams', resultController.getOverallExamsSummary);
router.get('/summary/students', resultController.getOverallStudentsSummary);
router.get('/summary/pass-fail', resultController.getOverallPassFailRate);
router.get('/summary/trends', resultController.getMonthlyTrends);


export default router;
