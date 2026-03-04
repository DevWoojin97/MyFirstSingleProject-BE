import * as userRepository from '../repositories/user.repository.js';

export const getMyPageData = async (userId) => {
  const user = await userRepository.getUserActivityById(userId);

  if (!user) {
    throw new Error('사용자를 찾을 수 없습니다.');
  }

  return {
    profile: {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      profileImage: user.profileImage,
      role: user.role,
      provider: user.provider,
    },
    stats: {
      postCount: user._count.posts,
      commentCount: user._count.comments,
    },
  };
};
