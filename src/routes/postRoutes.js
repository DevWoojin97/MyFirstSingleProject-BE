import express from 'express';
import {
  getPosts,
  createPost,
  getPost,
  deletePost,
  updatePost,
} from '../controllers/postController.js';

const router = express.Router();

router.get('/', getPosts); // GET /api/posts
router.post('/', createPost); // POST /api/posts
router.get('/:id', getPost);
router.delete('/:id', deletePost);
router.patch('/:id', updatePost);
export default router;
