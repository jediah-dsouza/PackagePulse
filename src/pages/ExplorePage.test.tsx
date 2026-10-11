import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CompareSelectionProvider } from "../features/comparison/CompareSelectionContext";
import { SavedPackagesProvider } from "../features/saved/SavedPackagesProvider";
import { ExplorePage } from "./ExplorePage";

function searchResponse(
  packages: Array<Record<string, unknown>>,
  total = packages.length,
) {
  return new Response(JSON.stringify({ objects: packages, total }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function packageRecord(
  name: string,
  keywords: string[],
  extras: Record<string, unknown> = {},
) {
  return {
    package: {
      name,
      description: `${name} package description`,
      version: "1.2.3",
      keywords,
      ...extras,
    },
  };
}

function LocationText() {
  const location = useLocation();
  return (
    <output data-testid="location">
      {location.pathname}
      {location.search}
    </output>
  );
}

function renderExplore(initialEntry = "/explore") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <SavedPackagesProvider>
        <CompareSelectionProvider>
          <LocationText />
          <ExplorePage />
        </CompareSelectionProvider>
      </SavedPackagesProvider>
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Explore search interactions", () => {
  it("shows initial guidance and avoids an empty-query request", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    renderExplore();

    expect(
      screen.getByText(/Search the public npm Registry by package name or keyword/),
    ).toBeVisible();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("shows loading skeletons while the registry request is pending", async () => {
    let resolveResponse: ((response: Response) => void) | undefined;
    const pendingResponse = new Promise<Response>((resolve) => {
      resolveResponse = resolve;
    });
    vi.spyOn(globalThis, "fetch").mockReturnValue(pendingResponse);
    renderExplore("/explore?q=react");

    expect(screen.getByText(/Searching the npm Registry/)).toHaveAttribute(
      "role",
      "status",
    );
    expect(document.querySelectorAll(".search-skeleton")).toHaveLength(3);
    expect(screen.getByRole("region", { name: "Packages" })).toHaveAttribute(
      "aria-busy",
      "true",
    );

    resolveResponse?.(searchResponse([packageRecord("react", ["ui"])]));
    expect(
      await screen.findByRole("link", { name: /package details for react/i }),
    ).toBeVisible();
  });

  it("submits immediately with Enter and synchronizes the query in the URL", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(searchResponse([packageRecord("react", ["ui"])]));
    const user = userEvent.setup();
    renderExplore();

    await user.type(
      screen.getByRole("searchbox", { name: "Package name or keyword" }),
      "react{Enter}",
    );

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledOnce());
    expect(screen.getByTestId("location")).toHaveTextContent("/explore?q=react");
    expect(
      await screen.findByRole("link", { name: /package details for react/i }),
    ).toBeVisible();
    expect(new URL(String(fetchSpy.mock.calls[0]?.[0])).searchParams.get("text")).toBe(
      "react",
    );
  });

  it("debounces typing by 300 ms before updating the URL and requesting", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(searchResponse([packageRecord("vite", ["build"])]));
    const user = userEvent.setup();
    renderExplore();

    await user.type(
      screen.getByRole("searchbox", { name: "Package name or keyword" }),
      "vite",
    );
    expect(fetchSpy).not.toHaveBeenCalled();

    await new Promise((resolve) => setTimeout(resolve, 350));
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledOnce());
    expect(screen.getByTestId("location")).toHaveTextContent("/explore?q=vite");
    expect(
      await screen.findByRole("link", { name: /package details for vite/i }),
    ).toBeVisible();
  });

  it("restores a scoped search query from the URL and clears it accessibly", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(searchResponse([packageRecord("@scope/pkg", ["types"])]));
    const user = userEvent.setup();
    renderExplore("/explore?q=%40scope%2Fpkg");

    const input = screen.getByRole("searchbox", {
      name: "Package name or keyword",
    });
    expect(input).toHaveValue("@scope/pkg");
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledOnce());
    expect(new URL(String(fetchSpy.mock.calls[0]?.[0])).searchParams.get("text")).toBe(
      "@scope/pkg",
    );
    expect(
      await screen.findByRole("link", { name: /package details for @scope\/pkg/i }),
    ).toHaveAttribute("href", "/package/%40scope%2Fpkg");

    await user.click(screen.getByRole("button", { name: "Clear search" }));
    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
    expect(screen.getByTestId("location")).toHaveTextContent("/explore");
  });

  it.each([
    ["misleading host", "https://attacker.example/package/react"],
    ["unsafe protocol", "javascript:alert(1)"],
  ])("never uses %s npm link metadata in a result action", async (_label, npm) => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      searchResponse([
        packageRecord("@types/node", [], {
          links: { npm },
        }),
      ]),
    );
    renderExplore("/explore?q=types");

    const npmLink = await screen.findByRole("link", {
      name: "Open npm page (new tab)",
    });
    expect(npmLink).toHaveAttribute(
      "href",
      "https://www.npmjs.com/package/@types/node",
    );
    expect(npmLink).toHaveAttribute("target", "_blank");
    expect(npmLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("filters by returned keywords, sorts loaded results, and recovers from filtered-empty", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      searchResponse([
        packageRecord("zeta-ui", ["ui", "react"], {
          date: "2025-01-01T00:00:00.000Z",
        }),
        packageRecord("alpha-ui", ["ui"], {
          date: "2026-01-01T00:00:00.000Z",
        }),
        packageRecord("router-kit", ["routing"]),
      ]),
    );
    const user = userEvent.setup();
    renderExplore("/explore?q=ui");

    expect(
      await screen.findByRole("link", { name: /package details for zeta-ui/i }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: /package details for router-kit/i }),
    ).toBeVisible();

    await user.click(screen.getAllByRole("button", { name: "ui", pressed: false })[0]!);
    expect(screen.getByTestId("location")).toHaveTextContent("keyword=ui");
    expect(
      screen.getByRole("link", { name: /package details for alpha-ui/i }),
    ).toBeVisible();
    expect(
      screen.queryByRole("link", { name: /package details for router-kit/i }),
    ).not.toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Sort loaded results" }),
      "name",
    );
    expect(screen.getByTestId("location")).toHaveTextContent("sort=name");

    await user.clear(screen.getByRole("textbox", { name: "Keyword filter" }));
    await user.type(screen.getByRole("textbox", { name: "Keyword filter" }), "missing");
    expect(await screen.findByText(/No loaded results match “missing”/)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Clear keyword filter" }));
    expect(
      screen.getByRole("link", { name: /package details for router-kit/i }),
    ).toBeVisible();
  });

  it("shows a rate-limit message and retries explicitly", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(null, {
          status: 429,
          headers: { "retry-after": "5" },
        }),
      )
      .mockResolvedValueOnce(searchResponse([packageRecord("react", ["ui"])]));
    const user = userEvent.setup();
    renderExplore();

    await user.type(
      screen.getByRole("searchbox", { name: "Package name or keyword" }),
      "react{Enter}",
    );
    expect(
      await screen.findByText(/The npm Registry is limiting requests/),
    ).toBeVisible();
    expect(screen.getByText(/wait at least 5 seconds/i)).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Retry search" }));
    expect(
      await screen.findByRole("link", { name: /package details for react/i }),
    ).toBeVisible();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("preserves existing rows and offers a retry after Load more fails", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        searchResponse(
          [packageRecord("alpha", ["ui"]), packageRecord("beta", ["ui"])],
          3,
        ),
      )
      .mockResolvedValueOnce(
        new Response(null, {
          status: 429,
          headers: { "retry-after": "2" },
        }),
      )
      .mockResolvedValueOnce(searchResponse([packageRecord("gamma", ["ui"])], 3));
    const user = userEvent.setup();
    renderExplore("/explore?q=packages");

    expect(
      await screen.findByRole("link", { name: /package details for alpha/i }),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Load more" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /wait at least 2 seconds/i,
    );
    expect(
      screen.getByRole("link", { name: /package details for beta/i }),
    ).toBeVisible();
    expect(screen.queryByRole("button", { name: "Load more" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retry loading more" }));
    expect(
      await screen.findByRole("link", { name: /package details for gamma/i }),
    ).toBeVisible();
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });
});
