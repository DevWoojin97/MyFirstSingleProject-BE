import express from 'express';
import {
  getPosts,
  createPost,
  getPost,
  deletePost,
  updatePost,
  createComment,
  verifyPassword,
  deleteComment,
} from '../controllers/postController.js';

const router = express.Router();

router.get('/', getPosts); // GET /api/posts
router.post('/', createPost); // POST /api/posts
router.get('/:id', getPost);
router.delete('/:id', deletePost);
router.patch('/:id', updatePost);
router.post('/:postId/comments', createComment); // 댓글 생성
router.patch('/:comments/:id', deleteComment); // 댓글 삭제
router.post('/:id/verify', verifyPassword); // 비밀번호 검증 모달
export default router;
