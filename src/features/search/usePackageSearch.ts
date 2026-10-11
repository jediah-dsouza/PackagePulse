import { useCallback, useEffect, useRef, useState } from "react";
import { searchNpmPackages } from "../../services/npmRegistry/npmRegistryService";
import {
  RegistrySearchError,
  type PackageSummary,
} from "../../services/npmRegistry/types";

export type PackageSearchState =
  | { status: "idle" }
  | { status: "loading"; query: string }
  | { status: "error"; query: string; error: RegistrySearchError }
  | { status: "empty"; query: string; total?: number }
  | {
      status: "success";
      query: string;
      items: PackageSummary[];
      total?: number;
      nextOffset: number;
      hasMore: boolean;
      loadingMore: boolean;
      loadMoreError?: RegistrySearchError;
    };

function toRegistrySearchError(error: unknown): RegistrySearchError {
  return error instanceof RegistrySearchError
    ? error
    : new RegistrySearchError("unknown", { cause: error });
}

export function usePackageSearch(query: string) {
  const [state, setState] = useState<PackageSearchState>({ status: "idle" });
  const [retryKey, setRetryKey] = useState(0);
  const requestSequence = useRef(0);
  const searchController = useRef<AbortController | null>(null);
  const loadMoreController = useRef<AbortController | null>(null);

  useEffect(() => {
    const requestId = ++requestSequence.current;
    searchController.current?.abort();
    loadMoreController.current?.abort();
    loadMoreController.current = null;

    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      setState({ status: "idle" });
      return;
    }

    const controller = new AbortController();
    searchController.current = controller;
    setState({ status: "loading", query: normalizedQuery });

    void searchNpmPackages(normalizedQuery, { signal: controller.signal })
      .then((page) => {
        if (requestId !== requestSequence.current || controller.signal.aborted) {
          return;
        }

        if (page.items.length === 0) {
          setState({
            status: "empty",
            query: normalizedQuery,
            total: page.total,
          });
          return;
        }

        setState({
          status: "success",
          query: normalizedQuery,
          items: page.items,
          total: page.total,
          nextOffset: page.nextOffset,
          hasMore: page.hasMore,
          loadingMore: false,
        });
      })
      .catch((error: unknown) => {
        if (requestId !== requestSequence.current || controller.signal.aborted) {
          return;
        }
        const registryError = toRegistrySearchError(error);
        if (registryError.code !== "aborted") {
          setState({
            status: "error",
            query: normalizedQuery,
            error: registryError,
          });
        }
      });

    return () => {
      controller.abort();
      if (searchController.current === controller) {
        searchController.current = null;
      }
      loadMoreController.current?.abort();
      loadMoreController.current = null;
    };
  }, [query, retryKey]);

  const retry = useCallback(() => {
    setRetryKey((current) => current + 1);
  }, []);

  const loadMore = useCallback(async () => {
    if (
      state.status !== "success" ||
      state.query !== query.trim() ||
      !state.hasMore ||
      state.loadingMore ||
      loadMoreController.current
    ) {
      return;
    }

    const requestId = requestSequence.current;
    const controller = new AbortController();
    loadMoreController.current = controller;
    setState((current) =>
      current.status === "success"
        ? { ...current, loadingMore: true, loadMoreError: undefined }
        : current,
    );

    try {
      const page = await searchNpmPackages(state.query, {
        offset: state.nextOffset,
        signal: controller.signal,
      });
      if (requestId !== requestSequence.current || controller.signal.aborted) {
        return;
      }

      setState((current) => {
        if (current.status !== "success" || current.query !== state.query) {
          return current;
        }
        const knownNames = new Set(current.items.map((item) => item.name));
        const additionalItems = page.items.filter((item) => !knownNames.has(item.name));
        return {
          ...current,
          items: [...current.items, ...additionalItems],
          total: page.total ?? current.total,
          nextOffset: page.nextOffset,
          hasMore: page.hasMore,
          loadingMore: false,
        };
      });
    } catch (error) {
      if (requestId !== requestSequence.current || controller.signal.aborted) {
        return;
      }
      const registryError = toRegistrySearchError(error);
      if (registryError.code !== "aborted") {
        setState((current) =>
          current.status === "success"
            ? {
                ...current,
                loadingMore: false,
                loadMoreError: registryError,
              }
            : current,
        );
      }
    } finally {
      if (loadMoreController.current === controller) {
        loadMoreController.current = null;
      }
    }
  }, [query, state]);

  return { state, retry, loadMore };
}
