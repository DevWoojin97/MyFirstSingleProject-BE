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
          author: {
            select: { provider: true },
          },
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
        author: {
          select: {
            provider: true, // 👈 유저의 가입 경로(GOOGLE, LOCAL)를 가져옵니다.
          },
        },
        comments: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            content: true,
            nickname: true,
            createdAt: true,
            authorId: true,
            author: { select: { provider: true } },
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
export async function incrementView(id) {
  try {
    return await prisma.post.update({
      where: { id },
      data: { view: { increment: 1 } },
    });
  } catch (error) {
    console.error('Increment View Error:', error);
    throw error;
  }
}

// 삭제를 위해 모든 필드(비밀번호 포함)를 가져오는 전용 함수
export async function findPostForDelete(id) {
  return await prisma.post.findUnique({
    where: { id: Number(id) },
    // select를 쓰지 않거나 password를 명시적으로 포함해야 비교가 가능합니다.
  });
}

// 실제 게시글 삭제
export async function removePost(id) {
  return await prisma.post.delete({
    where: { id: Number(id) },
  });
}

// 게시글 수정
export async function updatePost(id, data) {
  return await prisma.post.update({
    where: { id: Number(id) },
    data,
  });
}

// 게시글 생성
export async function createPost(data) {
  return await prisma.post.create({
    data,
  });
}
