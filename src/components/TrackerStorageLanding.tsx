"use client";

import { useState } from "react";
import Brand from "./tracker/Brand";
import Confetti from "./tracker/Confetti";
import Sticker from "./tracker/Sticker";
import SignInWithGoogleButton from "./SignInWithGoogleButton";
import { startGoogleSignIn } from "../lib/googleSignInClient";

export type TrackerStorageLandingProps = {
  onChooseLocal: () => void;
};

/**
 * First-run gate that lets the user pick cloud (Google sign-in) or local
 * storage. Tracker styling: floating confetti behind a tilted sticker card
 * with a sun-yellow storage pill.
 */
export default function TrackerStorageLanding({
  onChooseLocal,
}: TrackerStorageLandingProps) {
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleError, setGoogleError] = useState("");

  async function handleGoogleSignIn() {
    setGoogleError("");
    setGoogleBusy(true);
    try {
      await startGoogleSignIn();
    } catch {
      setGoogleBusy(false);
      setGoogleError(
        "Could not start sign-in. Check your connection and try again.",
      );
    }
  }

  return (
    <div className="relative min-h-dvh">
      <Confetti />
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-6 p-6 md:p-10">
        <Brand tagline="Track meals, workouts, and net calories." />

        <Sticker delay={80} className="bg-cream px-6 py-7 md:px-8 md:py-9">
          <span className="tracker-chip bg-sun" aria-hidden>
            Storage
          </span>
          <h1 className="mt-4 font-display text-display-hero-md leading-[0.95]">
            Choose where to save your data.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Sign in to keep your meals and workouts in the cloud across devices,
            or save them locally in this browser. You can switch later from the
            menu.
          </p>

          <div className="mt-7 flex flex-col gap-3">
            <SignInWithGoogleButton
              type="button"
              disabled={googleBusy}
              label={googleBusy ? "Starting…" : "Sign in with Google"}
              onClick={() => {
                void handleGoogleSignIn();
              }}
            />
            <button
              type="button"
              className="tracker-btn bg-lime"
              onClick={onChooseLocal}
            >
              Use local storage
            </button>
          </div>

          {googleError ? (
            <p className="mt-3 text-sm font-medium text-hot" role="alert">
              {googleError}
            </p>
          ) : null}

          <div className="mt-7 flex items-start gap-3 rounded-2xl border-2 border-ink bg-bg p-3">
            <span
              aria-hidden
              className="mt-0.5 inline-block h-4 w-4 shrink-0 rounded-full border-2 border-ink bg-ocean"
            />
            <p className="text-xs leading-relaxed text-muted">
              <strong className="text-ink">Local mode</strong> keeps entries in
              this browser only.{" "}
              <strong className="text-ink">Google sign-in</strong> stores them
              on the server tied to your account.
            </p>
          </div>
        </Sticker>
      </div>
    </div>
  );
}
