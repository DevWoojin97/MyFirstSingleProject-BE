import express from 'express';
import { getMe, login, signup } from '../controllers/authController.js';
import passport from 'passport';
import * as authService from '../services/auth.service.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
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
  passport.authenticate('google', {
    failureRedirect: '/login',
    session: false,
  }),
  async (req, res) => {
    // 1. Passport가 전달해준 정제된 프로필(req.user)을 서비스에 전달
    // (여기서 req.user는 Provider가 가공한 데이터입니다)
    const result = await authService.socialLogin(req.user);

    // 2. 서비스가 구워준 토큰을 들고 프론트로 리다이렉트
    res.redirect(
      `${process.env.FRONTEND_URL}/login-success?token=${result.token}`,
    );
  },
);

// 사용자가 [POST] /api/auth/signup 으로 요청을 보내면 signup 함수를 실행해라!
router.post('/signup', signup);
router.post('/login', login);
router.get('/me', authenticateToken, getMe);
export default router;
