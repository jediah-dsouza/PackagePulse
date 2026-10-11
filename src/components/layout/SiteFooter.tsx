import { ArrowUpRight } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner page-container">
        <div>
          <p className="site-footer__brand">PackagePulse</p>
          <p className="site-footer__description">
            A focused workspace for inspecting public npm package metadata.
          </p>
        </div>
        <div className="site-footer__source">
          <a
            href="https://www.npmjs.com/"
            className="external-link"
            aria-label="Public npm Registry (external site)"
          >
            Public npm Registry
            <ArrowUpRight aria-hidden="true" size={14} />
          </a>
          <p>
            Registry metadata can be incomplete. It does not certify package security,
            maintenance, compatibility, or quality.
          </p>
        </div>
      </div>
    </footer>
  );
}
