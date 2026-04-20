"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  type Dispatch,
  type RefObject,
  type SetStateAction,
  useEffect,
} from "react";
import { authQueryKeys } from "@/lib/trackerQueryKeys";

type Params = {
  menuOpen: boolean;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
  menuRef: RefObject<HTMLDivElement | null>;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
};

/**
 * When the menu opens, refreshes the auth session query; closes the menu on
 * outside pointer events or Escape.
 */
export function useTrackerMenuDismiss({
  menuOpen,
  setMenuOpen,
  menuRef,
  menuButtonRef,
}: Params): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!menuOpen) return;
    void queryClient.invalidateQueries({ queryKey: authQueryKeys.session });

    function onPointerDown(ev: MouseEvent | TouchEvent) {
      const el = menuRef.current;
      const btn = menuButtonRef.current;
      if (!el || !btn) return;
      const target = ev.target as Node;
      if (el.contains(target) || btn.contains(target)) return;
      setMenuOpen(false);
    }

    function onKeyDown(ev: KeyboardEvent) {
      if (ev.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown, { passive: true });
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen, menuRef, menuButtonRef, queryClient, setMenuOpen]);
}
