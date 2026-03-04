import * as userRepository from '../repository/userRepository.js';

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
export const getMyPosts = async (userId) => {
  const posts = await userRepository.getUserPosts(userId);

  // 날짜 가공 (예: 2026-03-04 형태)
  return posts.map((post) => ({
    ...post,
    createdAt: post.createdAt.toISOString().split('T')[0],
    commentCount: post._count.comments,
  }));
};
