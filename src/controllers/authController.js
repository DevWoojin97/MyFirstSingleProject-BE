import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcrypt';
import * as authService from '../services/authService.js';

//회원가입 로직
export const signup = async (req, res) => {
  try {
    const { email, password, nickname } = req.body;

    // 1.필수 입력값 확인
    if (!email || !password || !nickname) {
      return res.status(400).json({ message: '모든 필드를 입력해 주세요.' });
    }

    const newUser = await authService.signup({ email, password, nickname });

    res.status(201).json({
      message: '회원가입이 성공적으로 완료되었습니다!',
      userId: newUser.id,
    });
  } catch (error) {
    // 💡 에러 분기 처리 추가
    if (error.message === 'ALREADY_EXISTS') {
      // 서비스에서 throw new Error('ALREADY_EXISTS')를 던졌을 때 처리
      return res.status(400).json({
        message: '이미 사용 중인 이메일 또는 닉네임입니다.',
      });
    }

    // 그 외 예상치 못한 에러 (DB 연결 실패 등)
    console.error('Signup Controller Error:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
};

//로그인 로직
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 서비스 호출
    const { user, token } = await authService.localLogin(email, password);

    res.status(200).json({
      message: '로그인 성공!',
      token, // 프론트에게 입장권 넘김
      user: {
        id: user.id,
        nickname: user.nickname,
        role: user.role,
      },
    });
  } catch (error) {
    // 서비스에서 던진 에러 메시지에 따른 분기 처리
    if (
      error.message === 'USER_NOT_FOUND' ||
      error.message === 'INVALID_PASSWORD'
    ) {
      return res
        .status(401)
        .json({ message: '이메일 또는 비밀번호가 일치하지 않습니다.' });
    }
    console.error('Login Error:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다' });
  }
};

export const getMe = async (req, res) => {
  try {
    // 1. 미들웨어에서 뽑아준 ID 추출
    const userId = req.user.userId || req.user.id;

    // 2. 서비스 호출 (직접 prisma 조회 X)
    const user = await authService.getUserProfile(userId);

    // 3. 응답
    res.json(user);
  } catch (error) {
    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ message: '유저를 찾을 수 없습니다.' });
    }
    console.error('getMe Error:', error);
    res.status(500).json({ message: '유저 정보 로드 실패' });
  }
};
