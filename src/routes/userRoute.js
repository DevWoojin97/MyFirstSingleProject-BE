import express from 'express';
import { getMyPage, getMyPosts } from '../controllers/userContorller.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/activity', authenticateToken, getMyPage);
router.get('/my-posts', authenticateToken, getMyPosts); // 👈 새로 추가!
export default router;
