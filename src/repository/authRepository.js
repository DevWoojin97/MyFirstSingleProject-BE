import { prisma } from '../lib/prisma.js';

export const authRepository = {
  // 1. 서비스에서 호출하는 이름과 동일하게 맞춤 (User 생략)
  findByEmailAndProvider: async (email, provider) => {
    return await prisma.user.findFirst({
      where: {
        email,
        provider,
      },
    });
  },

  // 중복 검사용 (이메일 또는 닉네임으로 유저 찾기)
  findByEmailOrNickname: async (email, nickname) => {
    return await prisma.user.findFirst({
      where: {
        OR: [{ email }, { nickname }],
      },
    });
  },

  // 유저 정보 상세 조회 (getMe용)
  findById: async (id) => {
    return await prisma.user.findUnique({
      where: { id },
      select: { id: true, nickname: true, email: true, role: true },
    });
  },

  // 2. 이 함수도 객체 안으로 넣어 관리하는 것이 3계층 구조에 유리합니다.
  createUser: async (userData) => {
    return await prisma.user.create({
      data: userData,
    });
  },
};
