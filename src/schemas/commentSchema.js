import { z } from 'zod';

export const commentSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(1, '닉네임을 입력해주세요.')
    .max(8, '닉네임은 최대 8자입니다.')
    .optional()
    .or(z.literal('')),
  password: z
    .string()
    .min(4, '비밀번호는 4자 이상이어야 합니다.')
    .max(20, '비밀번호는 최대 8자까지입니다.') // bcrypt 암호화 전 입력값 기준
    .optional()
    .or(z.literal('')),
  content: z
    .string()
    .trim()
    .min(1, '내용을 입력해주세요.')
    .max(300, '댓글은 최대 300자까지 작성 가능합니다.'), // 본문 길이 제한 추가
});

// 삭제 시에는 비밀번호만 검증 (비회원용)
export const deleteCommentSchema = z.object({
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
});
