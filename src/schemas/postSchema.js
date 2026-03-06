import { z } from 'zod';

export const postSchema = z.object({
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
    .max(8, '8자 이하로 해주세요.')
    .optional()
    .or(z.literal('')),
  title: z
    .string()
    .trim()
    .min(1, '제목을 입력해주세요.')
    .max(50, '제목은 최대 50자까지입니다.'),
  content: z.string().trim().min(1, '내용을 입력해주세요.'),
});

export const updateSchema = postSchema.omit({ nickname: true });

export const deleteSchema = postSchema.pick({ password: true });
