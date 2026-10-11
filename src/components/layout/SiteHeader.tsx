import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Bookmark, GitCompareArrows, Menu, Package, X } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useCompareSelection } from "../../features/comparison/useCompareSelection";
import { useSavedPackages } from "../../features/saved/useSavedPackages";

type NavigationItemsProps = {
  onNavigate?: () => void;
  selectedCompareCount: number;
  savedCount: number;
};

function NavigationItems({
  onNavigate,
  selectedCompareCount,
  savedCount,
}: NavigationItemsProps) {
  return (
    <>
      <NavLink
        to="/explore"
        onClick={onNavigate}
        className={({ isActive }) => `nav-link${isActive ? " nav-link--active" : ""}`}
      >
        <span>Explore</span>
      </NavLink>
      <NavLink
        to="/compare"
        onClick={onNavigate}
        aria-label={
          selectedCompareCount > 0
            ? `Compare, ${selectedCompareCount} selected`
            : "Compare"
        }
        className={({ isActive }) => `nav-link${isActive ? " nav-link--active" : ""}`}
      >
        <GitCompareArrows aria-hidden="true" size={16} strokeWidth={1.8} />
        <span>Compare</span>
        {selectedCompareCount > 0 && (
          <span className="nav-link__count" aria-hidden="true">
            {selectedCompareCount}
          </span>
        )}
      </NavLink>
      <NavLink
        to="/saved"
        onClick={onNavigate}
        aria-label={
          savedCount > 0
            ? `Saved, ${savedCount} package${savedCount === 1 ? "" : "s"}`
            : "Saved"
        }
        className={({ isActive }) => `nav-link${isActive ? " nav-link--active" : ""}`}
      >
        <Bookmark aria-hidden="true" size={16} strokeWidth={1.8} />
        <span>Saved</span>
        {savedCount > 0 && (
          <span className="nav-link__count" aria-hidden="true">
            {savedCount}
          </span>
        )}
      </NavLink>
    </>
  );
}

export function SiteHeader() {
  const { selectedCount } = useCompareSelection();
  const { savedCount } = useSavedPackages();
  const [mobileOpen, setMobileOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (mobileOpen && dialog && !dialog.open) {
      dialog.showModal();
      closeButtonRef.current?.focus();
    }
  }, [mobileOpen]);

  function containDialogFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter(
      (element) =>
        element.getAttribute("aria-hidden") !== "true" &&
        element.getClientRects().length > 0,
    );
    const first = focusable[0];
    const last = focusable.at(-1);

    if (!first || !last) {
      event.preventDefault();
      return;
    }

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function closeMobileNavigation() {
    if (dialogRef.current?.open) {
      dialogRef.current.close();
    } else {
      setMobileOpen(false);
    }
  }

  return (
    <header className="site-header">
      <div className="site-header__inner page-container">
        <Link
          className="brand"
          to="/"
          aria-label="PackagePulse home"
          onClick={closeMobileNavigation}
        >
          <span className="brand__mark">
            <Package aria-hidden="true" size={19} strokeWidth={1.8} />
          </span>
          <span className="brand__wordmark">
            Package<span>Pulse</span>
          </span>
        </Link>

        <nav className="primary-navigation" aria-label="Primary navigation">
          <NavigationItems
            selectedCompareCount={selectedCount}
            savedCount={savedCount}
          />
        </nav>

        <button
          ref={menuButtonRef}
          className="icon-button mobile-menu-trigger"
          type="button"
          aria-label="Open navigation"
          aria-haspopup="dialog"
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMobileOpen(true)}
        >
          <Menu aria-hidden="true" size={20} />
        </button>
      </div>

      <dialog
        ref={dialogRef}
        id="mobile-navigation"
        className="mobile-navigation-dialog"
        aria-labelledby="mobile-navigation-title"
        onKeyDown={containDialogFocus}
        onClose={() => {
          setMobileOpen(false);
          menuButtonRef.current?.focus();
        }}
      >
        <div className="mobile-navigation-dialog__heading">
          <h2 id="mobile-navigation-title">Navigate PackagePulse</h2>
          <button
            ref={closeButtonRef}
            className="icon-button"
            type="button"
            aria-label="Close navigation"
            onClick={closeMobileNavigation}
          >
            <X aria-hidden="true" size={19} />
          </button>
        </div>
        <nav className="mobile-navigation" aria-label="Mobile navigation">
          <NavigationItems
            onNavigate={closeMobileNavigation}
            selectedCompareCount={selectedCount}
            savedCount={savedCount}
          />
        </nav>
      </dialog>
    </header>
  );
}
