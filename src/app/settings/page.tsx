"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Brand from "@/components/tracker/Brand";
import Sticker from "@/components/tracker/Sticker";
import StatusStamp from "@/components/StatusStamp";
import TrackerDialog from "@/components/TrackerDialog";
import { startAuthSignOut } from "@/lib/authSignOutClient";
import {
  useAuthSessionQuery,
  usePatchUserSettingsMutation,
  useUserSettingsQuery,
} from "@/hooks/trackerRemote";
import { DEFAULT_BMR } from "@/lib/trackerDomain";
import { authQueryKeys, settingsQueryKeys, trackerQueryKeys } from "@/lib/trackerQueryKeys";

/**
 * Settings page in Tracker style: BMR on a lime sticker, danger-zone on a
 * hot-pink sticker. Back link becomes a sticker-chip; save button a sun-
 * yellow primary action.
 */
export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useAuthSessionQuery();
  const [bmrInput, setBmrInput] = useState(String(DEFAULT_BMR));
  const [status, setStatus] = useState("");
  const [statusErr, setStatusErr] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const settingsQuery = useUserSettingsQuery(!session.isPending && !!session.data?.user);
  const patchSettings = usePatchUserSettingsMutation();

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
        const err = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(err?.error ?? "Could not delete account.");
      }
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.session });
      void queryClient.invalidateQueries({ queryKey: trackerQueryKeys.root });
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.root });
      await startAuthSignOut();
      router.push("/");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not delete account.");
      setStatusErr(true);
    } finally {
      setDeleteBusy(false);
      setDeleteOpen(false);
    }
  }

  if (session.isPending) {
    return (
      <div className="relative min-h-dvh">
        <div className="relative z-10 mx-auto max-w-lg p-8 text-center font-display text-muted">
          Loading…
        </div>
      </div>
    );
  }

  if (!session.data?.user) {
    return (
      <div className="relative min-h-dvh">
        <div className="relative z-10 mx-auto max-w-lg space-y-4 p-8 text-center">
          <Brand />
          <p className="font-display text-muted">Sign in to access settings.</p>
          <Link href="/" className="tracker-btn bg-lime px-3 py-1.5 text-sm">
            Go to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh">
      <div className="relative z-10 mx-auto max-w-lg space-y-6 p-4 md:p-10">
        <div className="flex items-center justify-between gap-4">
          <Brand />
          <Link href="/" className="tracker-btn bg-lime px-3 py-1.5 text-sm">
            ← Back to tracker
          </Link>
        </div>

        <Sticker delay={80} className="bg-cream px-6 py-7 md:px-8">
          <h1 className="font-display text-display-hero-sm leading-none">
            Settings
          </h1>

          <h2 className="mt-6 font-display text-display-md leading-none">
            Basal metabolic rate
          </h2>
          <p className="mt-1 text-sm text-muted">
            Used for calendar colors (net intake vs this value).
          </p>
          <label className="mt-4 block">
            <span className="mb-1 block text-xs uppercase tracking-label text-muted">
              BMR
            </span>
            <input
              type="number"
              min={500}
              max={20000}
              step={1}
              className="tracker-input text-display-lg tabular-nums"
              value={bmrInput}
              onChange={(ev) => setBmrInput(ev.target.value)}
            />
          </label>
          <button
            type="button"
            className="tracker-btn mt-4 bg-sun"
            onClick={saveBmr}
            disabled={patchSettings.isPending}
          >
            {patchSettings.isPending ? "Saving…" : "Save BMR"}
          </button>
        </Sticker>

        {session.data?.user ? (
          <Sticker delay={240} className="bg-hot px-6 py-6 text-cream">
            <span className="tracker-chip bg-cream text-chip uppercase tracking-label text-ink">
              Danger zone
            </span>
            <h2 className="mt-3 font-display text-display-md leading-none">
              Delete account
            </h2>
            <p className="mt-2 text-sm text-cream/90">
              Permanently delete your account and all meals, workouts, and
              settings. This cannot be undone.
            </p>
            <button
              type="button"
              className="tracker-btn mt-4 bg-cream text-hot"
              onClick={() => setDeleteOpen(true)}
            >
              Delete account
            </button>
          </Sticker>
        ) : null}

        <StatusStamp message={status} isError={statusErr} />

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
    </div>
  );
}
