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
