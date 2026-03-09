import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { authRepository } from '../repository/authRepository.js';
import bcrypt from 'bcrypt';

// 회원가입 로직
export const signup = async ({ email, password, nickname }) => {
  // 1. 중복 확인
  const existingUser = await authRepository.findByEmailOrNickname(
    email,
    nickname,
  );
  if (existingUser) {
    throw new Error('ALREADY_EXISTS');
  }

  // 2. 비밀번호 암호화
  const hashedPassword = await bcrypt.hash(password, 10);

  // 3. DB 저장
  const newUser = await authRepository.createUser({
    email,
    password: hashedPassword,
    nickname,
    provider: 'LOCAL',
  });

  return newUser;
};

export const socialLogin = async (userProfile) => {
  // 1. 기존 유저인지 확인 (이메일 + 프로바이더 조합)
  let user = await authRepository.findByEmailAndProvider(
    userProfile.email,
    userProfile.provider,
  );

  // 2. 신규 유저라면 회원가입 진행
  if (!user) {
    user = await authRepository.createUser(userProfile);
  }
  // 3. 서비스 이용을 위한 JWT 토큰 발급
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      nickname: user.nickname,
      role: user.role,
      provider: user.provider,
    },
    env.JWT_SECRET, // 👈 .env에 추가해야 함!
    { expiresIn: '1d' },
  );

  return { user, token };
};

export const localLogin = async (email, password) => {
  // 1. 유저 존재 확인 (로컬 유저이므로 provider 생략하거나 findByEmailOrNickname 재사용 가능)
  const user = await authRepository.findByEmailOrNickname(email, '');
  // 1. 유저 존재 확인
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }
  // 2. 비밀번호 비교 로직 추가
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('INVALID_PASSWORD');
  }

  // 3. 로그인 성공! JWT 토큰 발행
  // 유저 ID와 권한(Role)을 토큰 속에 숨겨둡니다.
  const token = jwt.sign(
    {
      userId: user.id,
      nickname: user.nickname,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: '1d' },
  );
  return { user, token };
};

export const getUserProfile = async (userId) => {
  const user = await authRepository.findById(userId);

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  return user;
};
