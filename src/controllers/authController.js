import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcrypt';

//회원가입 로직
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

//로그인 로직
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    //1. 이메일로 유저 찾기
    const user = await prisma.user.findUnique({
      where: { email },
    });

    //유저가 없으면 실패
    if (!user) {
      return res
        .status(401)
        .json({ message: '이메일 또는 비밀번호가 일치하지 않습니다' });
    }
    //2. 비밀번호 비교 ( 사용자가 입력한 비밀번호 vs DB의 암호화된 비번)
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(401)
        .json({ message: '이메일 또는 비밀번호가 일치하지 않습니다.' });
    }

    // 3. 로그인 성공! JWT 토큰 발행
    // 유저 ID와 권한(Role)을 토큰 속에 숨겨둡니다.
    const token = jwt.sign(
      {
        userId: user.id,
        nickname: user.nickname,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }, // 1일 동안 유지되는 입장권
    );

    res.status(200).json({
      message: '로그인 성공!',
      token, // 프론트에게 입장권 넘김
      user: {
        id: user.id,
        nickname: user.nickname,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다' });
  }
};
