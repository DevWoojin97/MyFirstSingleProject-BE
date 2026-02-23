import express from 'express';
import {
  createComment,
  deleteComment,
} from '../controllers/commentController.js';
const router = express.Router();
// --- 댓글 관련 ---
router.post('/:postId/comments', createComment); // 댓글 생성
router.patch('/:comments/:id', deleteComment); // 댓글 삭제

export default router;
