import { prisma } from '../lib/prisma.js';
import { findAndCountAll } from '../repository/posts.repository.js';

// 전체 게시글 조회
export const getPosts = async (req, res) => {
  try {
    // 1. 클라이언트로부터 쿼리 파라미터 추출
    console.log('--- 요청 들어옴 ---');
    console.log('쿼리 파라미터:', req.query);
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
      search = '',
    } = req.query;

    // 2. 리포지토리 함수 호출
    const result = await findAndCountAll({
      page,
      limit,
      sort,
      order,
      search,
    });

    // 3. 성공 응답 (데이터와 페이지네이션 메타 정보 포함)
    res.status(200).json(result);
  } catch (error) {
    console.error('getPosts Error:', error);
    res.status(500).json({ error: '게시글 조회 중 오류가 발생했습니다.' });
  }
};
// 게시글 생성
export const createPost = async (req, res) => {
  try {
    const { title, content, nickname, password } = req.body;
    const newPost = await prisma.post.create({
      data: { title, content, nickname, password },
    });
    res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json({ error: '게시글 작성 실패' });
  }
};

export const getPost = async (req, res) => {
  try {
    const { id } = req.params; // URL에서 전달된 id (예: /api/posts/1)

    const post = await prisma.post.findUnique({
      where: {
        id: Number(id), // 👈 URL의 문자열 id를 숫자로 변환!
      },
    });

    if (!post) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    }

    // (보너스) 조회수 1 증가시키기
    await prisma.post.update({
      where: { id: Number(id) },
      data: { view: { increment: 1 } },
    });

    res.json(post);
  } catch (error) {
    console.error('상세 조회 에러:', error);
    res.status(500).json({ error: '게시글 상세 조회 실패' });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    console.log(`삭제 요청 발생! ID: ${id}, 입력비번: ${password}`);

    // 1. 해당 게시글이 있는지 먼저 확인
    const post = await prisma.post.findUnique({
      where: { id: Number(id) }, // 반드시 숫자로 변환
    });

    if (!post) {
      console.log('에러: 해당 ID의 게시글을 찾을 수 없음');
      return res.status(404).json({ error: '존재하지 않는 게시글입니다.' });
    }

    // 2. 비밀번호 비교
    if (post.password !== password) {
      console.log(
        `비번 불일치! DB비번: ${post.password}, 입력비번: ${password}`,
      );
      return res.status(401).json({ error: '비밀번호가 일치하지 않습니다.' });
    }

    // 3. 실제 삭제 수행
    await prisma.post.delete({
      where: { id: Number(id) },
    });

    console.log('삭제 성공!');
    res.json({ message: '성공적으로 삭제되었습니다.' });
  } catch (error) {
    // 터미널에 에러의 진짜 원인을 찍어줍니다.
    console.error('백엔드 삭제 로직 에러 상세:', error);
    res.status(500).json({ error: '서버 내부 오류로 삭제 실패' });
  }
};

//4. 게시글 수정 로직

export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, password } = req.body;

    const post = await prisma.post.findUnique({ where: { id: Number(id) } });

    if (!post) return res.status(404).json({ error: '글을 찾을 수 없습니다.' });

    if (post.password !== password) {
      return res.status(401).json({ error: '비밀번호가 틀렸습니다.' });
    }

    const updatedPost = await prisma.post.update({
      where: { id: Number(id) },
      data: { title, content },
    });
    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ error: '수정 실패' });
  }
};
