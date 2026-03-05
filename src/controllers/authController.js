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

    // 2. 이메일 또는 닉네임 중복 확인
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { nickname }],
      },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: '이미 사용 중인 이메일 또는 닉네임입니다.' });
    }

    // 3. 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. DB 저장(Role은 스키마 설정에 따라 자동으로 'USER' 가 됨)
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nickname,
        provider: 'LOCAL',
      },
    });

    res.status(201).json({
      message: '회원가입이 성공적으로 완료되었습니다!',
      userId: newUser.id,
    });
  } catch (error) {
    console.error('Signup Error:', error);
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
    // authenticateToken 미들웨어를 거치면 req.user에 유저 정보가 들어있음
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId || req.user.id },
      select: { id: true, nickname: true, email: true }, // 비번 제외
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: '유저 정보 로드 실패' });
  }
};
