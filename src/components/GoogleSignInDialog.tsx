import { useState } from "react";
import { startGoogleSignIn } from "../lib/googleSignInClient";
import { GoogleGMonogram } from "./googleSignInBranding";
import TrackerDialog from "./TrackerDialog";

export type GoogleSignInDialogProps = {
  open: boolean;
  onClose: () => void;
};

export default function GoogleSignInDialog({
  open,
  onClose,
}: GoogleSignInDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function handleClose() {
    setBusy(false);
    setError("");
    onClose();
  }

  async function handleContinue() {
    setError("");
    setBusy(true);
    try {
      await startGoogleSignIn();
    } catch {
      setBusy(false);
      setError("Could not start sign-in. Check your connection and try again.");
    }
  }

  return (
    <TrackerDialog
      open={open}
      onClose={handleClose}
      title="Sign in with Google"
      description="You will leave this page briefly to sign in with Google, then return here with your data synced to your account."
      primaryVariant="google"
      primaryLabel={
        <>
          <GoogleGMonogram />
          <span>{busy ? "Starting…" : "Continue with Google"}</span>
        </>
      }
      onPrimary={() => {
        void handleContinue();
      }}
      primaryDisabled={busy}
      secondaryLabel="Cancel"
      onSecondary={handleClose}
    >
      {error ? (
        <p className="text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </TrackerDialog>
  );
}
