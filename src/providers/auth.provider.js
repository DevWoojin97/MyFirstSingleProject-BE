/**
 * 구글에서 받은 프로필 정보를 우리 서비스 유저 객체 형식으로 정제합니다.
 */
export const extractGoogleProfile = (profile) => {
  return {
    email: profile.emails[0]?.value,
    nickname: profile.displayName,
    profileImage: profile.photos[0]?.value,
    provider: 'GOOGLE',
    googleId: profile.id,
    role: 'USER',
  };
};

// 나중에 카카오 등이 추가되면 여기에 extractKakaoProfile 등을 추가하면 됩니다.
