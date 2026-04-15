import type { APIRoute } from "astro";

export const prerender = false;

/** Example protected route: requires session (see [src/middleware.ts](src/middleware.ts)). */
export const GET: APIRoute = async ({ locals }) => {
  const session = locals.session;
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(
    JSON.stringify({
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
};
