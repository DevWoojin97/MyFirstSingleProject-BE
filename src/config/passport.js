import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from './env.js';
import * as authProvider from '../providers/auth.provider.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE.ID,
      clientSecret: env.GOOGLE.SECRET,
      callbackURL: env.GOOGLE.CALLBACK,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 1. Provider를 통해 구글 정보를 우리 서비스 규격으로 정제
        const userProfile = authProvider.extractGoogleProfile(profile);

        // 2. 정제된 정보를 다음 단계(보통 Service)로 넘김
        // (팁: 나중에 여기서 바로 authService.loginWithGoogle(userProfile)을 호출하게 됩니다!)
        return done(null, userProfile);
      } catch (error) {
        return done(error, null);
      }
    },
  ),
);
