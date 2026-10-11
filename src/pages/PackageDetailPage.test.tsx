import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "../app/App";
import { AppShell } from "../components/layout/AppShell";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function packageRecord(name = "react") {
  return {
    name,
    description: "A package summary from the Registry.",
    "dist-tags": { latest: "2.0.0" },
    time: {
      created: "2024-01-01T00:00:00.000Z",
      "1.0.0": "2024-02-01T00:00:00.000Z",
      "2.0.0": "2025-10-01T00:00:00.000Z",
    },
    versions: {
      "1.0.0": {
        name,
        version: "1.0.0",
        dependencies: { alpha: "^1.2.0" },
      },
      "2.0.0": {
        name,
        version: "2.0.0",
        description: "A package summary from the Registry.",
        keywords: ["ui", "components"],
        license: "MIT",
        repository: { type: "git", url: "git+https://github.com/example/react.git" },
        homepage: "https://example.test/react",
        dependencies: { beta: "~3.0.0" },
      },
    },
  };
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

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Package detail route", () => {
  it("renders actual metadata, release history, selected-version dependencies and safe links", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(packageRecord()))
      .mockResolvedValueOnce(
        jsonResponse({
          name: "react",
          version: "1.0.0",
          dependencies: { alpha: "^1.2.0" },
        }),
      );
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    renderRoute("/package/react");

    expect(await screen.findByRole("heading", { name: "react" })).toBeVisible();
    expect(screen.getByText("A package summary from the Registry.")).toBeVisible();
    expect(screen.getByText("MIT")).toBeVisible();
    expect(screen.getByRole("link", { name: /open repository/i })).toHaveAttribute(
      "href",
      "https://github.com/example/react.git",
    );
    expect(screen.getByRole("link", { name: /open homepage/i })).toHaveAttribute(
      "href",
      "https://example.test/react",
    );
    expect(
      screen
        .getAllByRole("link", { name: /open npm package/i })
        .every(
          (link) => link.getAttribute("href") === "https://www.npmjs.com/package/react",
        ),
    ).toBe(true);
    expect(screen.getByText("ui")).toBeVisible();
    expect(screen.getAllByText("2.0.0").length).toBeGreaterThan(0);
    expect(await screen.findByRole("link", { name: "beta" })).toBeVisible();
    expect(screen.getByText("~3.0.0")).toBeVisible();
    expect(screen.getByText("Feb 1, 2024")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Copy install command" }));
    expect(writeText).toHaveBeenCalledWith("npm install react@2.0.0");
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Install command copied.",
    );

    await user.selectOptions(screen.getByLabelText("Package version"), "1.0.0");
    await waitFor(() =>
      expect(screen.getByRole("link", { name: "alpha" })).toBeVisible(),
    );
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it("discloses bounded Registry descriptions, keywords, releases, and dependencies", async () => {
    const latestVersion = "1.0.5000";
    const versions: Record<string, Record<string, unknown>> = Object.fromEntries(
      Array.from({ length: 5_001 }, (_, index) => {
        const version = `1.0.${index}`;
        return [version, { name: "bounded-package", version }];
      }),
    );
    versions[latestVersion] = {
      name: "bounded-package",
      version: latestVersion,
      description: "d".repeat(4_097),
      keywords: Array.from({ length: 101 }, (_, index) => `keyword-${index}`),
      dependencies: Object.fromEntries(
        Array.from({ length: 2_001 }, (_, index) => [
          `dependency-${String(index).padStart(4, "0")}`,
          "^1.0.0",
        ]),
      ),
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({
        name: "bounded-package",
        "dist-tags": { latest: latestVersion },
        versions,
      }),
    );

    renderRoute("/package/bounded-package");

    expect(
      await screen.findByRole("heading", { name: "bounded-package" }),
    ).toBeVisible();
    expect(
      await screen.findByText("Description shortened to a safe display length."),
    ).toBeVisible();
    expect(
      screen.getByText("Registry keyword entries were omitted by safety limits."),
    ).toBeVisible();
    expect(screen.getByText(/more than 5,000 versions/)).toBeVisible();
    expect(
      screen.getByText(
        /Additional dependency entries were omitted after the 2,000-entry safety limit/,
      ),
    ).toBeVisible();
  });

  it("supports a scoped package name in a directly entered route", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse(packageRecord("@types/node")));

    renderRoute("/package/%40types%2Fnode");

    expect(await screen.findByRole("heading", { name: "@types/node" })).toBeVisible();
    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(String(fetchSpy.mock.calls[0]?.[0])).toBe(
      "https://registry.npmjs.org/%40types%2Fnode",
    );
  });

  it("renders Registry strings as text and omits unsafe external URL protocols", async () => {
    const record = packageRecord();
    const untrustedDescription =
      '<img src=x onerror="alert(1)"><script>alert("registry")</script>';
    record.versions["2.0.0"].description = untrustedDescription;
    record.versions["2.0.0"].keywords = ['<svg onload="alert(1)">keyword</svg>'];
    record.versions["2.0.0"].homepage = "data:text/html,<script>alert(1)</script>";
    record.versions["2.0.0"].repository = {
      type: "git",
      url: "javascript:alert(1)",
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(record));

    renderRoute("/package/react");

    expect(await screen.findByRole("heading", { name: "react" })).toBeVisible();
    expect(screen.getByText(untrustedDescription)).toBeVisible();
    expect(screen.getByText('<svg onload="alert(1)">keyword</svg>')).toBeVisible();
    expect(document.querySelector("img, script, [onerror], [onload]")).toBeNull();
    expect(screen.getAllByText("Not provided")).toHaveLength(2);
    const unsafeHrefs = Array.from(document.querySelectorAll("a"))
      .map((link) => link.getAttribute("href"))
      .filter(
        (href): href is string =>
          href !== null &&
          !/^https?:\/\//i.test(href) &&
          !href.startsWith("/") &&
          !href.startsWith("#"),
      );
    expect(unsafeHrefs).toEqual([]);
  });

  it.each(["react", "@types/node"])(
    "copies the exact package identifier for %s",
    async (packageName) => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        jsonResponse(packageRecord(packageName)),
      );
      const user = userEvent.setup();
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });

      renderRoute(`/package/${encodeURIComponent(packageName)}`);

      const heading = await screen.findByRole("heading", { name: packageName });
      const headingRegion = heading.parentElement;
      expect(headingRegion).not.toBeNull();
      await user.click(
        within(headingRegion as HTMLElement).getByRole("button", {
          name: "Copy package name",
        }),
      );

      expect(writeText).toHaveBeenCalledWith(packageName);
      expect(
        await screen.findByText("Package name copied.", {
          selector: '[role="status"]',
        }),
      ).toBeVisible();
      expect(
        screen.getByRole("button", { name: "Copy package name" }),
      ).toHaveTextContent("Copied");
    },
  );

  it("announces a usable fallback when package-name clipboard access fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(packageRecord()));
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });

    renderRoute("/package/react");
    await screen.findByRole("heading", { name: "react" });
    await user.click(screen.getByRole("button", { name: "Copy package name" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Clipboard unavailable. Select the package name above to copy it.",
    );
  });

  it("keeps every dependency reachable beyond the compact first 40", async () => {
    const dependencies = Object.fromEntries(
      Array.from({ length: 44 }, (_, index) => [
        `dependency-${String(index + 1).padStart(2, "0")}`,
        `^${index + 1}.0.0`,
      ]),
    );
    const record = packageRecord();
    record.versions["2.0.0"].dependencies = {
      beta: "~3.0.0",
      ...dependencies,
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(record));
    const user = userEvent.setup();

    renderRoute("/package/react");
    await screen.findByRole("heading", { name: "react" });
    expect(await screen.findByRole("link", { name: "dependency-39" })).toBeVisible();
    expect(
      screen.queryByRole("link", { name: "dependency-40" }),
    ).not.toBeInTheDocument();

    const showAll = screen.getByRole("button", {
      name: "Show all 45 dependencies",
    });
    expect(showAll).toHaveAttribute("aria-expanded", "false");
    await user.click(showAll);
    expect(showAll).toHaveAttribute("aria-expanded", "true");
    expect(await screen.findByRole("link", { name: "dependency-44" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Show less" }));
    expect(
      screen.queryByRole("link", { name: "dependency-44" }),
    ).not.toBeInTheDocument();
  });

  it("shows the package loading skeleton until a delayed registry response resolves", async () => {
    let resolveResponse!: (response: Response) => void;
    const responsePromise = new Promise<Response>((resolve) => {
      resolveResponse = resolve;
    });
    vi.spyOn(globalThis, "fetch").mockReturnValue(responsePromise);

    renderRoute("/package/react");

    const skeleton = screen.getByRole("status", { name: "Loading package details" });
    expect(skeleton).toHaveAttribute("aria-busy", "true");
    expect(skeleton.querySelectorAll(".skeleton-line").length).toBeGreaterThan(0);

    await act(async () => {
      resolveResponse(jsonResponse(packageRecord()));
      await responsePromise;
    });
    expect(await screen.findByRole("heading", { name: "react" })).toBeVisible();
    expect(
      screen.queryByRole("status", { name: "Loading package details" }),
    ).not.toBeInTheDocument();
  });

  it("shows an actionable error when the latest-manifest size fallback is also too large", async () => {
    const oversized = (limit: number) =>
      new Response(null, {
        status: 200,
        headers: { "content-length": String(limit + 1) },
      });
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(oversized(12 * 1024 * 1024))
      .mockResolvedValueOnce(oversized(12 * 1024 * 1024))
      .mockResolvedValueOnce(oversized(2 * 1024 * 1024));
    renderRoute("/package/huge-package");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Package metadata exceeded the safe read limit.",
    );
    expect(screen.getByRole("button", { name: "Retry package request" })).toBeVisible();
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it("distinguishes unprovided metadata and a confirmed empty dependency list", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({
        name: "minimal-package",
        "dist-tags": { latest: "1.0.0" },
        versions: {
          "1.0.0": { name: "minimal-package", version: "1.0.0" },
        },
      }),
    );

    renderRoute("/package/minimal-package");

    expect(
      await screen.findByRole("heading", { name: "minimal-package" }),
    ).toBeVisible();
    expect(screen.getAllByText("Not provided").length).toBeGreaterThan(0);
    expect(screen.getByText("Not provided by the registry.")).toBeVisible();
    expect(await screen.findByText("No dependencies are listed.")).toBeVisible();
  });

  it("shows malformed dependency data as unavailable, not as an empty group", async () => {
    const record = packageRecord();
    const response = {
      ...record,
      versions: {
        ...record.versions,
        "2.0.0": {
          ...record.versions["2.0.0"],
          dependencies: null,
        },
      },
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(response));

    renderRoute("/package/react");

    expect(await screen.findByRole("heading", { name: "react" })).toBeVisible();
    expect(
      await screen.findByText(
        "The registry did not return usable dependencies data for this version.",
      ),
    ).toBeVisible();
    expect(screen.queryByText("No dependencies are listed.")).not.toBeInTheDocument();
  });

  it("shows a package-specific 404 and offers an encoded search recovery link", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 404 }),
    );

    renderRoute("/package/%40scope%2Fmissing");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Package not found in the npm Registry.",
    );
    expect(screen.getByRole("link", { name: /search packages/i })).toHaveAttribute(
      "href",
      "/explore?q=%40scope%2Fmissing",
    );
    expect(
      screen.queryByRole("button", { name: "Retry package request" }),
    ).not.toBeInTheDocument();
  });

  it("retries after a network failure", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new TypeError("offline"))
      .mockResolvedValueOnce(jsonResponse(packageRecord()));
    const user = userEvent.setup();

    renderRoute("/package/react");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't reach the npm Registry.",
    );
    await user.click(screen.getByRole("button", { name: "Retry package request" }));
    expect(await screen.findByRole("heading", { name: "react" })).toBeVisible();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("keeps failed version data unavailable and retries that selected release", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(packageRecord()))
      .mockResolvedValueOnce(
        new Response(null, {
          status: 429,
          headers: { "retry-after": "3" },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          name: "react",
          version: "1.0.0",
          dependencies: { alpha: "^1.2.0" },
        }),
      );
    const user = userEvent.setup();

    renderRoute("/package/react");
    expect(await screen.findByRole("heading", { name: "react" })).toBeVisible();
    await user.selectOptions(screen.getByLabelText("Package version"), "1.0.0");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The npm Registry is limiting version requests.",
    );
    expect(screen.queryByText("No dependencies are listed.")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry version details" }));
    expect(await screen.findByRole("link", { name: "alpha" })).toBeVisible();
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it("does not issue a request for an invalid package identifier", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    renderRoute("/package/Bad_Name");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "That package name is not valid.",
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
