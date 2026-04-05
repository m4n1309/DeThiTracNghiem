import express from 'express';
import * as questionController from '../controllers/questionController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// All question routes require authentication
router.use(authenticateToken);

// Helper for filtering
router.get('/my-subjects', questionController.getMySubjects);

// Import/Export Template
router.get('/template', questionController.getQuestionTemplate);
router.post('/import-parse', upload.single('file'), questionController.importParse);
router.post('/import-confirm', questionController.importConfirm);

// CRUD
router.get('/', questionController.getQuestions);
router.post('/', questionController.createQuestion);
router.put('/:id', questionController.updateQuestion);
router.delete('/:id', questionController.deleteQuestion);

export default router;
