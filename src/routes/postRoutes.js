import express from 'express';
import {
  getPosts,
  createPost,
  getPost,
  deletePost,
  updatePost,
  verifyPassword,
} from '../controllers/postController.js';
import { upload } from '../middlewares/multer.js';

import { uploadImage } from '../controllers/imageController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();
// --- 게시글 관련 ---
router.get('/', getPosts); // GET /api/posts
router.post('/', authenticateToken, createPost); // POST /api/posts
router.get('/:id', getPost);
router.delete('/:id', deletePost);
router.patch('/:id', updatePost);
router.post('/:id/verify', verifyPassword); // 비밀번호 검증 모달

// --- 이미지 업로드 관련 ---
// 1. upload.single('image') 미들웨어가 먼저 파일을 저장하고
// 2. 그 다음 uploadImage 컨트롤러가 응답을 보냅니다.
router.post('/upload-image', upload.single('image'), uploadImage);
export default router;
