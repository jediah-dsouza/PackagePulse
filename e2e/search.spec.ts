import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const searchEndpoint = "**/registry.npmjs.org/-/v1/search**";
const viewports = [
  { width: 360, height: 800 },
  { width: 768, height: 1024 },
  { width: 1280, height: 900 },
] as const;

function registryPackage(
  name: string,
  keywords: string[],
  extras: Record<string, unknown> = {},
) {
  return {
    package: {
      name,
      description: `${name} is a package for deterministic search testing.`,
      version: "2.4.1",
      keywords,
      license: "MIT",
      date: "2026-05-12T08:30:00.000Z",
      links: {
        npm: `https://www.npmjs.com/package/${name}`,
        repository: "git+https://github.com/example/project.git",
      },
      ...extras,
    },
  };
}

async function fulfillJson(
  page: Page,
  handler: (url: URL) => {
    body: unknown;
    status?: number;
    headers?: Record<string, string>;
  },
) {
  await page.route(searchEndpoint, async (route) => {
    const result = handler(new URL(route.request().url()));
    await route.fulfill({
      status: result.status ?? 200,
      contentType: "application/json",
      headers: result.headers,
      body: JSON.stringify(result.body),
    });
  });
}

test("search results remain legible at mobile, tablet, and desktop widths", async ({
  page,
}, testInfo) => {
  await fulfillJson(page, () => ({
    body: {
      total: 3,
      objects: [
        registryPackage("@scope/ui-kit", ["react", "ui"], {
          description: "A scoped component toolkit.",
        }),
        registryPackage("react", ["ui", "library"]),
        registryPackage("react-router", ["react", "router"]),
      ],
    },
  }));

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/explore");
    await expect(
      page.getByText(/Search the public npm Registry by package name or keyword/),
    ).toBeVisible();
    const initialPath = testInfo.outputPath(
      `phase2/explore-initial-${viewport.width}.png`,
    );
    await mkdir(dirname(initialPath), { recursive: true });
    await page.screenshot({ path: initialPath, fullPage: true });

    await page.goto("/explore?q=react");
    await expect(
      page.getByRole("link", {
        name: "Open package details for react",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Copy install command" }).first(),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
      `Explore at ${viewport.width}px`,
    ).toBeLessThanOrEqual(viewport.width);

    const screenshotPath = testInfo.outputPath(
      `phase2/explore-results-${viewport.width}.png`,
    );
    await mkdir(dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath, fullPage: true });
    if (viewport.width === 1280) {
      const accessibility = await new AxeBuilder({ page }).analyze();
      expect(accessibility.violations).toEqual([]);
    }
  }
});

test("loading skeleton is announced while a search is pending", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 360, height: 800 });
  let releaseResponse: (() => void) | undefined;
  const responseGate = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });
  await page.route(searchEndpoint, async (route) => {
    await responseGate;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        total: 1,
        objects: [registryPackage("react", ["ui"])],
      }),
    });
  });

  await page.goto("/explore?q=react");
  await expect(page.getByRole("status")).toContainText(/Searching the npm Registry/);
  await expect(page.locator(".search-skeleton")).toHaveCount(3);

  const screenshotPath = testInfo.outputPath("phase2/explore-loading-360.png");
  await mkdir(dirname(screenshotPath), { recursive: true });
  await page.screenshot({ path: screenshotPath, fullPage: true });

  releaseResponse?.();
  await expect(
    page.getByRole("button", { name: "Copy install command" }),
  ).toBeVisible();
});

