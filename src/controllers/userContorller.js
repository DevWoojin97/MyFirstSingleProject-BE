import * as userService from '../services/userService.js';

export const getMyPage = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const data = await userService.getMyPageData(userId);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyPosts = async (req, res) => {
  try {
    console.log('현재 로그인한 유저 ID:', req.user?.id); // 👈 이게 찍히는지 확인!
    const userId = req.user.userId; // 미들웨어에서 넣어준 유저 정보
    const posts = await userService.getMyPosts(userId);

    res.status(200).json({
      success: true,
      data: posts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '글 목록 로드 실패' });
  }
};
