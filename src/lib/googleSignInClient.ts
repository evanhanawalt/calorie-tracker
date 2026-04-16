import { AUTH_BASE_PATH } from "./auth/authPaths";

/**
 * Starts Google OAuth via Auth.js: CSRF cookie + POST to `/signin/google`
 * (same as the default sign-in page form), then full-window navigation.
 */
export async function startGoogleSignIn(): Promise<void> {
  const csrfRes = await fetch(`${AUTH_BASE_PATH}/csrf`, {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  if (!csrfRes.ok) {
    throw new Error("Could not start sign-in.");
  }
  const data = (await csrfRes.json()) as { csrfToken?: string };
  const csrfToken = data.csrfToken;
  if (typeof csrfToken !== "string" || csrfToken.length === 0) {
    throw new Error("Could not start sign-in.");
  }

  const callbackUrl = `${window.location.origin}/`;

  const form = document.createElement("form");
  form.method = "POST";
  form.action = `${AUTH_BASE_PATH}/signin/google`;

  const csrfInput = document.createElement("input");
  csrfInput.type = "hidden";
  csrfInput.name = "csrfToken";
  csrfInput.value = csrfToken;

  const callbackInput = document.createElement("input");
  callbackInput.type = "hidden";
  callbackInput.name = "callbackUrl";
  callbackInput.value = callbackUrl;

  form.append(csrfInput, callbackInput);
  document.body.append(form);
  form.submit();
}
