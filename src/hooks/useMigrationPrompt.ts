"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  clearAllTrackerLocalStorage,
  hasMeaningfulLocalTrackerData,
  loadBmr,
  loadFoodEntries,
  loadWorkoutEntries,
} from "@/lib/calorieTrackerStorage";
import { useMeQuery, usePatchMeMutation } from "@/hooks/trackerRemote";
import {
  meQueryKeys,
  settingsQueryKeys,
  trackerQueryKeys,
  type TrackerStorageMode,
} from "@/lib/trackerQueryKeys";

type SetStatus = (message: string, isError?: boolean) => void;

export function useMigrationPrompt(
  storageMode: TrackerStorageMode,
  setStatus: SetStatus,
) {
  const queryClient = useQueryClient();
  const meQuery = useMeQuery(storageMode === "remote");
  const patchMe = usePatchMeMutation();

  const migrationAutoDoneRef = useRef(false);
  const [migrationOpen, setMigrationOpen] = useState(false);
  const [migrationReplaceOpen, setMigrationReplaceOpen] = useState(false);
  const [migrationBusy, setMigrationBusy] = useState(false);

  useEffect(() => {
    if (storageMode !== "remote") return;
    if (!meQuery.data || meQuery.data.migrationCompleted) return;
    if (hasMeaningfulLocalTrackerData()) return;
    if (migrationAutoDoneRef.current) return;
    migrationAutoDoneRef.current = true;
    patchMe.mutate(
      { migrationCompleted: true },
      {
        onError: () => {
          migrationAutoDoneRef.current = false;
        },
      },
    );
  }, [storageMode, meQuery.data, patchMe]);

  useEffect(() => {
    if (storageMode !== "remote") return;
    if (!meQuery.data || meQuery.isPending) return;
    if (meQuery.data.migrationCompleted) return;
    if (!hasMeaningfulLocalTrackerData()) return;
    setMigrationOpen(true);
  }, [storageMode, meQuery.data, meQuery.isPending]);

  async function migrateLocalToCloud(confirmReplaceExisting: boolean) {
    setMigrationBusy(true);
    try {
      const meals = loadFoodEntries().map((m) => ({
        date: m.date,
        calories: m.calories,
        displayOrder: m.displayOrder,
      }));
      const workouts = loadWorkoutEntries().map((w) => ({
        date: w.date,
        calories: w.calories,
        displayOrder: w.displayOrder,
      }));
      const bmrKcal = loadBmr();
      const res = await fetch("/api/app/migration", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bmrKcal,
          meals,
          workouts,
          confirmReplaceExisting,
        }),
      });
      if (res.status === 409) {
        setMigrationOpen(false);
        setMigrationReplaceOpen(true);
        return;
      }
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error ?? "Migration failed.");
      }
      clearAllTrackerLocalStorage();
      void queryClient.invalidateQueries({
        queryKey: trackerQueryKeys.forMode("local"),
      });
      void queryClient.invalidateQueries({
        queryKey: trackerQueryKeys.forMode("remote"),
      });
      void queryClient.invalidateQueries({ queryKey: meQueryKeys.root });
      void queryClient.invalidateQueries({
        queryKey: settingsQueryKeys.forMode("remote"),
      });
      setMigrationOpen(false);
      setMigrationReplaceOpen(false);
      setStatus("Local data saved to your account.");
    } catch (e) {
      setStatus(
        e instanceof Error ? e.message : "Could not migrate data.",
        true,
      );
    } finally {
      setMigrationBusy(false);
    }
  }

  function declineMigration() {
    if (migrationBusy) return;
    patchMe.mutate(
      { migrationCompleted: true },
      {
        onSuccess: () => {
          setMigrationOpen(false);
        },
        onError: () => {
          setStatus("Could not update migration preference.", true);
        },
      },
    );
  }

  function onMigrationDialogClose() {
    if (!migrationBusy) declineMigration();
  }

  return {
    migrationOpen,
    migrationReplaceOpen,
    migrationBusy,
    setMigrationReplaceOpen,
    migrateLocalToCloud,
    declineMigration,
    onMigrationDialogClose,
  };
}
