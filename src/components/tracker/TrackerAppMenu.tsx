"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import type { Dispatch, SetStateAction } from "react";
import Brand from "@/components/tracker/Brand";
import { startAuthSignOut } from "@/lib/authSignOutClient";
import {
  authQueryKeys,
  settingsQueryKeys,
  trackerQueryKeys,
} from "@/lib/trackerQueryKeys";
import {
  SvgGear,
  SvgGitHubMark,
  SvgHamburger,
  SvgLogOut,
} from "@/svgs";

type TrackerAppMenuProps = {
  menuOpen: boolean;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
  menuRef: React.RefObject<HTMLDivElement | null>;
  menuButtonRef: React.RefObject<HTMLButtonElement | null>;
  menuHeadingId: string;
  userName?: string | null;
  userEmail?: string | null;
  authPending?: boolean;
  onSignOutError: (message: string) => void;
};

/**
 * Tracker-style primary nav: sticker wordmark, GitHub link as a chip, and a
 * hamburger that pops a sticker-card menu with account + sign-in controls.
 */
export default function TrackerAppMenu({
  menuOpen,
  setMenuOpen,
  menuRef,
  menuButtonRef,
  menuHeadingId,
  userName,
  userEmail,
  authPending,
  onSignOutError,
}: TrackerAppMenuProps) {
  const queryClient = useQueryClient();
  const menuId = "app-menu";

  async function handleSignOut() {
    setMenuOpen(false);
    void queryClient.invalidateQueries({ queryKey: authQueryKeys.session });
    void queryClient.invalidateQueries({ queryKey: trackerQueryKeys.root });
    void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.root });
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
      className="sticky top-0 z-40 border-b-2 border-ink bg-bg/85 backdrop-blur"
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 md:px-8">
        <Brand />
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/evanhanawalt/calorie-tracker"
            target="_blank"
            rel="noopener noreferrer"
            title="github"
            className="tracker-btn bg-paper px-2 py-2"
            aria-label="View this project on GitHub"
          >
            <SvgGitHubMark className="size-5" />
          </a>
          <div className="relative">
            <button
              ref={menuButtonRef}
              type="button"
              className={`tracker-btn px-2 py-2 ${menuOpen ? "bg-sun" : "bg-paper"}`}
              aria-expanded={menuOpen}
              aria-haspopup="true"
              aria-controls={menuId}
              onClick={() => setMenuOpen((o) => !o)}
              title="Menu"
            >
              <span className="sr-only">Open menu</span>
              <SvgHamburger className="size-5" aria-hidden="true" />
            </button>

            {menuOpen ? (
              <div
                ref={menuRef}
                id={menuId}
                role="region"
                aria-labelledby={menuHeadingId}
                className="tracker-sticker absolute right-0 top-full z-50 mt-3 w-[min(100vw-2rem,18rem)] bg-cream p-2"
              >
                <h2 id={menuHeadingId} className="sr-only">
                  Menu
                </h2>

                <div className="px-3 pb-3 pt-1">
                  <p className="truncate font-display text-display-xs leading-tight">
                    {userName?.trim() || "Account"}
                  </p>
                  {userEmail ? (
                    <p className="mt-0.5 truncate text-sm italic text-muted">
                      {userEmail}
                    </p>
                  ) : null}
                </div>

                <MenuItem>
                  <Link
                    href="/settings"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-bg"
                    onClick={() => setMenuOpen(false)}
                  >
                    <SvgGear className="size-5 shrink-0" />
                    Settings
                  </Link>
                </MenuItem>

                <div
                  className="my-1 h-[2px] bg-ink"
                  role="presentation"
                />

                <MenuItem>
                  {authPending ? (
                    <p className="px-3 py-2 text-center text-xs italic text-muted">
                      checking sign-in…
                    </p>
                  ) : null}
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-hot hover:bg-bg"
                    onClick={() => void handleSignOut()}
                  >
                    <SvgLogOut className="size-5 shrink-0" />
                    Sign out
                  </button>
                </MenuItem>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}

function MenuItem({ children }: { children: React.ReactNode }) {
  return <div className="py-0.5">{children}</div>;
}
