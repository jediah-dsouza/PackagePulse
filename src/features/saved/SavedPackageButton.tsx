import { Bookmark, BookmarkCheck } from "lucide-react";
import { useSavedPackages } from "./useSavedPackages";

export function SavedPackageButton({
  packageName,
  className = "",
}: {
  packageName: string;
  className?: string;
}) {
  const { isSaved, toggleSavedPackage, announce } = useSavedPackages();
  const saved = isSaved(packageName);

  function toggle() {
    const result = toggleSavedPackage(packageName);
    if (result === "invalid-name") {
      announce(
        "This package name cannot be saved because it is not a valid npm identifier.",
      );
    } else if (result === "saved") {
      announce(`${packageName} saved in this browser.`);
    } else if (result === "saved-session") {
      announce(
        `${packageName} saved for this session only because browser storage is unavailable.`,
      );
    } else {
      announce(
        result === "removed-session"
          ? `${packageName} removed for this session. Browser storage is unavailable.`
          : `${packageName} removed from saved packages.`,
      );
    }
  }

  return (
    <button
      className={`button button--secondary saved-package-button ${className}`.trim()}
      type="button"
      aria-label={
        saved ? `Remove ${packageName} from saved packages` : `Save ${packageName}`
      }
      aria-pressed={saved}
      onClick={toggle}
    >
      {saved ? (
        <BookmarkCheck aria-hidden="true" size={16} />
      ) : (
        <Bookmark aria-hidden="true" size={16} />
      )}
      <span>{saved ? "Saved" : "Save package"}</span>
    </button>
  );
}
