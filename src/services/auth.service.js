import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { authRepository } from '../repository/auth.repository.js';

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
    { expiresIn: '1h' }, // 1시간 동안 유효
  );

  return { user, token };
};
