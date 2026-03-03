import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from './env.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE.ID, // 👈 env 객체 사용
      clientSecret: env.GOOGLE.SECRET, // 👈 env 객체 사용
      callbackURL: env.GOOGLE.CALLBACK, // 👈 env 객체 사용
    },
    async (accessToken, refreshToken, profile, done) => {
      //구글이 준 profile 정보를 정리해서 전달
      const userProfile = {
        email: profile.emails[0].value,
        nickname: profile.displayName,
        profileImage: profile.photos[0].value,
        provider: 'GOOGLE',
        googleId: profile.id,
        role: 'USER',
        password: null,
      };
      return done(null, userProfile);
    },
  ),
);
