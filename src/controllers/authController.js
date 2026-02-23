import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcrypt';

export const signup = async (req, res) => {
  try {
    const { email, password, nickname } = req.body;

    // 1.필수 입력값 확인
    if (!email || !password || !nickname) {
      return res.status(400).json({ message: '모든 필드를 입력해 주세요.' });
    }

    // 2. 이메일 또는 닉네임 중복 확인
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { nickname }],
      },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: '이미 사용 중인 이메일 또는 닉네임입니다.' });
    }

    // 3. 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. DB 저장(Role은 스키마 설정에 따라 자동으로 'USER' 가 됨)
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nickname,
      },
    });

    res.status(201).json({
      message: '회원가입이 성공적으로 완료되었습니다!',
      userId: newUser.id,
    });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
};
