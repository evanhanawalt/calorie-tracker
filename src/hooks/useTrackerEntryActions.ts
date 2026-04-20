"use client";

import { useCallback, useState } from "react";
import type { Entry, EntryStream, TrackerAction } from "@/lib/calorieTrackerStorage";
import {
  isLogDateAllowed,
  parseNonNegativeCalories,
} from "@/lib/calorieTrackerValidators";
import { STREAM_UI } from "@/components/tracker/trackerUiConfig";

type TrackerMut = {
  mutateAsync: (action: TrackerAction) => Promise<unknown>;
};

type Params = {
  selectedSummaryDate: string;
  todayIso: string;
  trackerMut: TrackerMut;
  setStatus: (message: string, isError?: boolean) => void;
};

export function useTrackerEntryActions({
  selectedSummaryDate,
  todayIso,
  trackerMut,
  setStatus,
}: Params) {
  const [calorieInputs, setCalorieInputs] = useState<
    Record<EntryStream, string>
  >({ food: "", workout: "" });
  const [editTarget, setEditTarget] = useState<null | {
    stream: EntryStream;
    entry: Entry;
  }>(null);
  const [editCaloriesInput, setEditCaloriesInput] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<null | {
    stream: EntryStream;
    entry: Entry;
  }>(null);

  const runTracker = useCallback(
    async (action: TrackerAction) => {
      await trackerMut.mutateAsync(action);
    },
    [trackerMut],
  );

  function onLogSubmit(stream: EntryStream, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const ui = STREAM_UI[stream];
    const date = selectedSummaryDate;
    const calories = parseNonNegativeCalories(Number(calorieInputs[stream]));
    if (!isLogDateAllowed(date, todayIso)) {
      setStatus("Pick a day on the calendar (not a future date).", true);
      return;
    }
    if (calories === null) {
      setStatus(ui.invalidLogCalories, true);
      return;
    }
    void (async () => {
      try {
        await runTracker({
          type: "addEntry",
          stream,
          date,
          calories,
        });
        setCalorieInputs((prev) => ({ ...prev, [stream]: "" }));
        setStatus(ui.addedMessage);
      } catch (err) {
        setStatus(
          err instanceof Error ? err.message : "Could not add entry.",
          true,
        );
      }
    })();
  }

  function openEditDialog(stream: EntryStream, entry: Entry) {
    setEditTarget({ stream, entry });
    setEditCaloriesInput(String(entry.calories));
  }

  function closeEditDialog() {
    setEditTarget(null);
  }

  function confirmEdit() {
    if (!editTarget) return;
    const calories = parseNonNegativeCalories(Number(editCaloriesInput));
    const singular = STREAM_UI[editTarget.stream].singular;
    if (calories === null) {
      setStatus(`Please enter a valid ${singular} calories value.`, true);
      return;
    }
    void (async () => {
      try {
        await runTracker({
          type: "updateEntryCalories",
          stream: editTarget.stream,
          id: editTarget.entry.id,
          calories,
        });
        setStatus(STREAM_UI[editTarget.stream].editSuccess);
        closeEditDialog();
      } catch (err) {
        setStatus(
          err instanceof Error ? err.message : "Could not update entry.",
          true,
        );
      }
    })();
  }

  function openDeleteDialog(stream: EntryStream, entry: Entry) {
    setDeleteTarget({ stream, entry });
  }

  function closeDeleteDialog() {
    setDeleteTarget(null);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    void (async () => {
      try {
        await runTracker({
          type: "deleteEntry",
          stream: deleteTarget.stream,
          id: deleteTarget.entry.id,
        });
        setStatus(STREAM_UI[deleteTarget.stream].deleteSuccess);
        closeDeleteDialog();
      } catch (err) {
        setStatus(
          err instanceof Error ? err.message : "Could not delete entry.",
          true,
        );
      }
    })();
  }

  return {
    calorieInputs,
    setCalorieInputs,
    editTarget,
    editCaloriesInput,
    setEditCaloriesInput,
    deleteTarget,
    onLogSubmit,
    openEditDialog,
    closeEditDialog,
    confirmEdit,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDelete,
  };
}
