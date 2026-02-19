import multer from 'multer';

// 1. 하드디스크가 아닌 메모리에 임시 저장하도록 변경
const storage = multer.memoryStorage();

export const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 제한은 그대로 유지
});
