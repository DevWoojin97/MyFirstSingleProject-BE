import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import postRoutes from './routes/postRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import authRoutes from './routes/authRoutes.js';

const app = express();
const PORT = process.env.PORT || 5050;

app.use(
  cors({
    origin: [
      'http://localhost:5173', // 로컬 프론트
      'https://woojinproject.vercel.app', //배포 프론트
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  }),
);
// 'uploads' 폴더 안에 있는 파일들을 /uploads 라는 경로로 공개하겠다는 설정
app.use('/uploads', express.static('uploads'));
app.use(express.json());

// 라우터 연결
app.use('/api/posts', postRoutes);
app.use('/api/posts', commentRoutes);
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
