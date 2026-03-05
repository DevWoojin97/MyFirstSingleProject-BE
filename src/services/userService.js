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

  const totalPages = Math.ceil(totalCount / limit);
  // 3. 메인 페이지 getPosts 형식처럼 깔끔하게 묶어서 리턴합니다.
  return {
    posts: formattedPosts,
    totalCount,
    totalPages,
    currentPage: page,
  };
};

export const getMyComments = async (userId, page, limit) => {
  // 1. 레포지토리에서 Raw Data를 받아옴
  const { comments, totalCount } = await userRepository.getUserComments(
    userId,
    page,
    limit,
  );

  // 2. 비즈니스 요구사항에 맞게 데이터 가공 (평탄화)
  const formattedComments = comments.map((comment) => ({
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt.toISOString().split('T')[0],
    postId: comment.post?.id,
    // 여기서 가공 로직 처리!
    postTitle: comment.post?.title || '삭제된 게시글',
  }));

  const totalPages = Math.ceil(totalCount / limit);

  return {
    comments: formattedComments,
    totalPages,
    totalCount,
  };
};
