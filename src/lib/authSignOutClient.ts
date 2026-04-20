import { AUTH_BASE_PATH } from "./auth/authPaths";
import { clearSessionPreferredLocal } from "./trackerStorageChoice";

/**
 * Signs out via Auth.js (same POST as the default sign-out page): CSRF + POST `/signout`.
 * Clears the session “prefer local” flag so the next load shows the landing page.
 */
export async function startAuthSignOut(): Promise<void> {
  clearSessionPreferredLocal();

  const csrfRes = await fetch(`${AUTH_BASE_PATH}/csrf`, {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  if (!csrfRes.ok) {
    throw new Error("Could not sign out.");
  }
  const data = (await csrfRes.json()) as { csrfToken?: string };
  const csrfToken = data.csrfToken;
  if (typeof csrfToken !== "string" || csrfToken.length === 0) {
    throw new Error("Could not sign out.");
  }

  const form = document.createElement("form");
  form.method = "POST";
  form.action = `${AUTH_BASE_PATH}/signout`;

  const csrfInput = document.createElement("input");
  csrfInput.type = "hidden";
  csrfInput.name = "csrfToken";
  csrfInput.value = csrfToken;

  form.append(csrfInput);
  document.body.append(form);
  form.submit();
}
