import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import postRoutes from './routes/postRoutes.js';

const app = express();
const PORT = process.env.PORT || 5050;

app.use(
  cors({
    origin: ['http://localhost:5173'], // 나중에 배포 주소 추가
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // ✨ PATCH를 추가하세요!
    credentials: true,
  }),
);
app.use(express.json());

// 라우터 연결
app.use('/api/posts', postRoutes);

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
