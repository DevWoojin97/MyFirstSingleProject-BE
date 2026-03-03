import express from 'express';
import { login, signup } from '../controllers/authController.js';
import passport from 'passport';

const router = express.Router();

// 1. 구글 로그인 시작 (입구)
// 프론트에서 이 주소로 이동하면 구글 로그인 창이 뜹니다.
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }),
);
// 2. 구글 로그인 완료 후 콜백 (출구)
// 구글이 인증을 마치고 유저 정보를 들고 다시 우리 서버로 오는 주소입니다.
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // 인증 성공 시 실행될 로직
    // 여기서 보통 프론트엔드의 메인 페이지로 리다이렉트 시킵니다.
    res.redirect('http://localhost:5173/login-success');
  },
);

// 사용자가 [POST] /api/auth/signup 으로 요청을 보내면 signup 함수를 실행해라!
router.post('/signup', signup);
router.post('/login', login);
export default router;
