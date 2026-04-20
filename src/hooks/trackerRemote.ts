import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TrackerAction } from "../lib/calorieTrackerStorage";
import { loadBmr, saveBmr } from "../lib/calorieTrackerStorage";
import { getLocalCalendarDays, getLocalDailySummary } from "../lib/localTrackerQueries";
import {
  fetchCalendarDays,
  fetchDailySummary,
  fetchUserSettings,
  patchUserSettings,
} from "../lib/trackerApiClient";
import {
  runLocalTrackerAction,
  runTrackerApiAction,
} from "../lib/trackerApiReducer";
import { applyTrackerMutationResultToCaches } from "../lib/trackerQueryCacheUpdaters";
import {
  authQueryKeys,
  meQueryKeys,
  settingsQueryKeys,
  trackerQueryKeys,
  type TrackerStorageMode,
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

export function useDailySummaryQuery(
  mode: TrackerStorageMode,
  date: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: trackerQueryKeys.summary(mode, date),
    queryFn: () =>
      mode === "local"
        ? Promise.resolve(getLocalDailySummary(date))
        : fetchDailySummary(date),
    enabled,
  });
}

export function useCalendarDaysQuery(
  mode: TrackerStorageMode,
  start: string,
  end: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: trackerQueryKeys.calendar(mode, start, end),
    queryFn: () =>
      mode === "local"
        ? Promise.resolve(getLocalCalendarDays(start, end))
        : fetchCalendarDays(start, end),
    enabled,
  });
}

export function useUserSettingsQuery(
  mode: TrackerStorageMode,
  enabled: boolean,
) {
  return useQuery({
    queryKey: settingsQueryKeys.forMode(mode),
    queryFn: () =>
      mode === "local"
        ? Promise.resolve({ bmrKcal: loadBmr() } satisfies UserSettingsWire)
        : fetchUserSettings(),
    enabled,
  });
}

export function useTrackerMutation(mode: TrackerStorageMode) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (action: TrackerAction) =>
      mode === "local" ? runLocalTrackerAction(action) : runTrackerApiAction(action),
    onSuccess: (result) => {
      if (mode === "remote") {
        applyTrackerMutationResultToCaches(queryClient, result);
      } else {
        void queryClient.invalidateQueries({
          queryKey: trackerQueryKeys.forMode("local"),
        });
      }
    },
  });
}

export function usePatchUserSettingsMutation(mode: TrackerStorageMode) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: UserSettingsWire): Promise<UserSettingsWire> => {
      if (mode === "local") {
        saveBmr(body.bmrKcal);
        return { bmrKcal: body.bmrKcal };
      }
      return patchUserSettings(body);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: settingsQueryKeys.forMode(mode),
      });
      await queryClient.invalidateQueries({
        queryKey: trackerQueryKeys.forMode(mode),
      });
    },
  });
}

export function useMeQuery(enabled: boolean) {
  return useQuery({
    queryKey: meQueryKeys.root,
    queryFn: async () => {
      const res = await fetch("/api/app/me", {
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        throw new Error("Could not load profile.");
      }
      return res.json() as Promise<{
        userId: string;
        email: string | null;
        name: string | null;
        migrationCompleted: boolean;
      }>;
    },
    enabled,
  });
}

export function usePatchMeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { migrationCompleted?: boolean }) => {
      const res = await fetch("/api/app/me", {
        method: "PATCH",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error ?? "Could not update profile.");
      }
      return res.json() as Promise<{ migrationCompleted: boolean }>;
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: meQueryKeys.root });
    },
  });
}
