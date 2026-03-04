import { prisma } from '../lib/prisma.js';
import * as postService from '../services/postService.js';
import { findPostById } from '../repository/posts.repository.js';
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

    //2.비즈니스 로직은 서비스에게 호출
    const result = await postService.getPosts(req.query);

    // 3. 성공 응답 (데이터와 페이지네이션 메타 정보 포함)
    res.status(200).json(result);
  } catch (error) {
    console.error('getPosts Controller Error:', error);
    res.status(500).json({ message: '게시글 조회 중 오류가 발생했습니다.' });
  }
};
// 게시글 생성
export const createPost = async (req, res) => {
  // 데이터 유효성 검사
  const validation = postSchema.safeParse(req.body);
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
    // 공통 데이터 설정
    const postData = {
      title,
      content,
      hasImage,
      nickname: nickname || null,
      password: password || null,
    };

    // 💡 분기 처리 핵심!
    if (req.user) {
      // [회원일 때] : 토큰에서 나온 ID를 authorId에 연결
      postData.authorId = req.user.userId;
      // 회원은 익명 닉네임/비번이 필요 없으므로 비워두거나 회원 닉네임을 넣음
      postData.nickname = req.user.nickname || '회원';
      postData.password = ''; // 회원 글은 비번 필요 없음 (회원 정보로 삭제하니까)
    } else {
      // [익명일 때] : 프론트에서 보낸 닉네임과 비번 저장
      postData.nickname = nickname;
      postData.password = password;
      // authorId는 Prisma 스키마에서 Int? (Optional)여야 합니다.
    }

    //DB에 저장할 때 hasImage 필드도 포함
    //핵심 로직 : 로그인 유저인가? 익명 유저인가?
    const newPost = await prisma.post.create({
      data: postData,
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

    if (isNaN(postId)) {
      return res.status(400).json({ message: '유효한 ID가 아닙니다.' });
    }

    // 1. 💡 직접 prisma 쓰지 말고, 공들여 만든 서비스 함수를 호출하세요!
    const post = await findPostById(postId);

    if (!post) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }

    // 2. 조회수 증가는 그대로 둡니다.
    await prisma.post.update({
      where: { id: postId },
      data: { view: { increment: 1 } },
    });

    // 3. 서비스 함수가 리턴한 post에는 이미 authorId가 포함되어 있습니다.
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

    if (isNaN(postId)) {
      return res
        .status(400)
        .json({ message: '유효하지 않은 게시글 ID입니다.' });
    }

    // 1. 게시글 조회
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({ message: '존재하지 않는 게시글입니다.' });
    }

    // 2. 권한 검증 (스키마 필드명 authorId 사용)
    if (post.authorId) {
      // 회원이 쓴 글인 경우
      // 미들웨어(req.user)의 ID와 DB의 authorId를 비교
      const loggedInUserId = req.user?.id || req.user?.userId;

      // String으로 변환하여 안전하게 비교
      if (!loggedInUserId || String(loggedInUserId) !== String(post.authorId)) {
        return res
          .status(403)
          .json({ message: '본인의 글만 삭제할 수 있습니다.' });
      }
    } else {
      // 익명 사용자가 쓴 글인 경우
      const validation = deleteSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: '비밀번호를 입력해주세요.' });
      }
      if (post.password !== password) {
        return res.status(401).json({ message: '비밀번호가 틀렸습니다.' });
      }
    }

    // 3. 실제 삭제
    await prisma.post.delete({ where: { id: postId } });
    res.json({ message: '성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('Delete Error:', error);
    res.status(500).json({ message: '서버 오류로 삭제 실패' });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const postId = Number(id);

    // 1. ID 유효성 검사
    if (isNaN(postId)) {
      return res
        .status(400)
        .json({ message: '유효하지 않은 게시글 ID입니다.' });
    }

    // 2. 스키마 검증 (Zod)
    const validation = updateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: validation.error.errors[0].message,
      });
    }

    // 검증된 데이터 추출
    const { title, content, password } = validation.data;
    const hasImage = content.includes('<img');

    // 3. 게시글 존재 확인
    const post = await prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      return res.status(404).json({ message: '글을 찾을 수 없습니다.' });
    }

    // 4. 권한 검증 (회원 vs 비회원)
    if (post.authorId) {
      // [회원 게시글]
      const loggedInUserId = req.user?.id || req.user?.userId;

      // 비교 시 String으로 형변환하여 안전하게 체크 (post.userId -> post.authorId로 수정)
      if (!loggedInUserId || String(loggedInUserId) !== String(post.authorId)) {
        return res
          .status(403)
          .json({ message: '본인의 글만 수정할 수 있습니다.' });
      }
      // 회원은 비밀번호 검사 없이 통과
    } else {
      // [익명 게시글] 비밀번호 대조
      if (post.password !== password) {
        return res.status(401).json({ message: '비밀번호가 틀렸습니다.' });
      }
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
