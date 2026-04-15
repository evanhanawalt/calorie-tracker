import { Auth } from "@auth/core";
import type { APIRoute } from "astro";
import { authConfig } from "../../../lib/auth/auth.config";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  return Auth(request, authConfig);
};

export const POST: APIRoute = async ({ request }) => {
  return Auth(request, authConfig);
};
