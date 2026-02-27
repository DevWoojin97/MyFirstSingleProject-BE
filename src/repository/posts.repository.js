import { prisma } from '../lib/prisma.js';

/**
 * 게시판 목록 조회 (검색, 페이지네이션, 정렬 포함)
 */
export async function findAndCountAll({ where, orderBy, take, skip }) {
  try {
    // 4. 데이터와 전체 개수를 동시에 조회 (Promise.all)
    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy,
        take,
        skip,
        select: {
          id: true,
          title: true,
          nickname: true,
          hasImage: true, // 이미지 아이콘 표시용
          commentCount: true, // 댓글수 표시용
          view: true,
          createdAt: true,
          authorId: true,
        },
      }),
      prisma.post.count({ where }),
    ]);
    return { posts, totalCount };
  } catch (error) {
    console.error('Database Query Error:', error);
    throw error;
  }
}

export async function findPostById(id) {
  try {
    return await prisma.post.findUnique({
      where: { id: Number(id) },
      // select를 사용해 authorId를 포함한 필요한 모든 필드를 명시합니다.
      select: {
        id: true,
        title: true,
        content: true,
        nickname: true,
        view: true,
        createdAt: true,
        authorId: true, // 👈 프론트에서 '내 글' 판별을 위해 필수!
        comments: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            content: true,
            nickname: true,
            createdAt: true,
            authorId: true,
          },
        },
        _count: {
          select: { comments: true },
        },
      },
    });
  } catch (error) {
    console.error('Find Post Error:', error);
    throw error;
  }
}

// 1. 특정 게시글의 모든 댓글 조회
export async function findByPostId(postId) {
  return await prisma.comment.findMany({
    where: { postId: Number(postId) },
    orderBy: { createdAt: 'asc' }, // 댓글은 보통 등록순(오래된순)
    select: {
      id: true,
      content: true,
      nickname: true,
      createdAt: true,
      authorId: true, // 👈 여기서도 꼭 확인!
    },
  });
}

// 2. 댓글 작성
export async function create({
  postId,
  content,
  nickname,
  password,
  authorId,
}) {
  return await prisma.comment.create({
    data: {
      postId: Number(postId),
      content,
      nickname,
      password,
      authorId: authorId ? Number(authorId) : null,
    },
  });
} // 3. 댓글 삭제 (비밀번호 확인용으로 id 조회 먼저 필요)
export async function findById(id) {
  return await prisma.comment.findUnique({
    where: { id: Number(id) },
  });
}

export async function remove(id) {
  return await prisma.comment.delete({
    where: { id: Number(id) },
  });
}
