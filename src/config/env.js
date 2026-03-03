import dotenv from 'dotenv';
import path from 'path';

const envPath = path.join(process.cwd(), 'env', '.env.development');

// 환경변수 로드
const result = dotenv.config({ path: envPath });

// 파일 로드 실패 시 가이드 제공
if (result.error) {
  console.error(`❌ [에러]: ${envPath} 파일을 찾을 수 없습니다!`);
  console.error(`경로와 파일명이 'env/.env.development'인지 확인해주세요.`);
}

export const env = {
  GOOGLE: {
    ID: process.env.GOOGLE_CLIENT_ID,
    SECRET: process.env.GOOGLE_CLIENT_SECRET,
    CALLBACK: process.env.GOOGLE_CALLBACK_URL,
  },
  PORT: process.env.PORT || 5050,
  DATABASE_URL: process.env.DATABASE_URL,
};
