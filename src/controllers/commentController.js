import {
  commentSchema,
  deleteCommentSchema,
} from '../schemas/commentSchema.js';
import * as commentService from '../services/commentService.js';

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
    const user = req.user;

    if (isNaN(postId)) {
      return res.status(400).json({ message: '유효한 게시글 ID가 아닙니다.' });
    }
    const result = await commentService.createComment(
      postId,
      validation.data,
      user,
    );
    res.status(201).json(result);
  } catch (error) {
    // 에러 분기 처리
    if (error.message === 'NICKNAME_PASSWORD_REQUIRED') {
      return res
        .status(400)
        .json({ message: '닉네임과 비밀번호를 입력해주세요.' });
    }

    console.error('댓글 등록 컨트롤러 에러:', error);
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
    // 4. 스키마를 사용하여 비밀번호 입력 여부 검증
    if (!user) {
      const validation = deleteCommentSchema.safeParse(req.body);
      if (!validation.success) {
        return res
          .status(400)
          .json({ message: validation.error.errors[0].message });
      }
    }
    // 2. 서비스 호출
    await commentService.deleteComment(commentId, password, user);

    res.status(200).json({ message: '댓글이 삭제되었습니다.' });
  } catch (error) {
    // 에러 분기 처리
    const errorMap = {
      COMMENT_NOT_FOUND: { status: 404, message: '댓글을 찾을 수 없습니다.' },
      ALREADY_DELETED: { status: 400, message: '이미 삭제된 댓글입니다.' },
      FORBIDDEN: { status: 403, message: '본인의 댓글만 삭제할 수 있습니다.' },
      INVALID_PASSWORD: {
        status: 401,
        message: '비밀번호가 일치하지 않습니다.',
      },
      PASSWORD_REQUIRED: { status: 400, message: '비밀번호를 입력해주세요.' },
    };

    const targetError = errorMap[error.message];
    if (targetError) {
      return res
        .status(targetError.status)
        .json({ message: targetError.message });
    }

    console.error('댓글 삭제 에러:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};
