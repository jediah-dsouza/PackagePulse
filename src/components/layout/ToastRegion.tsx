import { useEffect } from "react";
import { useSavedPackages } from "../../features/saved/useSavedPackages";

export function ToastRegion() {
  const { announcement, clearAnnouncement } = useSavedPackages();

  useEffect(() => {
    if (!announcement) return;
    const timeoutId = window.setTimeout(clearAnnouncement, 4500);
    return () => window.clearTimeout(timeoutId);
  }, [announcement, clearAnnouncement]);

  return (
    <div
      className="toast-region"
      aria-live="polite"
      aria-atomic="true"
      data-testid="toast-region"
    >
      {announcement && (
        <p role="status" className="toast-region__message">
          {announcement}
        </p>
      )}
    </div>
  );
}
