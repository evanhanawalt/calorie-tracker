/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly DATABASE_URL?: string;
  readonly AUTH_SECRET?: string;
  readonly AUTH_URL?: string;
  readonly GOOGLE_CLIENT_ID?: string;
  readonly GOOGLE_CLIENT_SECRET?: string;
}

declare namespace App {
  interface Locals {
    session?: import("@auth/core/types").Session;
  }
}
