import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePackageSearch } from "./usePackageSearch";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function page(names: string[], total: number) {
  return {
    total,
    objects: names.map((name) => ({
      package: { name, version: "1.0.0", keywords: [] },
    })),
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("usePackageSearch", () => {
  it("does not request the registry for an empty query", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { result } = renderHook(() => usePackageSearch(""));

    expect(result.current.state).toEqual({ status: "idle" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("loads results and appends a later Registry page", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      const url = new URL(String(input));
      return Promise.resolve(
        jsonResponse(
          url.searchParams.get("from") === "0"
            ? page(["alpha", "beta"], 3)
            : page(["gamma"], 3),
        ),
      );
    });

    const { result } = renderHook(() => usePackageSearch("packages"));
    await waitFor(() => expect(result.current.state.status).toBe("success"));
    expect(fetchSpy).toHaveBeenCalledOnce();

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.state).toMatchObject({
      status: "success",
      items: [{ name: "alpha" }, { name: "beta" }, { name: "gamma" }],
      nextOffset: 3,
      hasMore: false,
      loadingMore: false,
    });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(new URL(String(fetchSpy.mock.calls[1]?.[0])).searchParams.get("from")).toBe(
      "2",
    );
  });

  it("offers explicit retry after an initial network failure", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new TypeError("offline"))
      .mockResolvedValueOnce(jsonResponse(page(["react"], 1)));

    const { result } = renderHook(() => usePackageSearch("react"));
    await waitFor(() => expect(result.current.state.status).toBe("error"));
    expect(result.current.state).toMatchObject({
      status: "error",
      error: { code: "network" },
    });

    act(() => result.current.retry());
    await waitFor(() => expect(result.current.state.status).toBe("success"));
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("preserves loaded results and retries a failed load-more request", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(page(["alpha", "beta"], 3)))
      .mockResolvedValueOnce(
        new Response(null, {
          status: 429,
          headers: { "retry-after": "2" },
        }),
      )
      .mockResolvedValueOnce(jsonResponse(page(["gamma"], 3)));

    const { result } = renderHook(() => usePackageSearch("packages"));
    await waitFor(() => expect(result.current.state.status).toBe("success"));

    await act(async () => {
      await result.current.loadMore();
    });
    expect(result.current.state).toMatchObject({
      status: "success",
      items: [{ name: "alpha" }, { name: "beta" }],
      hasMore: true,
      loadMoreError: { code: "rate-limited", retryAfterSeconds: 2 },
      loadingMore: false,
    });

    await act(async () => {
      await result.current.loadMore();
    });
    expect(result.current.state).toMatchObject({
      status: "success",
      items: [{ name: "alpha" }, { name: "beta" }, { name: "gamma" }],
      hasMore: false,
      loadingMore: false,
    });
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it("ignores an old response even if the aborted request resolves late", async () => {
    const oldResponse = deferred<Response>();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      const url = new URL(String(input));
      if (url.searchParams.get("text") === "old") return oldResponse.promise;
      return Promise.resolve(jsonResponse(page(["new-package"], 1)));
    });

    const { result, rerender } = renderHook(({ query }) => usePackageSearch(query), {
      initialProps: { query: "old" },
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    rerender({ query: "new" });
    await waitFor(() =>
      expect(result.current.state).toMatchObject({
        status: "success",
        query: "new",
        items: [{ name: "new-package" }],
      }),
    );

    await act(async () => {
      oldResponse.resolve(jsonResponse(page(["old-package"], 1)));
      await oldResponse.promise;
    });

    expect(result.current.state).toMatchObject({
      status: "success",
      query: "new",
      items: [{ name: "new-package" }],
    });
  });
});
