/** Must match `basePath` in `src/lib/auth/auth.config.ts`. */
export const AUTH_BASE_PATH = "/api/auth";

export function sessionUrlForOrigin(origin: string): string {
  return `${origin}${AUTH_BASE_PATH}/session`;
}
