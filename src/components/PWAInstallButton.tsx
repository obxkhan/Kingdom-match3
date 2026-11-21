import { useState } from "react";
import { Download, Share, X } from "lucide-react";
import { usePWAInstall } from "../hooks/usePWAInstall";

interface PWAInstallButtonProps {
  variant?: "header" | "menu";
}

export function PWAInstallButton({ variant = "header" }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = () => {
    if (isInstallable) {
      void install();
      return;
    }
    setShowGuide(true);
  };

  if (variant === "header" && !isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={
          variant === "menu"
            ? "inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#D4CBB8] bg-white px-4 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap shrink-0"
            : "inline-flex h-10 items-center gap-1.5 rounded-lg bg-emerald-700 px-3 text-xs font-semibold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 whitespace-nowrap shrink-0"
        }
      >
        {isIOS && !isInstallable ? (
          <Share className="h-4 w-4" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        <span>
          {isInstallable
            ? "Install App"
            : isIOS
              ? "Add to Home"
              : "Install / Shortcut"}
        </span>
      </button>

      {showGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-guide-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-sm rounded-2xl border border-[#DDD5C7] bg-[#FAF7F0] p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <h3
                id="pwa-guide-title"
                className="font-[family-name:var(--font-display)] text-lg font-bold text-slate-900"
              >
                {isIOS ? "Install on iPhone / iPad" : "Install & Create Shortcut"}
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close install instructions"
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-200/60 hover:text-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isIOS ? (
              <ol className="mt-3 space-y-2 text-sm text-slate-700">
                <li>
                  1. Open this page in <strong>Safari</strong> (outside any
                  embedded preview if needed).
                </li>
                <li>
                  2. Tap the <strong>Share</strong> icon in the Safari toolbar.
                </li>
                <li>
                  3. Scroll down and tap <strong>Add to Home Screen</strong>.
                </li>
              </ol>
            ) : (
              <ol className="mt-3 space-y-2 text-sm text-slate-700">
                <li>
                  1. If viewing inside an embedded preview, open the app link in
                  your browser tab first.
                </li>
                <li>
                  2. Open your browser menu (<strong>⋮</strong>) and choose{" "}
                  <strong>Add to Home screen</strong>,{" "}
                  <strong>Install app</strong>, or{" "}
                  <strong>Create shortcut</strong>.
                </li>
                <li>
                  3. Confirm to launch TileTown as a standalone app from your
                  home screen or desktop.
                </li>
              </ol>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
