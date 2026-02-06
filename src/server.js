import express from 'express';
import cors from 'cors';
import postRoutes from './routes/postRoutes.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// 라우터 연결
app.use('/api/posts', postRoutes);

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
