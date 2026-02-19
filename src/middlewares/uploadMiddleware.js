import fs from 'fs';
import multer from 'multer';
import path from 'path';

// 1. 업로드 폴더가 없으면 생성
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// 2. 저장소 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // 파일 저장 경로
  },
  filename: (req, file, cb) => {
    // 파일명 중복 방지: 날짜_랜덤숫자.확장자
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 제한
});
