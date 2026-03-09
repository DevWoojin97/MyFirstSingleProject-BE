import { prisma } from '../lib/prisma.js';
import * as postService from '../services/postService.js';
import bcrypt from 'bcrypt';

import {
  deleteSchema,
  postSchema,
  updateSchema,
} from '../schemas/postSchema.js';

// 전체 게시글 조회
export const getPosts = async (req, res) => {
  try {
    // 1. 클라이언트로부터 쿼리 파라미터 추출
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

  try {
    // 비즈니스 로직은 Service로 위임
    const newPost = await postService.createPost(validation.data, req.user);
    res.status(201).json(newPost);
  } catch (error) {
    console.error('Create Post Error:', error);
    res.status(500).json({ message: '게시글 작성 실패' });
  }
};

export const getPost = async (req, res) => {
  try {
    const { id } = req.params;
    const postId = Number(id);

    // 1. 유효성 검사 (입력값 체크)
    if (isNaN(postId)) {
      return res.status(400).json({ message: '유효한 ID가 아닙니다.' });
    }

    // 2. 비즈니스 로직 호출 (Service 계층)
    const post = await postService.getPostDetail(postId);

    // 3. 결과에 따른 응답 처리
    if (!post) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }

    res.json(post);
  } catch (error) {
    console.error('상세 조회 에러:', error);
    res.status(500).json({ message: '게시글 상세 조회 실패' });
  }
};

//게시글 삭제
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

    await postService.deletePost(postId, password, req.user);

    res.json({ message: '성공적으로 삭제되었습니다.' });
  } catch (error) {
    // 서비스에서 던진 에러 메시지에 따른 분기 처리
    if (error.message === 'POST_NOT_FOUND') {
      return res.status(404).json({ message: '존재하지 않는 게시글입니다.' });
    }
    if (error.message === 'FORBIDDEN') {
      return res
        .status(403)
        .json({ message: '본인의 글만 삭제할 수 있습니다.' });
    }
    if (error.message === 'INVALID_PASSWORD') {
      return res.status(401).json({ message: '비밀번호가 틀렸습니다.' });
    }

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

    // 3. 서비스 호출
    const updatedPost = await postService.updatePost(
      postId,
      validation.data,
      req.user,
    );

    res.json(updatedPost);
  } catch (error) {
    if (error.message === 'POST_NOT_FOUND') {
      return res.status(404).json({ message: '글을 찾을 수 없습니다.' });
    } else if (error.message === 'FORBIDDEN') {
      return res
        .status(403)
        .json({ message: '본인의 글만 수정할 수 있습니다.' });
    } else if (error.message === 'INVALID_PASSWORD') {
      return res.status(401).json({ message: '비밀번호가 틀렸습니다.' });
    }
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
    const isMatch = await bcrypt.compare(password, post.password);
    if (isMatch) {
      return res.status(200).json({ message: '비밀번호가 일치합니다.' });
    } else {
      return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
    }
  } catch (error) {
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};
