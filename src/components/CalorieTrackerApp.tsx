import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAuthSessionQuery } from "../hooks/trackerRemote";
import { authQueryKeys } from "../lib/trackerQueryKeys";
import LocalTrackerView from "./tracker/LocalTrackerView";
import RemoteTrackerView from "./tracker/RemoteTrackerView";

function CalorieTrackerBody() {
  const queryClient = useQueryClient();
  const session = useAuthSessionQuery();

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
