import { Auth } from "@auth/core";
import { authConfig } from "@/lib/auth/auth.config";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return Auth(request, authConfig);
}

export function POST(request: Request) {
  return Auth(request, authConfig);
}
