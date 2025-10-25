import { TwitterApi } from "twitter-api-v2";

export interface TwitterOAuthSession {
  codeVerifier: string;
  state: string;
}

export interface TwitterUserSession {
  id: string;
  username: string;
  name: string;
  profileImageUrl?: string;
  accessToken: string;
  refreshToken?: string;
}

declare module "express-session" {
  interface SessionData {
    oauth?: TwitterOAuthSession;
    twitterUser?: TwitterUserSession;
  }
}
