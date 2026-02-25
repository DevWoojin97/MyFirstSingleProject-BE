import express from 'express';
import {
  createComment,
  deleteComment,
} from '../controllers/commentController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
const router = express.Router();
// --- 댓글 관련 ---
router.post('/:postId/comments', authenticateToken, createComment); // 댓글 생성
router.patch('/:comments/:id', authenticateToken, deleteComment); // 댓글 삭제

export default router;
