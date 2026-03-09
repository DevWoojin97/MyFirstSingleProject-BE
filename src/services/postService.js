import * as postRepository from '../repository/postsRepository.js';
import bcrypt from 'bcrypt';

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

export const getPostDetail = async (postId) => {
  // 1. 게시글 데이터 가져오기 (Repository 호출)
  const post = await postRepository.findPostById(postId);

  // 2. 게시글이 존재할 때만 조회수 증가 (비즈니스 로직)
  if (post) {
    await postRepository.incrementView(postId);
  }

  return post;
};

export const deletePost = async (postId, password, user) => {
  // 1. 데이터 조회 (password 필드가 포함되어야 함)
  const post = await postRepository.findPostForDelete(postId);

  if (!post) {
    throw new Error('POST_NOT_FOUND');
  }

  // 2. 권한 검증
  if (post.authorId) {
    // [회원글]
    const loggedInUserId = user?.userId || user?.id;
    if (!loggedInUserId || String(loggedInUserId) !== String(post.authorId)) {
      throw new Error('FORBIDDEN');
    }
  } else {
    // [비회원글]
    if (!password) {
      throw new Error('INVALID_PASSWORD');
    }

    // DB의 비밀번호와 사용자가 입력한 비밀번호 비교
    // 만약 DB에 비번을 평문으로 저장했다면 post.password !== password 사용
    const isMatch = await bcrypt.compare(password, post.password);
    if (!isMatch) {
      throw new Error('INVALID_PASSWORD');
    }
  }

  // 3. 실제 삭제
  return await postRepository.removePost(postId);
};
