/// <reference types="next" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly DATABASE_URL?: string;
    readonly AUTH_SECRET?: string;
    readonly AUTH_URL?: string;
    readonly GOOGLE_CLIENT_ID?: string;
    readonly GOOGLE_CLIENT_SECRET?: string;
  }
}
