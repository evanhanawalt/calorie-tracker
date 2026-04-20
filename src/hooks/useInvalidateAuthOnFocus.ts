"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { authQueryKeys } from "@/lib/trackerQueryKeys";

/** Refetches the Auth.js session when the window regains focus (e.g. after OAuth). */
export function useInvalidateAuthOnFocus(): void {
  const queryClient = useQueryClient();
  useEffect(() => {
    function onFocus() {
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.session });
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [queryClient]);
}
