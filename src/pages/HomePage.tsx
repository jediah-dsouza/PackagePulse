import { ArrowRight, GitCompareArrows, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../utils/usePageTitle";
import { PreviewLabel } from "../components/ui/PreviewLabel";

const workflow = ["Search", "Inspect", "Compare", "Save"];

function WorkbenchPreview() {
  return (
    <figure className="workbench-preview">
      <figcaption className="workbench-preview__caption">
        <PreviewLabel />
        <span>Package dossier layout</span>
      </figcaption>
      <div className="workbench-preview__record">
        <div className="record-heading">
          <div>
            <span className="record-heading__label">Package</span>
            <p className="record-heading__name">&lt;package-name&gt;</p>
          </div>
          <span className="record-tag">registry record</span>
        </div>
        <div className="record-rows">
          <div className="record-row">
            <span>Latest version</span>
            <code>&lt;version&gt;</code>
          </div>
          <div className="record-row">
            <span>License</span>
            <span>Not loaded</span>
          </div>
          <div className="record-row">
            <span>Dependencies</span>
            <span>Not loaded</span>
          </div>
        </div>
        <div className="record-source">
          <span className="record-source__line" aria-hidden="true" />
          <span>Source fields remain visible beside their values.</span>
        </div>
      </div>
      <div className="workbench-preview__compare">
        <GitCompareArrows aria-hidden="true" size={17} />
        <span>Compare only fields returned by the registry.</span>
      </div>
    </figure>
  );
}

export function HomePage() {
  usePageTitle("Inspect npm packages");

  return (
    <div className="page-container home-page">
      <section className="home-hero">
        <div className="home-hero__copy">
          <h1>Inspect the details before you install.</h1>
          <p className="home-hero__summary">
            Explore public npm metadata, review releases and dependencies, and compare
            package candidates in one focused workspace.
          </p>
          <div className="action-row">
            <Link className="button button--primary" to="/explore">
              Explore packages
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
            <Link className="button button--secondary" to="/compare">
              Open comparison
            </Link>
          </div>
          <p className="home-hero__note">
            Public registry data is context, not a security or maintenance guarantee.
          </p>
        </div>
        <WorkbenchPreview />
      </section>

      <section className="workflow-section" aria-labelledby="workflow-heading">
        <div className="section-heading">
          <h2 id="workflow-heading">A clearer path to a dependency decision</h2>
          <p>Keep package identity and evidence easy to scan.</p>
        </div>
        <ol className="workflow-list">
          {workflow.map((step, index) => (
            <li key={step}>
              <span className="workflow-list__index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{step}</span>
              {index < workflow.length - 1 && (
                <ArrowRight
                  aria-hidden="true"
                  className="workflow-list__connector"
                  size={15}
                />
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className="source-note" aria-labelledby="source-note-heading">
        <div className="source-note__icon">
          <Search aria-hidden="true" size={18} strokeWidth={1.8} />
        </div>
        <div>
          <h2 id="source-note-heading">Read the record, not a verdict.</h2>
          <p>
            Publication dates, licenses, dependency data, and download counts can be
            missing or incomplete. PackagePulse will show what the public registry
            returns without turning those fields into a package score.
          </p>
        </div>
      </section>
    </div>
  );
}
