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
export const getMyPosts = async (userId, page, limit = 10) => {
  // 1. 레포지토리에서 객체{ posts, totalCount }를 받아옵니다.
  const { posts, totalCount } = await userRepository.getUserPosts(
    userId,
    page,
    limit,
  );

  // 2. posts 배열 내부의 데이터만 가공합니다.
  const formattedPosts = posts.map((post) => ({
    ...post,
    createdAt: post.createdAt.toISOString().split('T')[0],
    commentCount: post._count.comments,
  }));

  // 3. 메인 페이지 getPosts 형식처럼 깔끔하게 묶어서 리턴합니다.
  return {
    posts: formattedPosts,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,  
  };
};

export const getMyComments = async (userId) => {
  const comments = await userRepository.getUserComments(userId);

  return comments.map((comment) => ({
    id: comment.id,
    content: comment.content,
    postId: comment.postId,
    postTitle: comment.post?.title || '삭제된 게시글입니다.',
    createdAt: comment.createdAt?.toISOString().split('T')[0] || '-',
  }));
};
