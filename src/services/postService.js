import * as postRepository from '../repository/posts.repository.js';

export const getPosts = async (query) => {
  // 1. 데이터 가공 및 계산
  const page = Number(query.page) || 1;
  const take = Number(query.limit) || 15;

  const skip = (page - 1) * take;
  const sort = query.sort || 'createdAt';
  const order = query.order || 'desc';
  const search = query.search || '';

  // 2. 검색 조건 (Where)
  const where = search
    ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
          { nickname: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};
  // 3. 정렬 조건 생성
  const orderBy = { [sort || 'createdAt']: order || 'desc' };
  // 4. 레포지토리 호출
  const { posts, totalCount } = await postRepository.findAndCountAll({
    where,
    orderBy,
    take,
    skip,
  });

  // 5. 최종 결과 조립 (반환 형식 결정)
  return {
    posts,
    totalCount,
    totalPages: Math.ceil(totalCount / take),
    currentPage: page,
  };
};
