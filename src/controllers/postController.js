import { prisma } from '../lib/prisma.js';
import { findAndCountAll } from '../repository/posts.repository.js';
import {
  deleteSchema,
  postSchema,
  updateSchema,
} from '../schemas/postSchema.js';

// 전체 게시글 조회
export const getPosts = async (req, res) => {
  try {
    // 1. 클라이언트로부터 쿼리 파라미터 추출
    console.log('--- 요청 들어옴 ---');
    console.log('쿼리 파라미터:', req.query);
    // 1. 숫자 형변환 추가 (404/500 에러의 주범 예방)
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const sort = req.query.sort || 'createdAt';
    const order = req.query.order || 'desc';
    const search = req.query.search || '';

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
    res.status(500).json({ message: '게시글 조회 중 오류가 발생했습니다.' });
  }
};
// 게시글 생성
export const createPost = async (req, res) => {
  const validation = postSchema.safeParse(req.body);

  // 데이터 유효성 검사
  if (!validation.success) {
    return res.status(400).json({
      message: validation.error.errors[0].message,
    });
  }
  // 검증된 데이터 꺼내기
  const { title, content, nickname, password } = validation.data;

  // content를 확인해서 이미지 포함 여부 결정 (여기서 직접 생성)
  const hasImage = content.includes('<img');
  try {
    //DB에 저장할 때 hasImage 필드도 포함
    const newPost = await prisma.post.create({
      data: { title, content, nickname, password, hasImage },
    });
    res.status(201).json(newPost);
  } catch (error) {
    console.error('DB Error:', error);
    res.status(500).json({ message: '게시글 작성 실패' });
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
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
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
    res.status(500).json({ message: '게시글 상세 조회 실패' });
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
      const errorMessage =
        validation.error?.errors?.[0]?.message ||
        '비밀번호는 최소 4자리에서 최대 8자리입니다.';
      return res.status(400).json({
        message: errorMessage,
      });
    }

    // 1. 해당 게시글이 있는지 먼저 확인
    const post = await prisma.post.findUnique({
      where: { id: postId }, // 반드시 숫자로 변환
    });

    if (!post) {
      console.log('에러: 해당 ID의 게시글을 찾을 수 없음');
      return res.status(404).json({ message: '존재하지 않는 게시글입니다.' });
    }

    // 2. 비밀번호 비교
    if (post.password !== password) {
      console.log(
        `비번 불일치! DB비번: ${post.password}, 입력비번: ${password}`,
      );
      return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
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
    res.status(500).json({ message: '서버 내부 오류로 삭제 실패' });
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

    const hasImage = content.includes('<img');

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
        hasImage,
      },
    });

    res.json(updatedPost);
  } catch (error) {
    console.error('Update Error:', error);
    res.status(500).json({ message: '수정 실패' });
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
