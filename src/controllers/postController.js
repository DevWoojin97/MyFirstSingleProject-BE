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
    const { id } = req.params;
    const postId = Number(id);

    // 1. 게시글 찾기 + 댓글들(comments) 같이 불러오기
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        comments: {
          orderBy: { createdAt: 'asc' }, // 댓글은 등록순(오래된순) 정렬
        },
      },
    });

    if (!post) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    }

    // 2. 조회수 1 증가 (업데이트된 정보를 굳이 다시 변수에 담을 필요는 없음)
    await prisma.post.update({
      where: { id: postId },
      data: { view: { increment: 1 } },
    });

    // 3. 이제 post 안에는 comments 배열이 포함되어 있음!
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

// 댓글 작성 컨트롤러
export const createComment = async (req, res) => {
  try {
    const { postId } = req.params; // 라우터에서 :postId로 넘겨준 값
    const { nickname, password, content } = req.body; // 프론트에서 보낸 데이터

    // DB에 댓글 생성
    const newComment = await prisma.comment.create({
      data: {
        postId: Number(postId),
        nickname,
        password,
        content,
      },
    });

    res.status(201).json(newComment);
  } catch (error) {
    console.error('댓글 등록 에러:', error);
    res.status(500).json({ error: '댓글 등록 중 서버 에러가 발생했습니다.' });
  }
};

// 비밀번호 검증 모달 로직
export const verifyPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const post = await prisma.post.findUnique({
      where: { id: Number(id) },
    });
    if (post.password === password) {
      return res.status(200).json({ message: '비밀번호가 일치합니다.' });
    } else {
      return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
    }
  } catch (error) {
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};
