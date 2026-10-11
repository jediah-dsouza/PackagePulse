import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "../app/App";
import { AppShell } from "../components/layout/AppShell";
import { COMPARISON_STORAGE_KEY } from "../features/comparison/comparisonStorage";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function packageRecord(
  name: string,
  dependencies: unknown = {},
  options: { license?: string; homepage?: string; keywords?: string[] } = {},
) {
  const latestManifest: Record<string, unknown> = {
    name,
    version: "2.4.1",
    license: options.license ?? "MIT",
    dependencies,
    peerDependencies: {},
    optionalDependencies: {},
  };
  if (options.homepage) latestManifest.homepage = options.homepage;
  if (options.keywords) latestManifest.keywords = options.keywords;
  return {
    name,
    description: `Metadata for ${name}.`,
    "dist-tags": { latest: "2.4.1" },
    time: { "2.4.1": "2025-05-12T00:00:00.000Z" },
    versions: { "2.4.1": latestManifest },
  };
}

function searchResponse(names: string[]) {
  return {
    total: names.length,
    objects: names.map((name) => ({
      package: {
        name,
        description: `Search summary for ${name}.`,
        version: "2.4.1",
        keywords: ["ui"],
      },
    })),
  };
}

function renderCompare(path = "/compare") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppShell>
        <AppRoutes />
      </AppShell>
    </MemoryRouter>,
  );
}

