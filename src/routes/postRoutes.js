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

// 📍 /api/posts/ping 으로 요청을 보낼 경우
router.get('/ping', (req, res) => {
  res.send('ok');
});
// --- 게시글 관련 ---
router.get('/', getPosts); // GET /api/posts
router.post('/', authenticateToken, createPost); // POST /api/posts
router.get('/:id', getPost);
router.delete('/:id', authenticateToken, deletePost);
router.patch('/:id', authenticateToken, updatePost);
router.post('/:id/verify', verifyPassword); // 비밀번호 검증 모달

// --- 이미지 업로드 관련 ---
// 1. upload.single('image') 미들웨어가 먼저 파일을 저장하고
// 2. 그 다음 uploadImage 컨트롤러가 응답을 보냅니다.
router.post('/upload-image', upload.single('image'), uploadImage);
export default router;
