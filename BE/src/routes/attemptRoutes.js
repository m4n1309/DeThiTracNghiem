import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import * as attemptController from '../controllers/attemptController.js';

const router = express.Router();

// All attempt routes require a valid token (Admin, Teacher, or Student)
router.use(authenticateToken);

router.post('/start', attemptController.startAttempt);
router.get('/:attemptId', attemptController.getAttemptData);
router.post('/update-answer', attemptController.updateAnswer);
router.post('/:attemptId/submit', attemptController.submitAttempt);
router.get('/:attemptId/review', attemptController.getAttemptReview);


export default router;
