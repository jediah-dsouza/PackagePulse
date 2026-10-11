import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

type RouteErrorBoundaryProps = {
  children: ReactNode;
};

type RouteErrorBoundaryState = {
  hasError: boolean;
};

class RouteErrorBoundaryView extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("PackagePulse route error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="route-error">
          <main className="page-container route-page">
            <h1>PackagePulse hit a problem.</h1>
            <p>The page could not be shown. Reload it or return to Explore.</p>
            <div className="action-row">
              <button
                className="button button--primary"
                type="button"
                onClick={() => window.location.reload()}
              >
                Reload page
              </button>
              <Link className="button button--secondary" to="/explore">
                Go to Explore
              </Link>
            </div>
          </main>
        </div>
      );
    }

    return this.props.children;
  }
}

export function RouteErrorBoundary({ children }: RouteErrorBoundaryProps) {
  const location = useLocation();
  const resetKey = `${location.pathname}${location.search}${location.hash}`;

  return <RouteErrorBoundaryView key={resetKey}>{children}</RouteErrorBoundaryView>;
}
