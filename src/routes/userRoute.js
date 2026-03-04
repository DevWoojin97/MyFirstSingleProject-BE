import express from 'express';
import { getMyPage } from '../controllers/userContorller';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/activity', authenticateToken, getMyPage);

export default router;
