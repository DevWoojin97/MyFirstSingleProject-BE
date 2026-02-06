// prisma.config.js
import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma', // 스키마 경로
  // Prisma 7에서 URL 설정 방식
  datasource: {
    url: process.env.DATABASE_URL, // env('URL') 대신 표준 process.env를 사용합니다.
  },
});
