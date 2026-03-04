import { prisma } from '../lib/prisma.js';

// 마이페이지 목록 조회
export const getUserActivityById = async (userId) => {
  // 1. 먼저 데이터를 user 변수에 담습니다 (return을 바로 하지 않음)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      nickname: true,
      profileImage: true,
      role: true,
      provider: true,
      _count: {
        select: {
          posts: true, // 하드 삭제되므로 바로 카운트
        },
      },
      comments: {
        where: { isDeleted: false }, // 소프트 삭제 필터링
        select: { id: true },
      },
    },
  });

  // 2. 유저가 없는 경우 예외 처리
  if (!user) return null;

  // 3. 데이터를 가공하여 최종 리턴합니다.
  return {
    ...user,
    _count: {
      posts: user._count.posts,
      comments: user.comments.length, // 필터링된 댓글 리스트의 길이를 개수로 치환
    },
    // 가공에 쓴 원본 comments 배열은 프론트에 보낼 필요 없으니 제외 (선택 사항)
    comments: undefined,
  };
};

// 내 작성글 목록 가져오기
export const getUserPosts = async (userId) => {
  return await prisma.post.findMany({
    where: {
      authorId: userId, // 혹은 userId 필드명 확인
      // 게시글은 하드삭제라 하셨으니 isDeleted 조건은 생략
    },
    orderBy: {
      createdAt: 'desc', // 최신순 정렬
    },
    select: {
      id: true,
      title: true,
      createdAt: true,
      view: true,
      // 필요한 정보 추가 (조회수 등)
      _count: {
        select: { comments: { where: { isDeleted: false } } },
      },
    },
  });
};
