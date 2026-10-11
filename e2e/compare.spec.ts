import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const STORAGE_KEY = "packagepulse:compare:v1";

function packument(name: string) {
  return {
    name,
    description: `A deterministic Registry record for ${name}.`,
    "dist-tags": { latest: "2.0.0" },
    time: { "2.0.0": "2025-05-12T00:00:00.000Z" },
    versions: {
      "2.0.0": {
        name,
        version: "2.0.0",
        license: name === "beta" ? "Apache-2.0" : "MIT",
        homepage: `https://example.test/${name}`,
        repository: {
          type: "git",
          url: `https://github.com/example/${name}.git`,
        },
        keywords: [name, "fixture"],
        dependencies: name === "alpha" ? {} : { "shared-dep": "^1.0.0" },
      },
    },
  };
}

function registrySearch(names: string[]) {
  return {
    total: names.length,
    objects: names.map((name) => ({
      package: {
        name,
        description: `Search result for ${name}.`,
        version: "2.0.0",
        keywords: [name],
      },
    })),
  };
}

async function installMocks(page: Page, options: { failOnce?: string } = {}) {
  const counts = new Map<string, number>();
  await page.route("https://registry.npmjs.org/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/-/v1/search") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(registrySearch(["alpha", "beta", "gamma", "delta"])),
      });
      return;
    }

    const packageName = decodeURIComponent(url.pathname.slice(1));
    const requestCount = (counts.get(packageName) ?? 0) + 1;
    counts.set(packageName, requestCount);
    if (packageName === options.failOnce && requestCount <= 2) {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "temporary outage" }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(packument(packageName)),
    });
  });
  return counts;
}

test("selects two and three packages, persists selection, and enforces the cap", async ({
  page,
}) => {
  await installMocks(page);
  await page.goto("/explore?q=alpha");
  await page.getByRole("button", { name: "Add alpha to comparison" }).click();
  await page.getByRole("button", { name: "Add beta to comparison" }).click();
  await page.getByRole("link", { name: "Review comparison" }).click();

  await expect(
    page.getByRole("heading", { name: "Metadata comparison" }),
  ).toBeVisible();
  await expect(page.getByRole("rowheader", { name: "Latest version" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: /alpha/i })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: /beta/i })).toBeVisible();

  await page.getByRole("searchbox", { name: "Package name or keyword" }).fill("gamma");
  await page.getByRole("button", { name: "Search packages" }).click();
  await page.getByRole("button", { name: "Add gamma to comparison" }).click();
  await expect(
    page.getByRole("heading", { name: "Metadata comparison" }),
  ).toBeVisible();
  await expect(page.getByRole("columnheader", { name: /gamma/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /clear comparison/i })).toBeVisible();

  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("packagepulse:compare:v1")))
    .toBe('["alpha","beta","gamma"]');

  await page.reload();
  await expect(page.getByRole("columnheader", { name: /alpha/i })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: /beta/i })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: /gamma/i })).toBeVisible();

  await page.getByRole("searchbox", { name: "Package name or keyword" }).fill("delta");
  await page.getByRole("button", { name: "Search packages" }).click();
  await expect(
    page.getByRole("button", { name: "Comparison limit reached; cannot add delta" }),
  ).toBeDisabled();

  await page
    .getByRole("region", { name: "Package comparison" })
    .getByRole("button", { name: "Remove beta from comparison" })
    .click();
  await expect(page.getByRole("columnheader", { name: /beta/i })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Add delta to comparison" }),
  ).toBeEnabled();
});

test("adds a scoped package from its detail page and reopens details from comparison", async ({
  page,
}) => {
  await installMocks(page);
  await page.goto("/package/%40types%2Fnode");
  await expect(page.getByRole("heading", { name: "@types/node" })).toBeVisible();
  await page.getByRole("button", { name: "Add @types/node to comparison" }).click();
  await expect(page.getByRole("link", { name: "Review comparison" })).toBeVisible();

  await page.goto("/package/beta");
  await expect(page.getByRole("heading", { name: "beta" })).toBeVisible();
  await page.getByRole("button", { name: "Add beta to comparison" }).click();
  await page.getByRole("link", { name: "Review comparison" }).click();
  await expect(page.getByRole("columnheader", { name: /@types\/node/i })).toBeVisible();

  await page.getByRole("link", { name: "Open details for @types/node" }).click();
  await expect(page).toHaveURL(/\/package\/%40types%2Fnode$/i);
  await expect(page.getByRole("heading", { name: "@types/node" })).toBeVisible();
});

