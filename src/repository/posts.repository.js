import { prisma } from '../lib/prisma.js';

/**
 * 게시판 목록 조회 (검색, 페이지네이션, 정렬 포함)
 */
export async function findAndCountAll({ page, limit, sort, order, search }) {
  // 1. 검색 조건 (Where)
  const where = search
    ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
          { nickname: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  // 2. 페이지네이션 수치 계산
  const pageNum = Number(page) || 1;
  const take = Number(limit) || 10;
  const skip = (pageNum - 1) * take;

  // 3. 정렬 값 방어 처리
  const sortBy = sort || 'createdAt';
  const sortOrder = order || 'desc';

  try {
    // 4. 데이터와 전체 개수를 동시에 조회 (Promise.all)
    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
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
        },
      }),
      prisma.post.count({ where }),
    ]);

    // 5. 결과 반환
    return {
      posts,
      totalCount,
      totalPages: Math.ceil(totalCount / take),
      currentPage: pageNum,
    };
  } catch (error) {
    console.error('Database Query Error:', error);
    throw error;
  }
}

export async function findPostById(id) {
  try {
    return await prisma.post.findUnique({
      where: { id: Number(id) },
      include: {
        comments: {
          orderBy: { createdAt: 'asc' }, // 댓글도 시간순으로 정렬해서 가져옴
        },
        _count: {
          select: { comments: true }, // 댓글이 총 몇 개인지도 계산
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
  });
} // 2. 댓글 작성
export async function create({ postId, content, nickname, password }) {
  return await prisma.comment.create({
    data: {
      postId: Number(postId),
      content,
      nickname,
      password,
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
