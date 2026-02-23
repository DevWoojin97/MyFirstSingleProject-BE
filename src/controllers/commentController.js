import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcrypt';

// 댓글 작성 API 로직
export const createComment = async (req, res) => {
  try {
    const { postId: paramPostId } = req.params;
    const postId = Number(paramPostId);

    const { nickname, password, content } = req.body; // 프론트에서 보낸 데이터
    // 1. postId가 정상적인 숫자인지 체크
    if (isNaN(postId)) {
      return res.status(400).json({ message: '유효한 게시글 ID가 아닙니다.' });
    }
    // 2. 필수 값 체크 (선택사항이지만 추천)
    if (!nickname || !password || !content) {
      return res
        .status(400)
        .json({ message: '닉네임, 비밀번호, 내용을 모두 입력해주세요.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10); // 비밀번호 암호화

    const result = await prisma.$transaction(async (tx) => {
      // DB에 댓글 생성
      const newComment = await tx.comment.create({
        data: {
          postId,
          nickname,
          password: hashedPassword,
          content,
        },
      });

      await tx.post.update({
        where: { id: postId },
        data: {
          commentCount: {
            increment: 1,
          },
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
