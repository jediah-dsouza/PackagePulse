import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "../app/App";
import { AppShell } from "../components/layout/AppShell";
import { SAVED_PACKAGES_STORAGE_KEY } from "../features/saved/savedStorage";

function packageRecord(name: string) {
  return {
    name,
    description: `A registry description for ${name}.`,
    "dist-tags": { latest: "2.1.0" },
    time: {
      "2.1.0": "2025-05-12T08:30:00.000Z",
    },
    versions: {
      "2.1.0": {
        name,
        version: "2.1.0",
        license: "MIT",
        dependencies: {},
      },
    },
  };
}

function response(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function renderRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppShell>
        <AppRoutes />
      </AppShell>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Saved packages", () => {
  it("saves a scoped package from its detail page and opens its populated Saved record", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = new URL(String(input));
      const name = decodeURIComponent(url.pathname.slice(1));
      return response(packageRecord(name));
    });
    const user = userEvent.setup();
    renderRoute("/package/%40types%2Fnode");

    expect(await screen.findByRole("heading", { name: "@types/node" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Save @types/node" }));
    expect(
      await screen.findByText("@types/node saved in this browser.", {
        selector: ".toast-region__message",
      }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Saved, 1 package" })).toBeVisible();

    await user.click(screen.getByRole("link", { name: "Saved, 1 package" }));
    expect(await screen.findByRole("heading", { name: "@types/node" })).toBeVisible();
    expect(
      await screen.findByText("A registry description for @types/node."),
    ).toBeVisible();
    expect(screen.getByText("2.1.0")).toBeVisible();
    expect(window.localStorage.getItem(SAVED_PACKAGES_STORAGE_KEY)).toBe(
      JSON.stringify({ version: 1, names: ["@types/node"] }),
    );
  });

  it("restores a valid list, removes an entry, announces it, and shows the empty state", async () => {
    window.localStorage.setItem(
      SAVED_PACKAGES_STORAGE_KEY,
      JSON.stringify({ version: 1, names: ["react"] }),
    );
    vi.spyOn(globalThis, "fetch").mockResolvedValue(response(packageRecord("react")));
    const user = userEvent.setup();
    renderRoute("/saved");

    const packageLink = await screen.findByRole("link", {
      name: "react",
    });
    expect(packageLink).toHaveAttribute("href", "/package/react");
    expect(screen.getByRole("link", { name: "Saved, 1 package" })).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: "Remove react from saved packages" }),
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      "react removed from saved packages.",
    );
    expect(
      await screen.findByRole("heading", { name: "A place for your shortlist" }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Saved" })).toBeVisible();
    expect(window.localStorage.getItem(SAVED_PACKAGES_STORAGE_KEY)).toBe(
      JSON.stringify({ version: 1, names: [] }),
    );
  });

  it("recovers from malformed saved data without crashing or retaining duplicate names", async () => {
    window.localStorage.setItem(
      SAVED_PACKAGES_STORAGE_KEY,
      JSON.stringify({ version: 1, names: ["react", "react", "invalid name"] }),
    );
    vi.spyOn(globalThis, "fetch").mockResolvedValue(response(packageRecord("react")));
    renderRoute("/saved");

    expect(await screen.findByText("Saved list recovered")).toBeVisible();
    expect(await screen.findByRole("link", { name: "react" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Saved, 1 package" })).toBeVisible();
    await waitFor(() => {
      expect(window.localStorage.getItem(SAVED_PACKAGES_STORAGE_KEY)).toBe(
        JSON.stringify({ version: 1, names: ["react"] }),
      );
    });
  });

  it("renders an explicit session-only fallback when local-storage reads are blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Storage blocked", "SecurityError");
    });
    renderRoute("/saved");

    expect(screen.getByText("Browser storage is unavailable")).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "A place for your shortlist" }),
    ).toBeVisible();
  });

  it("synchronizes a changed saved list from another browser tab", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      response(packageRecord("@types/node")),
    );
    renderRoute("/saved");

    const serialized = JSON.stringify({ version: 1, names: ["@types/node"] });
    window.localStorage.setItem(SAVED_PACKAGES_STORAGE_KEY, serialized);
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: SAVED_PACKAGES_STORAGE_KEY,
        newValue: serialized,
      }),
    );

    expect(await screen.findByRole("link", { name: "@types/node" })).toHaveAttribute(
      "href",
      "/package/%40types%2Fnode",
    );
  });

  it("announces the metadata loading state before a saved record resolves", async () => {
    window.localStorage.setItem(
      SAVED_PACKAGES_STORAGE_KEY,
      JSON.stringify({ version: 1, names: ["react"] }),
    );
    let resolveResponse: ((response: Response) => void) | undefined;
    vi.spyOn(globalThis, "fetch").mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveResponse = resolve;
      }),
    );
    renderRoute("/saved");

    expect(
      screen.getByRole("status", { name: "Loading metadata for react" }),
    ).toBeVisible();
    resolveResponse?.(response(packageRecord("react")));
    expect(await screen.findByText("A registry description for react.")).toBeVisible();
  });

  it("keeps an unavailable package saved and offers retry for transient metadata failures", async () => {
    window.localStorage.setItem(
      SAVED_PACKAGES_STORAGE_KEY,
      JSON.stringify({ version: 1, names: ["react"] }),
    );
    vi.spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(response(packageRecord("react")));
    const user = userEvent.setup();
    renderRoute("/saved");

    expect(
      await screen.findByText(
        "Could not reach the npm Registry. Check your connection and retry.",
      ),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Retry metadata" }));
    expect(await screen.findByText("A registry description for react.")).toBeVisible();
    expect(screen.getByRole("link", { name: "react" })).toHaveAttribute(
      "href",
      "/package/react",
    );
  });

  it("keeps a package saved when the Registry reports that it no longer exists", async () => {
    window.localStorage.setItem(
      SAVED_PACKAGES_STORAGE_KEY,
      JSON.stringify({ version: 1, names: ["removed-package"] }),
    );
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Not found", { status: 404 }),
    );
    renderRoute("/saved");

    expect(await screen.findByText(/could not find this package/)).toBeVisible();
    expect(screen.getByRole("link", { name: "removed-package" })).toHaveAttribute(
      "href",
      "/package/removed-package",
    );
    expect(
      screen.getByRole("button", {
        name: "Remove removed-package from saved packages",
      }),
    ).toBeVisible();
  });

  it("keeps save/remove usable in memory when writes are blocked", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(response(packageRecord("react")));
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage blocked", "SecurityError");
    });
    const user = userEvent.setup();
    renderRoute("/package/react");

    await screen.findByRole("heading", { name: "react" });
    await user.click(screen.getByRole("button", { name: "Save react" }));
    expect(
      await screen.findByText(
        "react saved for this session only because browser storage is unavailable.",
        { selector: ".toast-region__message" },
      ),
    ).toBeVisible();
    await user.click(screen.getByRole("link", { name: "Saved, 1 package" }));
    expect(await screen.findByText("Browser storage is unavailable")).toBeVisible();
    expect(await screen.findByRole("link", { name: "react" })).toBeVisible();

    const card = screen.getByRole("listitem");
    await user.click(
      within(card).getByRole("button", { name: "Remove react from saved packages" }),
    );
    expect(
      await screen.findByRole("heading", { name: "A place for your shortlist" }),
    ).toBeVisible();
  });
});
