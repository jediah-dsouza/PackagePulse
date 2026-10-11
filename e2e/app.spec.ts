import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const routes = [
  { path: "/", name: "home" },
  { path: "/explore", name: "explore" },
  { path: "/package/example-package", name: "detail" },
  { path: "/compare", name: "compare" },
  { path: "/saved", name: "saved" },
  { path: "/unknown-route", name: "not-found" },
] as const;

const viewports = [
  { width: 360, height: 800 },
  { width: 768, height: 1024 },
  { width: 1280, height: 900 },
] as const;

function registryPackument(name: string) {
  return {
    name,
    description: `A deterministic metadata fixture for ${name}.`,
    "dist-tags": { latest: "1.0.0" },
    time: {
      "1.0.0": "2025-01-01T00:00:00.000Z",
    },
    versions: {
      "1.0.0": {
        name,
        version: "1.0.0",
        dependencies: {},
      },
    },
  };
}

async function mockPackageRegistry(page: import("@playwright/test").Page) {
  await page.route("https://registry.npmjs.org/**", async (route) => {
    const url = new URL(route.request().url());
    const name = decodeURIComponent(url.pathname.slice(1));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(registryPackument(name)),
    });
  });
}

test("all route shells render without page overflow at mobile, tablet, and desktop", async ({
  page,
}, testInfo) => {
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  await mockPackageRegistry(page);
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);

    for (const route of routes) {
      await page.goto(route.path);
      await expect(page.locator("#main-content h1").first()).toBeVisible();
      if (viewport.width <= 768) {
        await expect(
          page.getByRole("button", { name: "Open navigation" }),
        ).toBeVisible();
        await expect(
          page.getByRole("navigation", { name: "Primary navigation" }),
        ).toBeHidden();
      } else {
        await expect(
          page.getByRole("button", { name: "Open navigation" }),
        ).toBeHidden();
        await expect(
          page.getByRole("navigation", { name: "Primary navigation" }),
        ).toBeVisible();
      }
      const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(pageWidth, `${route.name} at ${viewport.width}px`).toBeLessThanOrEqual(
        viewport.width,
      );

      const screenshotPath = testInfo.outputPath(
        `phase1/${viewport.width}/${route.name}.png`,
      );
      await mkdir(dirname(screenshotPath), { recursive: true });
      await page.screenshot({ path: screenshotPath, fullPage: true });
    }
  }
  expect(browserErrors).toEqual([]);
});

test("the mobile navigation opens, closes with Escape, and restores focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");

  const trigger = page.getByRole("button", { name: "Open navigation" });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await page.getByRole("link", { name: "Compare" }).last().click();
  await expect(page).toHaveURL(/\/compare$/);
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("all routes pass Axe checks at mobile, tablet, and desktop widths", async ({
  page,
}) => {
  await mockPackageRegistry(page);
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const route of routes) {
      await page.goto(route.path);
      await page.locator("#main-content h1").first().waitFor();
      const results = await new AxeBuilder({ page }).analyze();
      expect(
        results.violations,
        `${route.path} at ${viewport.width}px: ${results.violations.map((item) => item.id).join(", ")}`,
      ).toEqual([]);
    }
  }
});

test("an encoded scoped package path remains a single detail route", async ({
  page,
}) => {
  await mockPackageRegistry(page);
  await page.goto("/package/%40scope%2Fdemo");
  await expect(page.getByRole("heading", { name: "@scope/demo" })).toBeVisible();
});

test("the not-found route recovers to Explore", async ({ page }) => {
  await page.goto("/unknown-path");
  await expect(
    page.getByRole("heading", { name: "That route is not in PackagePulse." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Go to Explore" }).click();
  await expect(page).toHaveURL(/\/explore$/);
  await expect(
    page.getByText(/Search the public npm Registry by package name or keyword/),
  ).toBeVisible();
});
