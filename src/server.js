import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import postRoutes from './routes/postRoutes.js';

const app = express();
const PORT = process.env.PORT || 5050;

app.use(
  cors({
    origin: [
      'http://localhost:5173', // 로컬 프론트
      'https://woojinproject.vercel.app', //배포 프론트
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  }),
);
app.use(express.json());

// 라우터 연결
app.use('/api/posts', postRoutes);

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
