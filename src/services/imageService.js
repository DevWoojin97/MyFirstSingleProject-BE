import { createClient } from '@supabase/supabase-js';
import path from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

export const uploadImageToStorage = async (file) => {
  if (!file) {
    throw new Error('FILE_NOT_PROVIDED');
  }

  const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;

  // Supabase Storage에 업로드
  const { error } = await supabase.storage
    .from('post_images') // 사용하시는 버킷 이름
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
    });

  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error('SUPABASE_UPLOAD_FAILED');
  }

  // 공용 URL 생성
  const {
    data: { publicUrl },
  } = supabase.storage.from('post_images').getPublicUrl(fileName);

  return { url: publicUrl };
};
