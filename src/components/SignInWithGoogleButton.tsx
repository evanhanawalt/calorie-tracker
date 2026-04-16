import type { ButtonHTMLAttributes } from "react";
import {
  GOOGLE_SIGN_IN_BUTTON_CLASSNAME,
  GoogleGMonogram,
} from "./googleSignInBranding";

export type SignInWithGoogleButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> & {
  /** Approved CTAs include "Sign in with Google", "Continue with Google", etc. */
  label?: string;
};

/**
 * Branded control for starting Auth.js Google OAuth (POST /signin/google).
 * Styling follows https://developers.google.com/identity/branding-guidelines (light theme).
 */
export default function SignInWithGoogleButton({
  label = "Sign in with Google",
  className = "",
  type = "button",
  ...rest
}: SignInWithGoogleButtonProps) {
  return (
    <button
      type={type}
      className={`font-google-sign-in w-full ${GOOGLE_SIGN_IN_BUTTON_CLASSNAME} ${className}`.trim()}
      {...rest}
    >
      <GoogleGMonogram />
      <span>{label}</span>
    </button>
  );
}
