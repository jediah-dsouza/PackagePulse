import { useEffect, useRef, useState, type FormEvent } from "react";
import { Search, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { SearchResult } from "../features/search/components/SearchResult";
import { SearchSkeleton } from "../features/search/components/SearchSkeleton";
import { filterAndSortPackages, parseSearchSort } from "../features/search/searchUtils";
import { usePackageSearch } from "../features/search/usePackageSearch";
import { usePageTitle } from "../utils/usePageTitle";

const SEARCH_DEBOUNCE_MS = 300;

function describeSearchError(
  code: string,
  retryAfterSeconds?: number,
): { title: string; message: string } {
  if (code === "network") {
    return {
      title: "Couldn't reach the npm Registry.",
      message: "Check your connection, then retry the search.",
    };
  }
  if (code === "rate-limited") {
    const waitHint =
      retryAfterSeconds === undefined
        ? "Wait a little before trying again."
        : `The registry asked clients to wait at least ${Math.max(1, retryAfterSeconds)} seconds.`;
    return {
      title: "The npm Registry is limiting requests.",
      message: `${waitHint} You can retry when you're ready.`,
    };
  }
  if (code === "server") {
    return {
      title: "The npm Registry is temporarily unavailable.",
      message: "Try the search again in a moment.",
    };
  }
  if (code === "not-found") {
    return {
      title: "The registry search endpoint wasn't found.",
      message: "Check the query or retry in a moment.",
    };
  }
  if (code === "invalid-response") {
    return {
      title: "The npm Registry returned data PackagePulse couldn't read.",
      message: "No partial results were shown. Retry or adjust your query.",
    };
  }
  if (code === "too-large") {
    return {
      title: "The npm Registry search response exceeded the safe size limit.",
      message: "Try a narrower query or retry the search.",
    };
  }
  return {
    title: "Search couldn't be completed.",
    message: "Retry the search or edit your query.",
  };
}

export function ExplorePage() {
  usePageTitle("Explore packages");

  const [searchParams, setSearchParams] = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim();
  const keyword = searchParams.get("keyword") ?? "";
  const sort = parseSearchSort(searchParams.get("sort"));
  const [draft, setDraft] = useState(query);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { state, retry, loadMore } = usePackageSearch(query);
  const visibleState =
    query.length === 0
      ? { status: "idle" as const }
      : state.status === "idle" || state.query !== query
        ? { status: "loading" as const, query }
        : state;

  useEffect(() => {
    setDraft(query);
  }, [query]);

  useEffect(() => {
    const nextQuery = draft.trim();
    if (nextQuery === query) return;

    const timeout = window.setTimeout(() => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (nextQuery) next.set("q", nextQuery);
          else next.delete("q");
          next.delete("keyword");
          next.delete("from");
          return next;
        },
        { replace: true },
      );
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [draft, query, setSearchParams]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = draft.trim();
    if (!nextQuery) {
      clearSearch();
      return;
    }
    if (nextQuery === query) {
      retry();
      return;
    }
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("q", nextQuery);
      next.delete("keyword");
      next.delete("from");
      return next;
    });
  }

  function clearSearch() {
    setDraft("");
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete("q");
        next.delete("keyword");
        next.delete("sort");
        next.delete("from");
        return next;
      },
      { replace: true },
    );
    searchInputRef.current?.focus();
  }

  function setKeywordFilter(value: string) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        const normalized = value.trim();
        if (normalized) next.set("keyword", normalized);
        else next.delete("keyword");
        return next;
      },
      { replace: true },
    );
  }

  function setSort(value: string) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value === "relevance") next.delete("sort");
        else next.set("sort", value);
        return next;
      },
      { replace: true },
    );
  }

  function clearFilters() {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete("keyword");
        next.delete("sort");
        return next;
      },
      { replace: true },
    );
  }

  const sortedItems =
    visibleState.status === "success"
      ? filterAndSortPackages(visibleState.items, keyword, sort)
      : [];
  const isFiltered = keyword.trim().length > 0;
  const summary = (() => {
    if (visibleState.status === "idle") {
      return "Search the public npm Registry by package name or keyword.";
    }
    if (visibleState.status === "loading") {
      return `Searching the npm Registry for “${visibleState.query}”…`;
    }
    if (visibleState.status === "error") {
      return `Search for “${visibleState.query}” could not be completed.`;
    }
    if (visibleState.status === "empty") {
      return `No npm packages found for “${visibleState.query}”.`;
    }
    if (isFiltered) {
      return `Showing ${sortedItems.length} of ${visibleState.items.length} loaded results after keyword filtering.`;
    }
    return visibleState.total === undefined
      ? `${visibleState.items.length} packages loaded for “${visibleState.query}”.`
      : `Showing ${visibleState.items.length} of ${visibleState.total.toLocaleString()} registry matches for “${visibleState.query}”.`;
  })();

  return (
    <div className="page-container route-page explore-page">
      <header className="page-heading explore-page__heading">
        <h1>Explore packages</h1>
        <p>
          Search public npm package names and keywords, then inspect the returned
          records.
        </p>
      </header>

      <section className="search-panel" aria-labelledby="search-panel-title">
        <h2 id="search-panel-title">Search the registry</h2>
        <form className="package-search-form" role="search" onSubmit={handleSubmit}>
          <label className="visually-hidden" htmlFor="package-query">
            Package name or keyword
          </label>
          <div className="package-search-form__input-wrap">
            <Search aria-hidden="true" size={18} />
            <input
              ref={searchInputRef}
              id="package-query"
              type="search"
              value={draft}
              onChange={(event) => setDraft(event.currentTarget.value)}
              placeholder="react or @scope/package"
              autoComplete="off"
              enterKeyHint="search"
              aria-describedby="search-help"
            />
            {draft.length > 0 && (
              <button
                className="package-search-form__clear"
                type="button"
                aria-label="Clear search"
                onClick={clearSearch}
              >
                <X aria-hidden="true" size={17} />
              </button>
            )}
          </div>
          <button
            className="button button--primary package-search-form__submit"
            type="submit"
          >
            Search
          </button>
        </form>
        <p id="search-help" className="helper-text">
          Results come from the public npm Registry. Press Enter to search immediately;
          typing searches after a short pause.
        </p>
      </section>

      <section
        className="search-results"
        aria-labelledby="search-results-title"
        aria-busy={
          visibleState.status === "loading" ||
          (visibleState.status === "success" && visibleState.loadingMore)
        }
      >
        <div className="search-results__heading">
          <div>
            <h2 id="search-results-title">Packages</h2>
            <p className="search-results__summary" role="status" aria-live="polite">
              {summary}
            </p>
          </div>
          {visibleState.status === "success" && visibleState.items.length > 0 && (
            <button
              className="text-button"
              type="button"
              onClick={clearSearch}
              aria-label="Clear search and filters"
            >
              Clear search
            </button>
          )}
        </div>

        {visibleState.status === "idle" && (
          <div className="search-guidance">
            <p>
              Try a package name such as <code>react</code>, a scope such as{" "}
              <code>@types</code>, or a topic like <code>router</code>.
            </p>
          </div>
        )}

        {visibleState.status === "loading" && <SearchSkeleton />}

        {visibleState.status === "error" && (
          <div className="search-error" role="alert">
            <div>
              <h3>
                {
                  describeSearchError(
                    visibleState.error.code,
                    visibleState.error.retryAfterSeconds,
                  ).title
                }
              </h3>
              <p>
                {
                  describeSearchError(
                    visibleState.error.code,
                    visibleState.error.retryAfterSeconds,
                  ).message
                }
              </p>
            </div>
            <button className="button button--secondary" type="button" onClick={retry}>
              Retry search
            </button>
          </div>
        )}

        {visibleState.status === "empty" && (
          <div className="search-empty" role="status">
            <h3>No packages found</h3>
            <p>
              Try another name or topic. The query stays in the address bar so you can
              edit or share it.
            </p>
            <button className="text-button" type="button" onClick={clearSearch}>
              Clear search
            </button>
          </div>
        )}

        {visibleState.status === "success" && (
          <>
            <div
              className="search-filters"
              role="group"
              aria-label="Filter and sort loaded results"
            >
              <div className="search-filter">
                <label htmlFor="keyword-filter">Keyword filter</label>
                <input
                  id="keyword-filter"
                  type="text"
                  value={keyword}
                  onChange={(event) => setKeywordFilter(event.currentTarget.value)}
                  placeholder="Exact package keyword"
                  autoComplete="off"
                />
                <span className="search-filter__hint">
                  Matches keywords returned for loaded results.
                </span>
              </div>
              <div className="search-filter search-filter--sort">
                <label htmlFor="result-sort">Sort loaded results</label>
                <select
                  id="result-sort"
                  value={sort}
                  onChange={(event) => setSort(event.currentTarget.value)}
                >
                  <option value="relevance">Registry order</option>
                  <option value="name">Name (A–Z)</option>
                  <option value="recent">Recently published</option>
                </select>
              </div>
              {(keyword || sort !== "relevance") && (
                <button
                  className="text-button search-filters__clear"
                  type="button"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              )}
            </div>

            {sortedItems.length > 0 ? (
              <div className="package-results-list">
                {sortedItems.map((item) => (
                  <SearchResult
                    key={item.name}
                    item={item}
                    activeKeyword={keyword}
                    onKeywordSelect={(value) =>
                      setKeywordFilter(
                        keyword.toLocaleLowerCase() === value.toLocaleLowerCase()
                          ? ""
                          : value,
                      )
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="search-empty search-empty--filtered" role="status">
                <h3>No loaded results match “{keyword}”.</h3>
                <p>
                  Keyword filtering only checks results already returned by npm. Clear
                  the filter or try another keyword.
                </p>
                <button
                  className="text-button"
                  type="button"
                  onClick={() => setKeywordFilter("")}
                >
                  Clear keyword filter
                </button>
              </div>
            )}

            {visibleState.loadMoreError && (
              <div className="load-more-error" role="alert">
                <p>
                  {
                    describeSearchError(
                      visibleState.loadMoreError.code,
                      visibleState.loadMoreError.retryAfterSeconds,
                    ).message
                  }
                </p>
                <button
                  className="text-button"
                  type="button"
                  onClick={() => void loadMore()}
                  disabled={visibleState.loadingMore}
                >
                  Retry loading more
                </button>
              </div>
            )}

            {visibleState.hasMore && !visibleState.loadMoreError && (
              <div className="load-more">
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={() => void loadMore()}
                  disabled={visibleState.loadingMore}
                >
                  {visibleState.loadingMore ? "Loading more packages…" : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
