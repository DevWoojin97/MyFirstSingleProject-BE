import express from 'express';
import {
  getMyComments,
  getMyPage,
  getMyPosts,
} from '../controllers/userContorller.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/activity', authenticateToken, getMyPage);
router.get('/my-posts', authenticateToken, getMyPosts); // 👈 새로 추가!
router.get('/my-comments', authenticateToken, getMyComments);
export default router;
