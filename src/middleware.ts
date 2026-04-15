import { defineMiddleware } from "astro:middleware";
import { readSession } from "./lib/auth/readSession";

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;
  if (!path.startsWith("/api/app/")) {
    return next();
  }

  const session = await readSession(context.request);
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  context.locals.session = session;
  return next();
});
