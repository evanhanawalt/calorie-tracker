"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import type { Dispatch, SetStateAction } from "react";
import { startAuthSignOut } from "@/lib/authSignOutClient";
import { startGoogleSignIn } from "@/lib/googleSignInClient";
import {
  authQueryKeys,
  settingsQueryKeys,
  trackerQueryKeys,
  type TrackerStorageMode,
} from "@/lib/trackerQueryKeys";
import {
  SvgGear,
  SvgGitHubMark,
  SvgGoogleMark,
  SvgHamburger,
  SvgLogOut,
} from "@/svgs";

type TrackerAppMenuProps = {
  storageMode: TrackerStorageMode;
  menuOpen: boolean;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
  menuRef: React.RefObject<HTMLDivElement | null>;
  menuButtonRef: React.RefObject<HTMLButtonElement | null>;
  menuHeadingId: string;
  userName?: string | null;
  userEmail?: string | null;
  authPending?: boolean;
  onSignInError: (message: string) => void;
  onSignOutError: (message: string) => void;
};

export default function TrackerAppMenu({
  storageMode,
  menuOpen,
  setMenuOpen,
  menuRef,
  menuButtonRef,
  menuHeadingId,
  userName,
  userEmail,
  authPending,
  onSignInError,
  onSignOutError,
}: TrackerAppMenuProps) {
  const queryClient = useQueryClient();
  const isRemote = storageMode === "remote";
  const menuId = isRemote ? "app-menu-remote" : "app-menu-local";

  async function handleSignOut() {
    setMenuOpen(false);
    void queryClient.invalidateQueries({ queryKey: authQueryKeys.session });
    void queryClient.invalidateQueries({
      queryKey: trackerQueryKeys.forMode("remote"),
    });
    void queryClient.invalidateQueries({
      queryKey: settingsQueryKeys.forMode("remote"),
    });
    try {
      await startAuthSignOut();
    } catch {
      onSignOutError(
        "Could not sign out. Check your connection and try again.",
      );
    }
  }

  return (
    <nav
      className="sticky top-0 z-50 border-b border-slate-200/90 bg-white shadow-sm"
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 md:px-8">
        <div className="flex shrink-0 justify-start">
          <a
            href="https://github.com/evanhanawalt/calorie-tracker"
            target="_blank"
            rel="noopener noreferrer"
            title="github"
            className="rounded-md p-2 text-slate-800 outline-none ring-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2"
            aria-label="View this project on GitHub"
          >
            <SvgGitHubMark className="size-7" />
          </a>
        </div>
        <div>
          <h1 className="text-2xl font-bold">Calorie Tracker</h1>
        </div>
        <div className="relative flex shrink-0 justify-end">
          <button
            ref={menuButtonRef}
            type="button"
            className={`rounded-md p-2 text-slate-700 outline-none ring-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 ${menuOpen ? "bg-slate-100" : ""}`}
            aria-expanded={menuOpen}
            aria-haspopup="true"
            aria-controls={menuId}
            onClick={() => setMenuOpen((o) => !o)}
            title="Menu"
          >
            <span className="sr-only">Open menu</span>
            <SvgHamburger className="size-6 shrink-0" aria-hidden="true" />
          </button>

          {menuOpen ? (
            <div
              ref={menuRef}
              id={menuId}
              role="region"
              aria-labelledby={menuHeadingId}
              className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,18rem)] rounded-lg border border-slate-200 bg-white py-2 shadow-lg"
            >
              <h2 id={menuHeadingId} className="sr-only">
                Menu
              </h2>

              {isRemote ? (
                <>
                  <div className="px-4 pb-3 pt-1">
                    <p className="truncate font-semibold text-slate-900">
                      {userName?.trim() || "Account"}
                    </p>
                    {userEmail ? (
                      <p className="mt-0.5 truncate text-sm text-slate-500">
                        {userEmail}
                      </p>
                    ) : null}
                  </div>
                  <div className="border-t border-slate-200" role="presentation" />
                </>
              ) : null}

              <div className="py-1">
                <Link
                  href="/settings"
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-900 hover:bg-slate-50"
                  onClick={() => setMenuOpen(false)}
                >
                  <SvgGear className="size-5 shrink-0 text-slate-600" />
                  Settings
                </Link>
              </div>

              <div className="border-t border-slate-200" role="presentation" />

              <div className="py-1">
                {isRemote ? (
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-blue-600 hover:bg-slate-50"
                    onClick={() => void handleSignOut()}
                  >
                    <SvgLogOut className="size-5 shrink-0" />
                    Sign out
                  </button>
                ) : (
                  <>
                    {authPending ? (
                      <p className="px-4 py-2 text-center text-xs text-slate-500">
                        Checking sign-in…
                      </p>
                    ) : null}
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-900 hover:bg-slate-50"
                      onClick={() => {
                        setMenuOpen(false);
                        void (async () => {
                          try {
                            await startGoogleSignIn();
                          } catch {
                            onSignInError(
                              "Could not start sign-in. Check your connection and try again.",
                            );
                          }
                        })();
                      }}
                    >
                      <SvgGoogleMark className="size-5 shrink-0" />
                      Sign in with Google
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
