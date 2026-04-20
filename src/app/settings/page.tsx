"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import TrackerDialog from "@/components/TrackerDialog";
import { startAuthSignOut } from "@/lib/authSignOutClient";
import {
  useAuthSessionQuery,
  usePatchUserSettingsMutation,
  useUserSettingsQuery,
} from "@/hooks/trackerRemote";
import { DEFAULT_BMR } from "@/lib/calorieTrackerStorage";
import {
  authQueryKeys,
  settingsQueryKeys,
  trackerQueryKeys,
  type TrackerStorageMode,
} from "@/lib/trackerQueryKeys";

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useAuthSessionQuery();
  const [bmrInput, setBmrInput] = useState(String(DEFAULT_BMR));
  const [status, setStatus] = useState("");
  const [statusErr, setStatusErr] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const mode: TrackerStorageMode = session.data?.user ? "remote" : "local";
  const settingsQuery = useUserSettingsQuery(mode, !session.isPending);
  const patchSettings = usePatchUserSettingsMutation(mode);

  useEffect(() => {
    if (settingsQuery.data) {
      setBmrInput(String(settingsQuery.data.bmrKcal));
    }
  }, [settingsQuery.data]);

  function saveBmr() {
    const n = Number(bmrInput);
    if (!Number.isFinite(n) || n < 500 || n > 20000) {
      setStatus("Enter a daily BMR between 500 and 20,000 kcal.");
      setStatusErr(true);
      return;
    }
    const rounded = Math.round(n);
    void patchSettings.mutateAsync(
      { bmrKcal: rounded },
      {
        onSuccess: () => {
          setStatus("BMR saved.");
          setStatusErr(false);
        },
        onError: (err) => {
          setStatus(
            err instanceof Error ? err.message : "Could not save BMR.",
          );
          setStatusErr(true);
        },
      },
    );
  }

  async function confirmDeleteAccount() {
    setDeleteBusy(true);
    try {
      const res = await fetch("/api/app/account", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error ?? "Could not delete account.");
      }
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.session });
      void queryClient.invalidateQueries({
        queryKey: trackerQueryKeys.forMode("remote"),
      });
      void queryClient.invalidateQueries({
        queryKey: settingsQueryKeys.forMode("remote"),
      });
      await startAuthSignOut();
      router.push("/");
    } catch (e) {
      setStatus(
        e instanceof Error ? e.message : "Could not delete account.",
      );
      setStatusErr(true);
    } finally {
      setDeleteBusy(false);
      setDeleteOpen(false);
    }
  }

  if (session.isPending) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center text-slate-600">
        Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg p-4 md:p-8">
      <p className="mb-6">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← Back to tracker
        </Link>
      </p>
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      <p className="mt-1 text-sm text-slate-600">
        {mode === "remote"
          ? "Basal metabolic rate is stored in your account."
          : "Basal metabolic rate is stored on this device only."}
      </p>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Daily BMR (kcal)
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Used for calendar colors (net intake vs this value).
        </p>
        <label className="mt-4 block text-sm">
          <span className="mb-1 block font-medium text-slate-800">BMR</span>
          <input
            type="number"
            min={500}
            max={20000}
            step={1}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            value={bmrInput}
            onChange={(ev) => setBmrInput(ev.target.value)}
          />
        </label>
        <button
          type="button"
          className="mt-4 rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
          onClick={saveBmr}
          disabled={patchSettings.isPending}
        >
          Save BMR
        </button>
      </section>

      {session.data?.user ? (
        <section className="mt-8 rounded-xl border border-red-200 bg-red-50/80 p-5">
          <h2 className="text-lg font-semibold text-red-900">Danger zone</h2>
          <p className="mt-1 text-sm text-red-800">
            Permanently delete your account and all meals, workouts, and
            settings. This cannot be undone.
          </p>
          <button
            type="button"
            className="mt-4 rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
            onClick={() => setDeleteOpen(true)}
          >
            Delete account
          </button>
        </section>
      ) : null}

      <p
        className={`mt-6 text-sm italic ${statusErr ? "text-red-600" : "text-slate-600"}`}
        role="status"
      >
        {status}
      </p>

      <TrackerDialog
        open={deleteOpen}
        onClose={() => !deleteBusy && setDeleteOpen(false)}
        title="Delete your account?"
        description="All data linked to your account will be removed. You will be signed out."
        primaryLabel="Delete my account"
        primaryVariant="danger"
        primaryDisabled={deleteBusy}
        onPrimary={() => void confirmDeleteAccount()}
        secondaryLabel="Cancel"
        onSecondary={() => !deleteBusy && setDeleteOpen(false)}
      />
    </div>
  );
}