function installRegistryMock(
  options: {
    packageNames?: string[];
    unavailableName?: string;
    emptyName?: string;
    failFirstFor?: string;
  } = {},
) {
  const packageNames = options.packageNames ?? [];
  const callCounts = new Map<string, number>();
  const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = new URL(String(input));
    if (url.pathname === "/-/v1/search") {
      return jsonResponse(searchResponse(packageNames));
    }
    const name = decodeURIComponent(url.pathname.slice(1));
    const nextCount = (callCounts.get(name) ?? 0) + 1;
    callCounts.set(name, nextCount);
    if (name === options.failFirstFor && nextCount === 1) {
      return new Response("temporarily unavailable", { status: 503 });
    }
    if (name === options.unavailableName) {
      return jsonResponse(packageRecord(name, null));
    }
    if (name === options.emptyName) {
      return jsonResponse(packageRecord(name));
    }
    return jsonResponse(packageRecord(name, { alpha: "^1.0.0" }));
  });
  return { fetchMock, callCounts };
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("Compare page", () => {
  it("adds packages from Registry search, persists unique selections, and opens the comparison", async () => {
    installRegistryMock({ packageNames: ["react", "react-dom"] });
    const user = userEvent.setup();
    renderCompare();

    expect(
      screen.getByRole("heading", { name: "Choose packages to compare" }),
    ).toBeVisible();
    await user.type(
      screen.getByRole("searchbox", { name: /package name or keyword/i }),
      "react",
    );
    await user.click(screen.getByRole("button", { name: "Search packages" }));

    await user.click(
      await screen.findByRole("button", { name: "Add react to comparison" }),
    );
    expect(await screen.findByText("react added to comparison.")).toBeVisible();
    expect(
      await screen.findByRole("link", { name: "Compare, 1 selected" }),
    ).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: "Add react-dom to comparison" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Metadata comparison" }),
    ).toBeVisible();
    await waitFor(() => {
      expect(
        JSON.parse(window.localStorage.getItem(COMPARISON_STORAGE_KEY) ?? "[]"),
      ).toEqual(["react", "react-dom"]);
    });
    expect(
      screen.getByRole("link", { name: "Open details for react" }),
    ).toHaveAttribute("href", "/package/react");
    expect(screen.getByRole("columnheader", { name: /react-dom/i })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Clear comparison" }));
    expect(
      await screen.findByRole("heading", { name: "Choose packages to compare" }),
    ).toBeVisible();
    await waitFor(() => {
      expect(
        JSON.parse(window.localStorage.getItem(COMPARISON_STORAGE_KEY) ?? "null"),
      ).toEqual([]);
    });
  });

  it("keeps one failed package isolated and distinguishes an empty dependency list from unavailable data", async () => {
    const { callCounts } = installRegistryMock({
      packageNames: ["good-package", "unavailable-package"],
      unavailableName: "unavailable-package",
      emptyName: "good-package",
      failFirstFor: "unavailable-package",
    });
    window.localStorage.setItem(
      COMPARISON_STORAGE_KEY,
      JSON.stringify(["good-package", "unavailable-package"]),
    );
    const user = userEvent.setup();
    renderCompare();

    const table = await screen.findByRole("table", {
      name: "Available npm Registry metadata for the selected packages",
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The npm Registry is temporarily unavailable.",
    );
    expect(within(table).getByRole("rowheader", { name: "License" })).toBeVisible();
    expect(within(table).getByText("MIT")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Retry package" }));
    await waitFor(() => expect(callCounts.get("unavailable-package")).toBe(2));
    expect(await screen.findByText("0 dependencies listed")).toBeVisible();
    expect(await screen.findByText("Dependency data unavailable")).toBeVisible();
    expect(
      within(table).getByRole("rowheader", { name: "Package keywords" }),
    ).toBeVisible();
  });

  it("distinguishes omitted keywords from keywords not provided", async () => {
    window.localStorage.setItem(
      COMPARISON_STORAGE_KEY,
      JSON.stringify(["omitted-keywords", "no-keywords"]),
    );
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const name = decodeURIComponent(new URL(String(input)).pathname.slice(1));
      const keywords = name === "omitted-keywords" ? ["k".repeat(129)] : undefined;
      return jsonResponse(
        packageRecord(name, { alpha: "^1.0.0" }, keywords ? { keywords } : {}),
      );
    });
    renderCompare();

    const table = await screen.findByRole("table", {
      name: "Available npm Registry metadata for the selected packages",
    });
    const keywordRow = within(table).getByRole("row", {
      name: /Package keywords/,
    });

    expect(
      within(keywordRow).getByText("Keyword entries omitted by safety limits"),
    ).toBeVisible();
    expect(within(keywordRow).getByText("Not provided")).toBeVisible();
  });

  it("shows comparison loading status and skeleton cells until both package records resolve", async () => {
    window.localStorage.setItem(
      COMPARISON_STORAGE_KEY,
      JSON.stringify(["alpha", "beta"]),
    );
    const pending: Array<() => void> = [];
    vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      const name = decodeURIComponent(new URL(String(input)).pathname.slice(1));
      return new Promise<Response>((resolve) => {
        pending.push(() => resolve(jsonResponse(packageRecord(name))));
      });
    });
    renderCompare();

    expect(await screen.findAllByText("Loading metadata…")).toHaveLength(2);
    expect(document.querySelectorAll(".comparison-skeleton").length).toBeGreaterThan(0);
    expect(screen.getByRole("region", { name: "Package comparison" })).toHaveAttribute(
      "tabindex",
      "0",
    );

    await act(async () => {
      pending.forEach((resolve) => resolve());
    });
    expect(await screen.findAllByText("MIT")).toHaveLength(2);
    expect(document.querySelectorAll(".comparison-skeleton")).toHaveLength(0);
  });

  it("retries unavailable dependency metadata without reloading the package columns", async () => {
    let alphaMetadataRequests = 0;
    let betaMetadataRequests = 0;
    let alphaVersionRequests = 0;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = new URL(String(input));
      if (url.pathname === "/alpha/2.4.1") {
        alphaVersionRequests += 1;
        return alphaVersionRequests === 1
          ? new Response("temporarily unavailable", { status: 503 })
          : jsonResponse({
              name: "alpha",
              version: "2.4.1",
              dependencies: { dependency: "^1.0.0" },
            });
      }
      if (url.pathname === "/alpha") {
        alphaMetadataRequests += 1;
        const record = packageRecord("alpha");
        Reflect.deleteProperty(record, "versions");
        return jsonResponse(record);
      }
      betaMetadataRequests += 1;
      return jsonResponse(packageRecord("beta"));
    });
    window.localStorage.setItem(
      COMPARISON_STORAGE_KEY,
      JSON.stringify(["alpha", "beta"]),
    );
    const user = userEvent.setup();
    renderCompare();

    expect(
      await screen.findByRole("button", { name: "Retry dependency data" }),
    ).toBeVisible();
    expect(await screen.findByText("0 dependencies listed")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Retry dependency data" }));

    expect(await screen.findByText("1 dependencies listed")).toBeVisible();
    expect(alphaMetadataRequests).toBe(1);
    expect(betaMetadataRequests).toBe(1);
    expect(alphaVersionRequests).toBe(2);
  });

  it("enforces three unique packages and allows removals from the table", async () => {
    installRegistryMock({
      packageNames: ["react", "react-dom", "react-router", "vite"],
    });
    window.localStorage.setItem(
      COMPARISON_STORAGE_KEY,
      JSON.stringify(["react", "react-dom"]),
    );
    const user = userEvent.setup();
    renderCompare();

    await user.type(
      screen.getByRole("searchbox", { name: /package name or keyword/i }),
      "react",
    );
    await user.click(screen.getByRole("button", { name: "Search packages" }));
    await user.click(
      await screen.findByRole("button", { name: "Add react-router to comparison" }),
    );

    expect(
      await screen.findByRole("link", { name: "Compare, 3 selected" }),
    ).toBeVisible();
    expect(screen.getByText(/three packages are selected/i)).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: "Comparison limit reached; cannot add vite",
      }),
    ).toBeDisabled();

    await user.click(
      screen.getAllByRole("button", { name: "Remove react-dom from comparison" })[0]!,
    );
    expect(
      await screen.findByRole("link", { name: "Compare, 2 selected" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Add vite to comparison" }),
    ).toBeEnabled();
  });

  it("provides retry when Registry search in the picker fails", async () => {
    let searches = 0;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      if (new URL(String(input)).pathname === "/-/v1/search") {
        searches += 1;
        return searches === 1
          ? new Response("offline", { status: 503 })
          : jsonResponse(searchResponse([]));
      }
      return jsonResponse(packageRecord("react"));
    });
    const user = userEvent.setup();
    renderCompare();
    await user.type(
      screen.getByRole("searchbox", { name: /package name or keyword/i }),
      "missing",
    );
    await user.click(screen.getByRole("button", { name: "Search packages" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The npm Registry is temporarily unavailable.",
    );
    await user.click(screen.getByRole("button", { name: "Retry package search" }));
    expect(
      await screen.findByText(/No npm packages found for “missing”/),
    ).toBeVisible();
    expect(searches).toBe(2);
  });

  it("exposes the comparison table as a keyboard-scrollable region with real headers", async () => {
    installRegistryMock();
    window.localStorage.setItem(
      COMPARISON_STORAGE_KEY,
      JSON.stringify(["react", "@types/node"]),
    );
    renderCompare();

    const region = await screen.findByRole("region", { name: "Package comparison" });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("columnheader", { name: "Field" })).toBeVisible();
    expect(screen.getByRole("rowheader", { name: "Latest version" })).toBeVisible();
    expect(
      screen.queryByRole("rowheader", { name: /weekly downloads/i }),
    ).not.toBeInTheDocument();
  });
});
