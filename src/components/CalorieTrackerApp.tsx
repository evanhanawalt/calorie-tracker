"use client";

import { useEffect, useState } from "react";
import { useAuthSessionQuery } from "../hooks/trackerRemote";
import {
  clearSessionPreferredLocal,
  hasSessionPreferredLocal,
  setSessionPreferredLocal,
} from "../lib/trackerStorageChoice";
import TrackerStorageLanding from "./TrackerStorageLanding";
import TrackerView from "./tracker/TrackerView";

function CalorieTrackerBody() {
  const session = useAuthSessionQuery();
  const [mode, setMode] = useState<"landing" | "local">(() =>
    hasSessionPreferredLocal() ? "local" : "landing",
  );

  /** Signed-in users should pick cloud vs local via landing after sign-out, not a stale session flag. */
  useEffect(() => {
    if (session.isPending) return;
    if (session.data?.user) {
      clearSessionPreferredLocal();
    }
  }, [session.data?.user, session.isPending]);

  if (session.isPending) {
    return (
      <p className="mx-auto max-w-4xl p-8 text-center text-slate-600">
        Loading…
      </p>
    );
  }

  if (session.data?.user) {
    return <TrackerView storageMode="remote" />;
  }

  if (mode === "landing") {
    return (
      <TrackerStorageLanding
        onChooseLocal={() => {
          setSessionPreferredLocal();
          setMode("local");
        }}
      />
    );
  }

  return <TrackerView storageMode="local" />;
}

export default function CalorieTrackerApp() {
  return <CalorieTrackerBody />;
}
