import { useState } from "react";
import { Copy, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { CompareSelectionButton } from "../../comparison/CompareSelectionButton";
import { SavedPackageButton } from "../../saved/SavedPackageButton";
import type { PackageSummary } from "../../../services/npmRegistry/types";
import { formatPublicationDate } from "../searchUtils";

type SearchResultProps = {
  item: PackageSummary;
  activeKeyword: string;
  onKeywordSelect: (keyword: string) => void;
};

export function SearchResult({
  item,
  activeKeyword,
  onKeywordSelect,
}: SearchResultProps) {
  const [copyMessage, setCopyMessage] = useState("");
  const publishedDate = formatPublicationDate(item.publishedAt);
  const installCommand = `npm install ${item.name}`;
  const packageRoute = `/package/${encodeURIComponent(item.name)}`;
  const visibleKeywords = item.keywords.slice(0, 5);

  async function copyInstallCommand() {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }
      await navigator.clipboard.writeText(installCommand);
      setCopyMessage("Install command copied.");
    } catch {
      setCopyMessage(
        "Could not access the clipboard. Select the command above to copy it.",
      );
    }
  }

  return (
    <article className="package-result">
      <div className="package-result__body">
        <div className="package-result__heading">
          <h3>
            <Link
              className="package-result__name"
              to={packageRoute}
              aria-label={`Open package details for ${item.name}`}
            >
              {item.name}
            </Link>
          </h3>
          {item.latestVersion ? (
            <span className="package-result__version">
              Latest <code>{item.latestVersion}</code>
            </span>
          ) : (
            <span className="package-result__version">Latest version not provided</span>
          )}
        </div>

        <p className="package-result__description">
          {item.description || "No description provided by the registry."}
        </p>
        {item.descriptionTruncated && (
          <p className="package-data-note">
            Description shortened to a safe display length.
          </p>
        )}

        <dl className="package-result__facts">
          <div>
            <dt>License</dt>
            <dd>{item.license ?? "Not provided"}</dd>
          </div>
          {publishedDate && item.publishedAt && (
            <div>
              <dt>Last published</dt>
              <dd>
                <time dateTime={item.publishedAt}>{publishedDate}</time>
              </dd>
            </div>
          )}
        </dl>

        <div className="package-result__keywords">
          <span className="package-result__keywords-label">Keywords</span>
          {visibleKeywords.length > 0 ? (
            <div
              className="keyword-list"
              role="group"
              aria-label={`Keywords for ${item.name}`}
            >
              {visibleKeywords.map((keyword) => (
                <button
                  className={`keyword-chip${activeKeyword.toLocaleLowerCase() === keyword.toLocaleLowerCase() ? " keyword-chip--active" : ""}`}
                  key={keyword}
                  type="button"
                  aria-pressed={
                    activeKeyword.toLocaleLowerCase() === keyword.toLocaleLowerCase()
                  }
                  onClick={() => onKeywordSelect(keyword)}
                >
                  {keyword}
                </button>
              ))}
              {item.keywords.length > visibleKeywords.length && (
                <span className="keyword-list__more">
                  +{item.keywords.length - visibleKeywords.length} more
                </span>
              )}
            </div>
          ) : (
            <span className="package-result__missing-keywords">
              No keywords returned
            </span>
          )}
          {item.keywordsTruncated && (
            <span className="package-data-note">
              Registry keyword entries were omitted by safety limits.
            </span>
          )}
        </div>
      </div>

      <div className="package-result__actions">
        <code className="package-result__command">{installCommand}</code>
        <button
          className="button button--secondary package-result__copy"
          type="button"
          onClick={copyInstallCommand}
        >
          <Copy aria-hidden="true" size={15} />
          Copy install command
        </button>
        <CompareSelectionButton
          packageName={item.name}
          className="package-result__compare"
        />
        <SavedPackageButton packageName={item.name} className="package-result__save" />
        {item.npmUrl && (
          <a
            className="text-link package-result__npm-link"
            href={item.npmUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink aria-hidden="true" size={14} />
            Open npm page (new tab)
          </a>
        )}
        <span className="visually-hidden" role="status" aria-live="polite">
          {copyMessage}
        </span>
        {copyMessage.startsWith("Could not") && (
          <p className="package-result__copy-error">{copyMessage}</p>
        )}
      </div>
    </article>
  );
}
