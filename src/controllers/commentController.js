import { commentSchema } from '../schemas/commentSchema.js';
import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcrypt';

// 댓글 작성 API 로직
export const createComment = async (req, res) => {
  // 1. 데이터 유효성 검사 (Zod)
  const validation = commentSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      message: validation.error.errors[0].message,
    });
  }

  try {
    const { postId: paramPostId } = req.params;
    const postId = Number(paramPostId);
    const { nickname, password, content } = validation.data;
    const user = req.user;

    if (isNaN(postId)) {
      return res.status(400).json({ message: '유효한 게시글 ID가 아닙니다.' });
    }

    // 2. 비회원/회원 데이터 분기 설정
    let commentData = {
      postId,
      content,
    };

    if (user) {
      // [회원일 때]
      commentData.authorId = user.id || user.userId;
      commentData.nickname = user.nickname || '회원';
      commentData.password = null; // 회원은 비밀번호 불필요
    } else {
      // [비회원(익명)일 때]
      if (!nickname || !password) {
        return res
          .status(400)
          .json({ message: '닉네임과 비밀번호를 입력해주세요.' });
      }
      // 비밀번호 암호화
      const hashedPassword = await bcrypt.hash(password, 10);
      commentData.authorId = null;
      commentData.nickname = nickname;
      commentData.password = hashedPassword;
    }

    // 3. 트랜잭션 실행 (댓글 생성 + 카운트 증가)
    const result = await prisma.$transaction(async (tx) => {
      const newComment = await tx.comment.create({
        data: commentData,
      });

      await tx.post.update({
        where: { id: postId },
        data: {
          commentCount: { increment: 1 },
        },
      });

      return newComment;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('댓글 등록 에러:', error);
    res.status(500).json({ message: '댓글 등록 중 서버 에러가 발생했습니다.' });
  }
};

//댓글 삭제 API 로직
export const deleteComment = async (req, res) => {
  const { id } = req.params;
  const commentId = Number(id);
  const { password } = req.body;
  const user = req.user; // 미들웨어에서 넣어준 로그인 유저 정보

  //  ID가 숫자가 아니거나 존재하지 않는지 확인합니다.
  if (isNaN(commentId)) {
    return res.status(400).json({ message: '유효한 댓글 ID가 필요합니다.' });
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

    //권한 검증 (핵심 분기!)
    if (comment.authorId) {
      const loggedInUserId = user?.id || user?.userId;

      if (
        !loggedInUserId ||
        String(loggedInUserId) !== String(comment.authorId)
      ) {
        return res
          .status(403)
          .json({ message: '본인의 댓글만 삭제할 수 있습니다.' });
      }
    } else {
      // ✅ Case B: 비회원 댓글
      // 4. 비밀번호가 입력되었는지(빈 문자열은 아닌지) 확인합니다.
      if (!password || typeof password !== 'string' || password.trim() === '') {
        return res.status(400).json({ message: '비밀번호를 입력해주세요.' });
      }
      // 비밀번호 비교
      const isMatch = await bcrypt.compare(password, comment.password);
      console.log('비밀번호 일치 여부:', isMatch);
      if (!isMatch) {
        return res
          .status(401)
          .json({ message: '비밀번호가 일치하지 않습니다.' });
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.comment.update({
        where: { id: commentId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      // (B) 해당 게시글의 commentCount를 1 감소
      await tx.post.update({
        where: { id: comment.postId },
        data: {
          commentCount: {
            decrement: 1,
          },
        },
      });
    });

    res.status(200).json({ message: '댓글이 삭제되었습니다.' });
  } catch (error) {
    res
      .status(500)
      .json({ message: '서버 오류가 발생했습니다.', error: error.message });
  }
};
