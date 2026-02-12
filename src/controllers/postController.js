import { prisma } from '../lib/prisma.js';
import { findAndCountAll } from '../repository/posts.repository.js';
import {
  deleteSchema,
  postSchema,
  updateSchema,
} from '../schemas/postSchema.js';
import bcrypt from 'bcrypt';

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
  const validation = postSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      message: validation.error.errors[0].message,
    });
  }
  const { title, content, nickname, password } = validation.data;
  try {
    const newPost = await prisma.post.create({
      data: { title, content, nickname, password },
    });
    res.status(201).json(newPost);
  } catch (error) {
    console.error('DB Error:', error);
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

      select: {
        id: true,
        title: true,
        content: true,
        nickname: true,
        view: true, // 조회수도 보여줘야 하니 추가
        createdAt: true,
        comments: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            content: true,
            nickname: true,
            createdAt: true,
            // password: false (댓글 비번도 숨기기)
          },
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
    const postId = Number(id);
    const { password } = req.body;

    console.log(`삭제 요청 발생! ID: ${id}, 입력비번: ${password}`);
    if (isNaN(postId)) {
      return res
        .status(400)
        .json({ message: '유효하지 않은 게시글 ID입니다.' });
    }

    const validation = deleteSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: validation.error.errors[0].message,
      });
    }

    // 1. 해당 게시글이 있는지 먼저 확인
    const post = await prisma.post.findUnique({
      where: { id: postId }, // 반드시 숫자로 변환
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

export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const postId = Number(id);

    // 1. ID 유효성 검사 (가장 먼저!)
    if (isNaN(postId)) {
      return res
        .status(400)
        .json({ message: '유효하지 않은 게시글 ID입니다.' });
    }

    const validation = updateSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: validation.error.errors[0].message,
      });
    }

    // 검증된 데이터 가져오기
    const { title, content, password } = validation.data;

    // 3. 게시글 존재 확인
    const post = await prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      return res.status(404).json({ message: '글을 찾을 수 없습니다.' });
    }

    // 4. 비밀번호 확인 (서버측 최종 검문)
    if (post.password !== password) {
      return res.status(401).json({ message: '비밀번호가 틀렸습니다.' });
    }

    // 5. 실제 수정 업데이트
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        title: title.trim(),
        content: content.trim(),
      },
    });

    res.json(updatedPost);
  } catch (error) {
    console.error('Update Error:', error);
    res.status(500).json({ message: '수정 실패' });
  }
};

// 댓글 작성 API 로직
export const createComment = async (req, res) => {
  try {
    const { postId: paramPostId } = req.params;
    const postId = Number(paramPostId);

    const { nickname, password, content } = req.body; // 프론트에서 보낸 데이터
    // 1. postId가 정상적인 숫자인지 체크
    if (isNaN(postId)) {
      return res.status(400).json({ error: '유효한 게시글 ID가 아닙니다.' });
    }
    // 2. 필수 값 체크 (선택사항이지만 추천)
    if (!nickname || !password || !content) {
      return res
        .status(400)
        .json({ error: '닉네임, 비밀번호, 내용을 모두 입력해주세요.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10); // 비밀번호 암호화

    // DB에 댓글 생성
    const newComment = await prisma.comment.create({
      data: {
        postId,
        nickname,
        password: hashedPassword,
        content,
      },
    });

    res.status(201).json(newComment);
  } catch (error) {
    console.error('댓글 등록 에러:', error);
    res.status(500).json({ error: '댓글 등록 중 서버 에러가 발생했습니다.' });
  }
};

//댓글 삭제 API 로직
export const deleteComment = async (req, res) => {
  const { id } = req.params;
  const commentId = Number(id);
  const { password } = req.body;
  console.log('받은 ID:', id, '받은 비번:', password);

  // 3. ID가 숫자가 아니거나 존재하지 않는지 확인합니다.
  if (isNaN(commentId)) {
    return res.status(400).json({ message: '유효한 댓글 ID가 필요합니다.' });
  }

  // 4. 비밀번호가 입력되었는지(빈 문자열은 아닌지) 확인합니다.
  if (!password || typeof password !== 'string' || password.trim() === '') {
    return res.status(400).json({ message: '비밀번호를 입력해주세요.' });
  }
  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
    }
    //  이미 삭제된 댓글인지 확인 (Soft Delete 중복 방지)
    if (comment.isDeleted) {
      return res.status(400).json({ message: '이미 삭제된 댓글입니다.' });
    }

    const isMatch = await bcrypt.compare(password, comment.password);
    console.log('비밀번호 일치 여부:', isMatch);
    if (!isMatch) {
      return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
    }
    await prisma.comment.update({
      where: { id: commentId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
    res.status(200).json({ message: '댓글이 삭제되었습니다.' });
  } catch (error) {
    console.error('❌ 진짜 에러 원인:', error);
    res
      .status(500)
      .json({ message: '서버 오류가 발생했습니다.', error: error.message });
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
