import jwt from 'jsonwebtoken';

// 로그인 때 썼던 비밀 키와 똑같아야 합니다!
const JWT_SECRET = 'your_secret_key';

export const authenticateToken = (req, res, next) => {
  //1. 요청 헤더에서 'authorization' 항목을 확인합니다.
  const authHeader = req.headers['authorization'];

  // 보통 'Bearer <토큰>' 형태로 오기 때문에 공백을 기준으로 잘라 토큰만 가져옵니다.
  const token = authHeader && authHeader.split(' ')[1];
  // 1. 토큰이 아예 없는 경우: 에러 내지 않고 "익명" 상태로 다음 단계 진행
  if (!token) {
    req.user = null; // 유저 정보가 없음을 명시
    return next();
  }
  // 3. 토큰이 있다면, 이게 진짜인지 유통기한은 안 지났는지 검사합니다.
  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      // 가짜 토큰이거나 만료되었다면? (403: 금지됨)
      return res
        .status(403)
        .json({ message: '유효하지 않거나 만료된 토큰입니다.' });
    }
    // 4. 검증 성공! 토큰 안에 들어있던 유저 정보(id, role 등)를
    // req.user라는 주머니에 넣어줍니다. 이제 다음 함수에서 이걸 꺼내 쓸 수 있어요.
    req.user = decodedUser;

    // 5. 다음 단계(진짜 실행할 컨트롤러)로 넘어가라는 신호!
    next();
  });
};
