import { prisma } from '../lib/prisma.js';

export const commentRepository = {
  // 댓글 생성 및 게시글 댓글 수 증가를 트랜잭션으로 처리
  createWithTransaction: async (commentData) => {
    return await prisma.$transaction(async (tx) => {
      // 1. 댓글 생성
      const newComment = await tx.comment.create({
        data: commentData,
      });

      // 2. 게시글 댓글 수 업데이트
      await tx.post.update({
        where: { id: commentData.postId },
        data: {
          commentCount: { increment: 1 },
        },
      });

      return newComment;
    });
  },

  // (참고) 단순히 댓글만 생성할 때 (트랜잭션 미사용 시)
  create: async (data) => {
    return await prisma.comment.create({ data });
  },
};
