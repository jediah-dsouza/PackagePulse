import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MAX_PACKAGE_METADATA_BYTES } from "../../services/npmRegistry/npmRegistryService";
import { usePackageDetails } from "./usePackageDetails";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function packument(name: string, latest = "2.0.0") {
  return {
    name,
    "dist-tags": { latest },
    time: { "1.0.0": "2024-01-01T00:00:00.000Z", "2.0.0": "2025-01-01T00:00:00.000Z" },
    versions: {
      "1.0.0": { name, version: "1.0.0", dependencies: { alpha: "^1" } },
      "2.0.0": { name, version: "2.0.0", dependencies: { beta: "^2" } },
    },
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("usePackageDetails", () => {
  it("loads one package record and uses its preloaded latest-version dependency data", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse(packument("@types/node")));

    const { result } = renderHook(() => usePackageDetails("@types/node"));

    await waitFor(() => expect(result.current.state.status).toBe("success"));
    await waitFor(() =>
      expect(result.current.versionState).toMatchObject({
        status: "success",
        version: "2.0.0",
      }),
    );
    expect(result.current.versionState).toMatchObject({
      status: "success",
      details: {
        dependencyGroups: expect.arrayContaining([
          {
            kind: "dependencies",
            status: "available",
            items: [{ name: "beta", range: "^2" }],
          },
        ]),
      },
    });
    expect(result.current.selectedVersion).toBe("2.0.0");
    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  it("fetches only an explicitly selected older version and reuses its cached record", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(packument("react")))
      .mockResolvedValueOnce(
        jsonResponse({
          name: "react",
          version: "1.0.0",
          dependencies: { alpha: "^1.0.0" },
        }),
      );
    const { result } = renderHook(() => usePackageDetails("react"));

    await waitFor(() => expect(result.current.state.status).toBe("success"));
    await waitFor(() => expect(result.current.versionState.status).toBe("success"));

    act(() => result.current.selectVersion("1.0.0"));
    await waitFor(() =>
      expect(result.current.versionState).toMatchObject({
        status: "success",
        version: "1.0.0",
      }),
    );
    expect(fetchSpy).toHaveBeenCalledTimes(2);

    act(() => result.current.selectVersion("2.0.0"));
    await waitFor(() =>
      expect(result.current.versionState).toMatchObject({
        status: "success",
        version: "2.0.0",
      }),
    );
    act(() => result.current.selectVersion("1.0.0"));
    await waitFor(() =>
      expect(result.current.versionState).toMatchObject({
        status: "success",
        version: "1.0.0",
      }),
    );
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("fetches the selected version after falling back to abbreviated package metadata", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(null, {
          status: 200,
          headers: { "content-length": String(MAX_PACKAGE_METADATA_BYTES + 1) },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          name: "@types/node",
          "dist-tags": { latest: "26.0.0" },
          versions: {
            "26.0.0": { name: "@types/node", version: "26.0.0" },
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          name: "@types/node",
          version: "26.0.0",
          dependencies: { undici: "^6.0.0" },
        }),
      );
    const { result } = renderHook(() => usePackageDetails("@types/node"));

    await waitFor(() => expect(result.current.state.status).toBe("success"));
    await waitFor(() =>
      expect(result.current.versionState).toMatchObject({
        status: "success",
        version: "26.0.0",
      }),
    );
    if (result.current.versionState.status !== "success") {
      throw new Error("Expected selected version metadata to be loaded.");
    }
    expect(
      result.current.versionState.details.dependencyGroups.find(
        (group) => group.kind === "dependencies",
      ),
    ).toMatchObject({
      status: "available",
      items: [{ name: "undici", range: "^6.0.0" }],
    });
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it("aborts and ignores a late response after navigating to another package", async () => {
    const firstResponse = deferred<Response>();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      const url = String(input);
      if (url.endsWith("/old-package")) return firstResponse.promise;
      return Promise.resolve(jsonResponse(packument("@scope/new-package")));
    });

    const { result, rerender } = renderHook(
      ({ packageName }) => usePackageDetails(packageName),
      { initialProps: { packageName: "old-package" } },
    );

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledOnce());
    rerender({ packageName: "@scope/new-package" });
    await waitFor(() =>
      expect(result.current.state).toMatchObject({
        status: "success",
        packageName: "@scope/new-package",
      }),
    );

    await act(async () => {
      firstResponse.resolve(jsonResponse(packument("old-package")));
      await firstResponse.promise;
    });
    expect(result.current.details?.name).toBe("@scope/new-package");
  });

  it("shows an invalid-name state without making a network request", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { result } = renderHook(() => usePackageDetails("Bad_Name"));

    await waitFor(() => expect(result.current.state.status).toBe("invalid-name"));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("retries a failed selected-version request", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(packument("react")))
      .mockRejectedValueOnce(new TypeError("offline"))
      .mockResolvedValueOnce(
        jsonResponse({
          name: "react",
          version: "1.0.0",
          dependencies: { alpha: "^1.0.0" },
        }),
      );
    const { result } = renderHook(() => usePackageDetails("react"));

    await waitFor(() => expect(result.current.state.status).toBe("success"));
    await waitFor(() => expect(result.current.versionState.status).toBe("success"));

    act(() => result.current.selectVersion("1.0.0"));
    await waitFor(() =>
      expect(result.current.versionState).toMatchObject({
        status: "error",
        version: "1.0.0",
        error: { code: "network" },
      }),
    );
    act(() => result.current.retryVersion());
    await waitFor(() =>
      expect(result.current.versionState).toMatchObject({
        status: "success",
        version: "1.0.0",
      }),
    );
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });
});
