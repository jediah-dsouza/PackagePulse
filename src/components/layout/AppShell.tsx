import type { ReactNode } from "react";
import { CompareSelectionProvider } from "../../features/comparison/CompareSelectionContext";
import { ComparisonTray } from "../../features/comparison/ComparisonTray";
import { SavedPackagesProvider } from "../../features/saved/SavedPackagesProvider";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { SkipLink } from "./SkipLink";
import { ToastRegion } from "./ToastRegion";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <SavedPackagesProvider>
      <CompareSelectionProvider>
        <SkipLink />
        <SiteHeader />
        <ComparisonTray />
        <main id="main-content" className="site-main" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter />
        <ToastRegion />
      </CompareSelectionProvider>
    </SavedPackagesProvider>
  );
}
