import express from 'express';
import { login, signup } from '../controllers/authController.js';

const router = express.Router();

// 사용자가 [POST] /api/auth/signup 으로 요청을 보내면 signup 함수를 실행해라!
router.post('/signup', signup);
router.post('/login', login);
export default router;
