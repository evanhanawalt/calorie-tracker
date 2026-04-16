const trackerRoot = ["tracker"] as const;

export const trackerQueryKeys = {
  root: trackerRoot,
  summary: (date: string) => [...trackerRoot, "summary", date] as const,
  calendar: (start: string, end: string) =>
    [...trackerRoot, "calendar", start, end] as const,
  backup: [...trackerRoot, "backup"] as const,
};

export const settingsQueryKeys = {
  root: ["userSettings"] as const,
};

export const authQueryKeys = {
  session: ["authSession"] as const,
};
