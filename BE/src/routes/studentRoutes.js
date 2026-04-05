import express from 'express';
import multer from 'multer';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import * as studentController from '../controllers/studentController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Apply auth to all student routes
router.use(authenticateToken);
router.use(authorizeRoles('admin', 'teacher'));

router.get('/', studentController.getParticipants);
router.get('/template', studentController.getStudentTemplate);
router.post('/', studentController.addParticipant);
router.post('/import', studentController.importParticipants); // Old text-based import
router.post('/import-parse', upload.single('file'), studentController.importParticipantsParse);
router.post('/import-confirm', studentController.importParticipantsConfirm);
router.put('/:id', studentController.updateParticipant);
router.delete('/:id', studentController.deleteParticipant);

export default router;
