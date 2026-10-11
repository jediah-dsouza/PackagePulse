import { useEffect, useRef, useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import {
  NpmRegistryError,
  type RegistrySearchPage,
} from "../../services/npmRegistry/types";
import { searchNpmPackages } from "../../services/npmRegistry/npmRegistryService";
import { CompareSelectionButton } from "./CompareSelectionButton";

type PickerState =
  | { status: "idle" }
  | { status: "loading"; query: string }
  | { status: "success"; query: string; results: RegistrySearchPage }
  | { status: "error"; query: string; error: NpmRegistryError };

function toRegistryError(error: unknown): NpmRegistryError {
  return error instanceof NpmRegistryError
    ? error
    : new NpmRegistryError("unknown", { cause: error });
}

function errorMessage(error: NpmRegistryError): string {
  if (error.code === "rate-limited") {
    return "The npm Registry is limiting requests. Wait a little, then retry.";
  }
  if (error.code === "network")
    return "Couldn't reach the npm Registry. Check your connection.";
  if (error.code === "server") return "The npm Registry is temporarily unavailable.";
  if (error.code === "invalid-response") {
    return "The Registry response could not be read safely. Try the search again.";
  }
  return "Package search could not be completed. Try again or edit the query.";
}

export function ComparePackagePicker() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<PickerState>({ status: "idle" });
  const controllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  useEffect(
    () => () => {
      controllerRef.current?.abort();
    },
    [],
  );

  async function runSearch(rawQuery: string) {
    const normalizedQuery = rawQuery.trim();
    if (!normalizedQuery) {
      controllerRef.current?.abort();
      setState({ status: "idle" });
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const requestId = ++requestIdRef.current;
    setState({ status: "loading", query: normalizedQuery });

    try {
      const results = await searchNpmPackages(normalizedQuery, {
        offset: 0,
        size: 10,
        signal: controller.signal,
      });
      if (requestId !== requestIdRef.current || controller.signal.aborted) return;
      setState({ status: "success", query: normalizedQuery, results });
    } catch (error) {
      if (requestId !== requestIdRef.current || controller.signal.aborted) return;
      const registryError = toRegistryError(error);
      if (registryError.code !== "aborted") {
        setState({ status: "error", query: normalizedQuery, error: registryError });
      }
    }
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runSearch(query);
  }

  const resultItems = state.status === "success" ? state.results.items : [];

  return (
    <section
      className="comparison-picker"
      aria-labelledby="comparison-picker-heading"
      id="compare-package-picker"
    >
      <div className="section-heading">
        <h2 id="comparison-picker-heading">Add a package</h2>
        <p>Search npm without leaving comparison.</p>
      </div>
      <form className="comparison-picker__form" role="search" onSubmit={submitSearch}>
        <label htmlFor="comparison-package-query">Package name or keyword</label>
        <div className="comparison-picker__controls">
          <div className="comparison-picker__input">
            <Search aria-hidden="true" size={17} />
            <input
              id="comparison-package-query"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="react or @scope/package"
              autoComplete="off"
            />
          </div>
          <button className="button button--primary" type="submit">
            Search packages
          </button>
        </div>
      </form>

      {state.status === "loading" && (
        <div className="comparison-picker__status" role="status" aria-live="polite">
          Searching npm for “{state.query}”…
        </div>
      )}
      {state.status === "error" && (
        <div className="comparison-picker__error" role="alert">
          <p>{errorMessage(state.error)}</p>
          <button
            className="button button--secondary"
            type="button"
            onClick={() => void runSearch(state.query)}
          >
            Retry package search
          </button>
        </div>
      )}
      {state.status === "success" && (
        <div
          className="comparison-picker__results"
          role="region"
          aria-label={`Search results for ${state.query}`}
          aria-live="polite"
        >
          {resultItems.length > 0 ? (
            <ul>
              {resultItems.map((item) => (
                <li key={item.name}>
                  <div className="comparison-picker__result-copy">
                    <code>{item.name}</code>
                    <p>
                      {item.description || "No description provided by the registry."}
                    </p>
                  </div>
                  <CompareSelectionButton packageName={item.name} />
                </li>
              ))}
            </ul>
          ) : (
            <p>No npm packages found for “{state.query}”. Try another name or topic.</p>
          )}
        </div>
      )}
    </section>
  );
}