test("loads another API page, filters returned keywords, sorts, and copies the command", async ({
  page,
  context,
}) => {
  const offsets: string[] = [];
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await fulfillJson(page, (url) => {
    const offset = url.searchParams.get("from") ?? "0";
    offsets.push(offset);
    if (offset === "0") {
      return {
        body: {
          total: 4,
          objects: [
            registryPackage("zeta-ui", ["ui", "react"]),
            registryPackage("@scope/ui-kit", ["ui", "components"]),
            registryPackage("alpha-router", ["router"]),
          ],
        },
      };
    }
    return {
      body: {
        total: 4,
        objects: [registryPackage("omega", ["utilities"])],
      },
    };
  });

  await page.goto("/explore?q=toolkit");
  await expect(
    page.getByRole("link", { name: "Open package details for zeta-ui" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Copy install command" }).first().click();
  await expect(page.getByText("Install command copied.").first()).toBeAttached();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe("npm install zeta-ui");

  await page.getByRole("button", { name: "Load more" }).click();
  await expect(
    page.getByRole("link", { name: "Open package details for omega" }),
  ).toBeVisible();
  expect(offsets.at(-1)).toBe("3");
  expect(offsets.filter((offset) => offset === "3")).toHaveLength(1);

  const sort = page.getByRole("combobox", { name: "Sort loaded results" });
  await sort.selectOption("name");
  await expect(page).toHaveURL(/sort=name/);
  const names = await page.locator(".package-result__name").allTextContents();
  expect(names).toEqual(
    [...names].sort((left, right) =>
      left.localeCompare(right, undefined, { sensitivity: "base" }),
    ),
  );

  await page.getByRole("button", { name: "ui" }).first().click();
  await expect(page).toHaveURL(/keyword=ui/);
  await expect(page.locator(".package-result__name")).toHaveText([
    "@scope/ui-kit",
    "zeta-ui",
  ]);
});

test("URL query is restored on reload and browser back/forward", async ({ page }) => {
  const searches: string[] = [];
  await fulfillJson(page, (url) => {
    const query = url.searchParams.get("text") ?? "";
    searches.push(query);
    return {
      body: {
        total: 1,
        objects: [registryPackage(query === "vite" ? "vite" : "react", ["build"])],
      },
    };
  });

  await page.goto("/explore");
  const input = page.getByRole("searchbox", { name: "Package name or keyword" });
  await input.fill("react");
  await expect(page).toHaveURL(/q=react/);
  await expect(
    page.getByRole("link", { name: "Open package details for react" }),
  ).toBeVisible();

  await input.fill("vite");
  await input.press("Enter");
  await expect(page).toHaveURL(/q=vite/);
  await expect(
    page.getByRole("link", { name: "Open package details for vite" }),
  ).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/q=react/);
  await expect(input).toHaveValue("react");
  await expect(
    page.getByRole("link", { name: "Open package details for react" }),
  ).toBeVisible();

  await page.goForward();
  await expect(page).toHaveURL(/q=vite/);
  await page.reload();
  await expect(input).toHaveValue("vite");
  await expect(
    page.getByRole("link", { name: "Open package details for vite" }),
  ).toBeVisible();
  expect(searches).toContain("react");
  expect(searches).toContain("vite");
});

test("scoped package names stay encoded in result routes and API queries", async ({
  page,
}) => {
  const queries: string[] = [];
  await page.route("https://registry.npmjs.org/**", async (route) => {
    if (new URL(route.request().url()).pathname === "/%40scope%2Fui-kit") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          name: "@scope/ui-kit",
          "dist-tags": { latest: "1.0.0" },
          versions: {
            "1.0.0": {
              name: "@scope/ui-kit",
              version: "1.0.0",
              dependencies: {},
            },
          },
        }),
      });
      return;
    }
    await route.fallback();
  });
  await fulfillJson(page, (url) => {
    queries.push(url.searchParams.get("text") ?? "");
    return {
      body: {
        total: 1,
        objects: [registryPackage("@scope/ui-kit", ["ui"])],
      },
    };
  });

  await page.goto("/explore?q=%40scope%2Fui-kit");
  await expect(
    page.getByRole("link", {
      name: "Open package details for @scope/ui-kit",
    }),
  ).toBeVisible();
  expect(queries.length).toBeGreaterThan(0);
  expect(queries.every((query) => query === "@scope/ui-kit")).toBe(true);
  await page
    .getByRole("link", {
      name: "Open package details for @scope/ui-kit",
    })
    .click();
  await expect(page).toHaveURL(/\/package\/%40scope%2Fui-kit$/);
  await expect(page.getByRole("heading", { name: "@scope/ui-kit" })).toBeVisible();
});

test("empty results and rate-limit retry offer clear recovery", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await fulfillJson(page, (url) => {
    if (url.searchParams.get("text") === "empty") {
      return { body: { total: 0, objects: [] } };
    }
    return {
      status: 429,
      headers: { "retry-after": "1" },
      body: { error: "Too Many Requests" },
    };
  });

  await page.goto("/explore?q=empty");
  await expect(page.getByRole("heading", { name: "No packages found" })).toBeVisible();
  const emptyScreenshot = testInfo.outputPath("phase2/explore-empty-360.png");
  await mkdir(dirname(emptyScreenshot), { recursive: true });
  await page.screenshot({ path: emptyScreenshot, fullPage: true });

  await page.getByRole("searchbox", { name: "Package name or keyword" }).fill("react");
  await page.getByRole("searchbox", { name: "Package name or keyword" }).press("Enter");
  await expect(page.getByRole("alert")).toContainText("limiting requests");
  await expect(page.getByRole("alert")).toContainText("Wait a little");
  await expect(page.getByRole("button", { name: "Retry search" })).toBeVisible();
  const errorScreenshot = testInfo.outputPath("phase2/explore-rate-limit-360.png");
  await page.screenshot({ path: errorScreenshot, fullPage: true });
});

test("a superseded Registry response cannot replace the newer query results", async ({
  page,
}) => {
  let releaseSlowResponse: (() => void) | undefined;
  let signalSlowRequest: (() => void) | undefined;
  let signalSlowCompleted: (() => void) | undefined;
  const slowGate = new Promise<void>((resolve) => {
    releaseSlowResponse = resolve;
  });
  const slowStarted = new Promise<void>((resolve) => {
    signalSlowRequest = resolve;
  });
  const slowCompleted = new Promise<void>((resolve) => {
    signalSlowCompleted = resolve;
  });

  await page.route(searchEndpoint, async (route) => {
    const query = new URL(route.request().url()).searchParams.get("text") ?? "";
    if (query === "slow") {
      signalSlowRequest?.();
      await slowGate;
      try {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            total: 1,
            objects: [registryPackage("slow-result", ["old"])],
          }),
        });
      } catch {
        // The browser may already have cancelled this stale request.
      } finally {
        signalSlowCompleted?.();
      }
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        total: 1,
        objects: [registryPackage("fast-result", ["current"])],
      }),
    });
  });

  await page.goto("/explore?q=slow");
  await slowStarted;
  const searchbox = page.getByRole("searchbox", {
    name: "Package name or keyword",
  });
  await searchbox.fill("fast");
  await searchbox.press("Enter");
  await expect(
    page.getByRole("link", { name: "Open package details for fast-result" }),
  ).toBeVisible();

  releaseSlowResponse?.();
  await slowCompleted;
  await expect(page.locator(".package-result__name")).toHaveText(["fast-result"]);
});
