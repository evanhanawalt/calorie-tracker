"use client";

import { useAuthSessionQuery } from "../hooks/trackerRemote";
import TrackerStorageLanding from "./TrackerStorageLanding";
import TrackerView from "./tracker/TrackerView";

function CalorieTrackerBody() {
  const session = useAuthSessionQuery();

  if (session.isPending) {
    return (
      <p className="mx-auto max-w-4xl p-8 text-center font-display text-[1.2rem] text-muted">
        Loading…
      </p>
    );
  }

  if (session.data?.user) {
    return <TrackerView />;
  }

  return <TrackerStorageLanding />;
}

export default function CalorieTrackerApp() {
  return <CalorieTrackerBody />;
}
