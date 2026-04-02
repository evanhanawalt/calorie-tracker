/**
 * File System Access API (Chromium). Use is still guarded at runtime with
 * `typeof window.showSaveFilePicker === "function"`.
 */
export {};

declare global {
  interface ShowSaveFilePickerOptions {
    suggestedName?: string;
    startIn?:
      | "desktop"
      | "documents"
      | "downloads"
      | "music"
      | "pictures"
      | "videos"
      | FileSystemDirectoryHandle
      | FileSystemFileHandle;
    types?: Array<{
      description?: string;
      accept: Record<string, string[]>;
    }>;
  }

  interface Window {
    showSaveFilePicker?: (
      options?: ShowSaveFilePickerOptions,
    ) => Promise<FileSystemFileHandle>;
  }
}
