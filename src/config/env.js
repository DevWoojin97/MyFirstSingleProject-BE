import dotenv from 'dotenv';
import path from 'path';

// production이 아닐 때만 로컬 env 파일 로드
if (process.env.NODE_ENV !== 'production') {
  const envPath = path.join(process.cwd(), 'env', '.env.development');
  dotenv.config({ path: envPath });
}

export const env = {
  GOOGLE: {
    ID: process.env.GOOGLE_CLIENT_ID,
    SECRET: process.env.GOOGLE_CLIENT_SECRET,
    CALLBACK: process.env.GOOGLE_CALLBACK_URL,
  },
  PORT: process.env.PORT || 5050,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
};
