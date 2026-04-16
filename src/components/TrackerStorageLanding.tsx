import SignInWithGoogleButton from "./SignInWithGoogleButton";

export type TrackerStorageLandingProps = {
  onChooseLocal: () => void;
  onRequestGoogle: () => void;
};

export default function TrackerStorageLanding({
  onChooseLocal,
  onRequestGoogle,
}: TrackerStorageLandingProps) {
  return (
    <div className="mx-auto flex min-h-[min(100dvh,48rem)] max-w-lg flex-col justify-center gap-6 p-6 md:p-8">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">
          Calorie Tracker
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Choose how you want to use the app. You can switch later by signing in
          from the menu when using local storage.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <SignInWithGoogleButton type="button" onClick={onRequestGoogle} />
          <button
            type="button"
            className="flex min-h-10 w-full items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            onClick={onChooseLocal}
          >
            Store data on this device
          </button>
        </div>
        <p className="mt-6 text-xs leading-relaxed text-slate-500">
          Local mode keeps entries in your browser on this device only. Google
          sign-in saves your entries to the server tied to your account.
        </p>
      </div>
    </div>
  );
}
