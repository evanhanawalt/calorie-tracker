const SESSION_KEY = "tracker:storageChoice";
const VALUE_LOCAL = "local";

export function hasSessionPreferredLocal(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(SESSION_KEY) === VALUE_LOCAL;
}

export function setSessionPreferredLocal(): void {
  sessionStorage.setItem(SESSION_KEY, VALUE_LOCAL);
}