test("isolates a package failure and retries only its metadata column", async ({
  page,
}) => {
  const counts = await installMocks(page, { failOnce: "beta" });
  await page.addInitScript((key) => {
    localStorage.setItem(key, JSON.stringify(["alpha", "beta"]));
  }, STORAGE_KEY);
  await page.goto("/compare");
  await expect(page.getByRole("alert")).toContainText(
    "The npm Registry is temporarily unavailable.",
  );
  await expect(page.getByRole("columnheader", { name: /alpha/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry package" })).toBeVisible();
  const alphaRequestCount = counts.get("alpha");
  await page.getByRole("button", { name: "Retry package" }).click();
  await expect(page.getByText("Apache-2.0")).toBeVisible();
  expect(counts.get("alpha")).toBe(alphaRequestCount);
  expect(counts.get("beta")).toBeGreaterThan(2);
});

test("comparison remains usable at mobile, tablet, and desktop widths", async ({
  page,
}, testInfo) => {
  await installMocks(page);
  await page.addInitScript((key) => {
    localStorage.setItem(key, JSON.stringify(["alpha", "beta", "gamma"]));
  }, STORAGE_KEY);

  for (const viewport of [
    { width: 360, height: 800 },
    { width: 768, height: 1024 },
    { width: 1280, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/compare");
    const tableRegion = page.getByRole("region", { name: "Package comparison" });
    await expect(tableRegion).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /alpha/i })).toBeVisible();
    const measurements = await page.evaluate(() => {
      const region = document.querySelector<HTMLElement>(".comparison-table-scroll");
      return {
        pageWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        regionWidth: region?.clientWidth ?? 0,
        tableWidth: region?.scrollWidth ?? 0,
      };
    });
    expect(
      measurements.pageWidth,
      `${viewport.width}px comparison page should not overflow`,
    ).toBeLessThanOrEqual(measurements.viewportWidth);
    if (viewport.width <= 768) {
      expect(measurements.tableWidth).toBeGreaterThan(measurements.regionWidth);
      const innerScrollWorks = await tableRegion.evaluate((element) => {
        const scroller = element as HTMLElement;
        scroller.scrollLeft = 100;
        const didScroll = scroller.scrollLeft > 0;
        scroller.scrollLeft = 0;
        return didScroll;
      });
      expect(innerScrollWorks).toBe(true);
    } else {
      expect(measurements.tableWidth).toBeLessThanOrEqual(measurements.regionWidth);
    }
    const screenshotPath = testInfo.outputPath(`phase4/compare-${viewport.width}.png`);
    await mkdir(dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath, fullPage: true });
  }

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/compare");
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
});

test("adds packages using keyboard-only search and selection controls", async ({
  page,
}) => {
  await installMocks(page);
  await page.goto("/compare");
  const search = page.getByRole("searchbox", { name: "Package name or keyword" });

  for (let index = 0; index < 20; index += 1) {
    if (await search.evaluate((element) => element === document.activeElement)) break;
    await page.keyboard.press("Tab");
  }
  await expect(search).toBeFocused();
  await page.keyboard.type("alpha");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Search packages" })).toBeFocused();
  await page.keyboard.press("Enter");

  const addAlpha = page.getByRole("button", { name: "Add alpha to comparison" });
  await expect(addAlpha).toBeVisible();
  for (let index = 0; index < 10; index += 1) {
    if (await addAlpha.evaluate((element) => element === document.activeElement)) break;
    await page.keyboard.press("Tab");
  }
  await expect(addAlpha).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("link", { name: "Compare, 1 selected" })).toBeVisible();
});

test("removes a package with keyboard input and preserves the one-package state", async ({
  page,
}) => {
  await installMocks(page);
  await page.addInitScript((key) => {
    localStorage.setItem(key, JSON.stringify(["alpha", "beta"]));
  }, STORAGE_KEY);
  await page.goto("/compare");

  const removeAlpha = page.getByRole("button", {
    name: "Remove alpha from comparison",
  });
  for (let index = 0; index < 20; index += 1) {
    if (await removeAlpha.evaluate((element) => element === document.activeElement))
      break;
    await page.keyboard.press("Tab");
  }
  await expect(removeAlpha).toBeFocused();
  const focusOutline = await removeAlpha.evaluate(
    (element) => getComputedStyle(element).outlineStyle,
  );
  expect(focusOutline).toBe("solid");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Add one more package" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Compare, 1 selected" })).toBeVisible();
});
