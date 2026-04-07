import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import examRoutes from './routes/examRoutes.js';
import attemptRoutes from './routes/attemptRoutes.js';
import resultRoutes from './routes/resultRoutes.js';
import { authenticateToken } from './middlewares/authMiddleware.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.get('/', (req, res) => {
  res.json({ message: 'Online Examination System API is running.' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/results', resultRoutes);

// Protected routes (Direct access if needed)
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
