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

  // 댓글 상세 조회 (비밀번호/삭제여부 포함)
  findById: async (id) => {
    return await prisma.comment.findUnique({
      where: { id: Number(id) },
    });
  },

  // 댓글 Soft Delete 및 게시글 댓글 수 감소 (트랜잭션)
  removeWithTransaction: async (commentId, postId) => {
    return await prisma.$transaction(async (tx) => {
      // 1. 댓글 상태 업데이트
      await tx.comment.update({
        where: { id: commentId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      // 2. 게시글 댓글 수 감소
      await tx.post.update({
        where: { id: postId },
        data: {
          commentCount: { decrement: 1 },
        },
      });
    });
  },

  // 게시글 ID로 모든 댓글 조회
  findByPostId: async (postId) => {
    return await prisma.comment.findMany({
      where: { postId: Number(postId), isDeleted: false },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        content: true,
        nickname: true,
        createdAt: true,
        authorId: true,
        // 댓글 작성자의 소셜 로그인 여부도 확인하면 좋음
        author: { select: { provider: true } },
      },
    });
  },
};
