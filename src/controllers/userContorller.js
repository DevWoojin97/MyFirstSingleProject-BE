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
