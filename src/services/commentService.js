import bcrypt from 'bcrypt';
import { commentRepository } from '../repository/commentRepository.js';

export const createComment = async (postId, commentBody, user) => {
  const { nickname, password, content } = commentBody;

  let commentData = {
    postId: Number(postId),
    content,
  };

  // 1. 회원/비회원 비즈니스 로직 분기
  if (user) {
    // [회원일 때]
    commentData.authorId = user.id || user.userId;
    commentData.nickname = user.nickname || '회원';
    commentData.password = null;
  } else {
    // [비회원(익명)일 때]
    if (!nickname || !password) {
      throw new Error('NICKNAME_PASSWORD_REQUIRED');
    }

    // 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, 10);
    commentData.authorId = null;
    commentData.nickname = nickname;
    commentData.password = hashedPassword;
  }

  // 2. DB 저장 요청 (트랜잭션 포함)
  return await commentRepository.createWithTransaction(commentData);
};

export const deleteComment = async (commentId, password, user) => {
  // 1. 댓글 존재 확인
  const comment = await commentRepository.findById(commentId);

  if (!comment) {
    throw new Error('COMMENT_NOT_FOUND');
  }
  if (comment.isDeleted) {
    throw new Error('ALREADY_DELETED');
  }

  // 2. 권한 검증
  if (comment.authorId) {
    // [회원 댓글]
    const loggedInUserId = user?.id || user?.userId;
    if (
      !loggedInUserId ||
      String(loggedInUserId) !== String(comment.authorId)
    ) {
      throw new Error('FORBIDDEN');
    }
  } else {
    // [비회원 댓글]
    if (!password) {
      throw new Error('PASSWORD_REQUIRED');
    }
    const isMatch = await bcrypt.compare(password, comment.password);
    if (!isMatch) {
      throw new Error('INVALID_PASSWORD');
    }
  }

  // 3. 트랜잭션 실행
  return await commentRepository.removeWithTransaction(
    comment.id,
    comment.postId,
  );
};
