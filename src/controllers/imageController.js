import { createClient } from '@supabase/supabase-js';
import path from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: '파일이 없습니다.' });

    const file = req.file;
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;

    // Supabase Storage에 업로드 (버킷 이름 확인!)
    const { data, error } = await supabase.storage
      .from('post_images')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) throw error;

    // 공용 URL 생성
    const {
      data: { publicUrl },
    } = supabase.storage.from('post_images').getPublicUrl(fileName);

    // 프론트엔드 에디터(ReactQuill)로 URL 반환
    res.status(200).json({ url: publicUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '이미지 업로드 실패' });
  }
};
