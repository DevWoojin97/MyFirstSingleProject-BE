import * as imageService from '../services/imageService.js';

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '파일이 없습니다.' });
    }

    const result = await imageService.uploadImageToStorage(req.file);

    // 프론트엔드 에디터(ReactQuill)로 URL 반환
    res.status(200).json(result);
  } catch (error) {
    console.error('Image Upload Controller Error:', error);
    // 서비스에서 던진 에러에 따라 분기 처리도 가능
    if (error.message === 'SUPABASE_UPLOAD_FAILED') {
      return res.status(500).json({ message: '이미지 업로드에 실패했습니다.' });
    }
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};
