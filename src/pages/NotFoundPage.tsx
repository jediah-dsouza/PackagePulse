import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../utils/usePageTitle";

export function NotFoundPage() {
  usePageTitle("Page not found");

  return (
    <div className="page-container route-page not-found-page">
      <p className="not-found-page__code">404</p>
      <h1>That route is not in PackagePulse.</h1>
      <p>Return to Explore to continue looking through package records.</p>
      <Link className="button button--primary" to="/explore">
        <ArrowLeft aria-hidden="true" size={16} />
        Go to Explore
      </Link>
    </div>
  );
}
