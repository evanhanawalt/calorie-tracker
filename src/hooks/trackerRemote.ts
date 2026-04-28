import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TrackerAction } from "../lib/calorieTrackerStorage";
import {
  fetchCalendarDays,
  fetchDailySummary,
  fetchUserSettings,
  patchUserSettings,
} from "../lib/trackerApiClient";
import {
  runTrackerApiAction,
} from "../lib/trackerApiReducer";
import { applyTrackerMutationResultToCaches } from "../lib/trackerQueryCacheUpdaters";
import {
  authQueryKeys,
  settingsQueryKeys,
  trackerQueryKeys,
} from "../lib/trackerQueryKeys";
import type { UserSettingsWire } from "../lib/trackerWire";

const AUTH_SESSION_PATH = "/api/auth/session";

export type AuthSessionQueryData = {
  user: { name?: string | null; email?: string | null } | null;
};

export function useAuthSessionQuery() {
  return useQuery({
    queryKey: authQueryKeys.session,
    queryFn: async (): Promise<AuthSessionQueryData> => {
      const res = await fetch(AUTH_SESSION_PATH, {
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return { user: null };
      const data = (await res.json()) as {
        user?: { name?: string | null; email?: string | null } | null;
      };
      if (data?.user && typeof data.user === "object") {
        return { user: data.user };
      }
      return { user: null };
    },
    staleTime: 60_000,
  });
}

export function useDailySummaryQuery(date: string, enabled: boolean) {
  return useQuery({
    queryKey: trackerQueryKeys.summary(date),
    queryFn: () => fetchDailySummary(date),
    enabled,
  });
}

export function useCalendarDaysQuery(
  start: string,
  end: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: trackerQueryKeys.calendar(start, end),
    queryFn: () => fetchCalendarDays(start, end),
    enabled,
  });
}

export function useUserSettingsQuery(enabled: boolean) {
  return useQuery({
    queryKey: settingsQueryKeys.root,
    queryFn: () => fetchUserSettings(),
    enabled,
  });
}

export function useTrackerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (action: TrackerAction) => runTrackerApiAction(action),
    onSuccess: (result) => {
      applyTrackerMutationResultToCaches(queryClient, result);
    },
  });
}

export function usePatchUserSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: UserSettingsWire): Promise<UserSettingsWire> => {
      return patchUserSettings(body);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: settingsQueryKeys.root,
      });
      await queryClient.invalidateQueries({
        queryKey: trackerQueryKeys.root,
      });
    },
  });
}
