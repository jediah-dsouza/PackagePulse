import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { RouteErrorBoundary } from "../components/layout/RouteErrorBoundary";
import { ComparePage } from "../pages/ComparePage";
import { ExplorePage } from "../pages/ExplorePage";
import { HomePage } from "../pages/HomePage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { PackageDetailPage } from "../pages/PackageDetailPage";
import { SavedPage } from "../pages/SavedPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/explore" element={<ExplorePage />} />
      <Route path="/package/:name" element={<PackageDetailPage />} />
      <Route path="/compare" element={<ComparePage />} />
      <Route path="/saved" element={<SavedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <RouteErrorBoundary>
        <AppShell>
          <AppRoutes />
        </AppShell>
      </RouteErrorBoundary>
    </BrowserRouter>
  );
}
