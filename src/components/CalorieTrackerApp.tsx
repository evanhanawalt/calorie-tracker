import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAuthSessionQuery } from "../hooks/trackerRemote";
import {
  hasSessionPreferredLocal,
  setSessionPreferredLocal,
} from "../lib/trackerStorageChoice";
import { authQueryKeys } from "../lib/trackerQueryKeys";
import GoogleSignInDialog from "./GoogleSignInDialog";
import LocalTrackerView from "./tracker/LocalTrackerView";
import RemoteTrackerView from "./tracker/RemoteTrackerView";
import TrackerStorageLanding from "./TrackerStorageLanding";

function CalorieTrackerBody() {
  const queryClient = useQueryClient();
  const session = useAuthSessionQuery();
  const [mode, setMode] = useState<"landing" | "local">(() =>
    hasSessionPreferredLocal() ? "local" : "landing",
  );
  const [googleDialogOpen, setGoogleDialogOpen] = useState(false);

  useEffect(() => {
    function onFocus() {
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.session });
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [queryClient]);

  if (session.isPending) {
    return (
      <p className="mx-auto max-w-4xl p-8 text-center text-slate-600">
        Loading…
      </p>
    );
  }

  if (session.data?.user) {
    return <RemoteTrackerView />;
  }

  if (mode === "landing") {
    return (
      <>
        <TrackerStorageLanding
          onChooseLocal={() => {
            setSessionPreferredLocal();
            setMode("local");
          }}
          onRequestGoogle={() => setGoogleDialogOpen(true)}
        />
        <GoogleSignInDialog
          open={googleDialogOpen}
          onClose={() => setGoogleDialogOpen(false)}
        />
      </>
    );
  }

  return <LocalTrackerView />;
}

export default function CalorieTrackerApp() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <CalorieTrackerBody />
    </QueryClientProvider>
  );
}
