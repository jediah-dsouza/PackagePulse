import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const SAVED_KEY = "packagepulse:saved:v1";
const viewports = [
  { width: 360, height: 800 },
  { width: 768, height: 1024 },
  { width: 1280, height: 900 },
] as const;

function packageRecord(name: string) {
  return {
    name,
    description: `A saved-package fixture for ${name}.`,
    "dist-tags": { latest: "2.1.0" },
    time: { "2.1.0": "2025-05-12T08:30:00.000Z" },
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

async function mockRegistry(page: Page) {
  await page.route("https://registry.npmjs.org/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/-/v1/search") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          total: 1,
          objects: [
            {
              package: {
                name: "react",
                description: "A saved-package fixture for react.",
                version: "2.1.0",
                keywords: ["ui"],
                license: "MIT",
              },
            },
          ],
        }),
      });
      return;
    }

    const name = decodeURIComponent(url.pathname.slice(1));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(packageRecord(name)),
    });
  });
}

async function tabUntilFocused(page: Page, target: Locator) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (await target.evaluate((element) => element === document.activeElement)) return;
    await page.keyboard.press("Tab");
  }
  throw new Error("Keyboard navigation did not reach the expected saved control.");
}

test("saves from Explore, persists through refresh, and removes from Saved", async ({
  page,
}) => {
  await page.addInitScript((key) => {
    if (sessionStorage.getItem("packagepulse:e2e-reset") === "done") return;
    localStorage.removeItem(key);
    sessionStorage.setItem("packagepulse:e2e-reset", "done");
  }, SAVED_KEY);
  await mockRegistry(page);
  await page.goto("/explore?q=react");

  await expect(
    page.getByRole("link", { name: "Open package details for react" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Save react" }).click();
  await expect(page.locator(".toast-region__message")).toContainText(
    "react saved in this browser.",
  );
  await expect(page.getByRole("link", { name: "Saved, 1 package" })).toBeVisible();
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), SAVED_KEY))
    .toBe(JSON.stringify({ version: 1, names: ["react"] }));

  await page
    .getByRole("link", {
      name: "Open package details for react",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", { name: "Remove react from saved packages" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("link", { name: "Saved, 1 package" }).click();
  await expect(page.locator(".saved-package-card h2 a")).toHaveText("react");
  await expect(page.getByText("A saved-package fixture for react.")).toBeVisible();
  await page.reload();
  await expect(page.locator(".saved-package-card h2 a")).toHaveText("react");

  await page.getByRole("button", { name: "Remove react from saved packages" }).click();
  await expect(
    page.getByRole("heading", { name: "A place for your shortlist" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Saved" })).toBeVisible();
});

test("scoped package can be saved from details with keyboard and removed accessibly", async ({
  page,
}) => {
  await page.addInitScript((key) => {
    if (sessionStorage.getItem("packagepulse:e2e-reset") === "done") return;
    localStorage.removeItem(key);
    sessionStorage.setItem("packagepulse:e2e-reset", "done");
  }, SAVED_KEY);
  await mockRegistry(page);
  await page.goto("/package/%40types%2Fnode");

  const saveButton = page.getByRole("button", { name: "Save @types/node" });
  await expect(saveButton).toHaveAttribute("aria-pressed", "false");
  await tabUntilFocused(page, saveButton);
  await expect(saveButton).toBeFocused();
  const focusOutline = await saveButton.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return { style: style.outlineStyle, width: style.outlineWidth };
  });
  expect(focusOutline.style).not.toBe("none");
  expect(focusOutline.width).toBe("3px");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Remove @types/node from saved packages" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".toast-region__message")).toContainText(
    "@types/node saved in this browser.",
  );

  await page.goto("/saved");
  const removeButton = page.getByRole("button", {
    name: "Remove @types/node from saved packages",
  });
  await expect(removeButton).toBeVisible();
  await tabUntilFocused(page, removeButton);
  await expect(removeButton).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "A place for your shortlist" }),
  ).toBeVisible();
  await expect(page.locator(".toast-region__message")).toContainText(
    "@types/node removed from saved packages.",
  );
});

test("saved-package state synchronizes between real browser tabs", async ({
  page,
  context,
}) => {
  await page.addInitScript((key) => {
    if (sessionStorage.getItem("packagepulse:e2e-reset") === "done") return;
    localStorage.removeItem(key);
    sessionStorage.setItem("packagepulse:e2e-reset", "done");
  }, SAVED_KEY);
  await mockRegistry(page);
  const secondTab = await context.newPage();
  await mockRegistry(secondTab);

  await secondTab.goto("/saved");
  await expect(
    secondTab.getByRole("heading", { name: "A place for your shortlist" }),
  ).toBeVisible();

  await page.goto("/package/react");
  await expect(page.getByRole("heading", { name: "react" })).toBeVisible();
  await page.getByRole("button", { name: "Save react" }).click();
  await expect(secondTab.locator(".saved-package-card h2 a")).toHaveText("react");
  await expect(secondTab.getByRole("link", { name: "Saved, 1 package" })).toBeVisible();

  await secondTab
    .getByRole("button", { name: "Remove react from saved packages" })
    .click();
  await expect(page.getByRole("button", { name: "Save react" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(
    secondTab.getByRole("heading", { name: "A place for your shortlist" }),
  ).toBeVisible();
  await secondTab.close();
});

test("Saved page is usable without overflow at mobile, tablet, and desktop widths", async ({
  page,
}, testInfo) => {
  await mockRegistry(page);
  await page.addInitScript((key) => {
    localStorage.setItem(
      key,
      JSON.stringify({ version: 1, names: ["react", "@types/node"] }),
    );
  }, SAVED_KEY);

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/saved");
    await expect(page.locator(".saved-package-card")).toHaveCount(2);
    await expect(
      page.getByRole("heading", { name: "Your saved packages" }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
      `Saved at ${viewport.width}px`,
    ).toBeLessThanOrEqual(viewport.width);

    const screenshotPath = testInfo.outputPath(`phase5/saved-${viewport.width}.png`);
    await mkdir(dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath, fullPage: true });
    if (viewport.width === 1280) {
      const accessibility = await new AxeBuilder({ page }).analyze();
      expect(accessibility.violations).toEqual([]);
    }
  }
});

test("Explore, package detail, and Saved controls remain responsive and accessible", async ({
  page,
}, testInfo) => {
  await mockRegistry(page);
  await page.addInitScript((key) => {
    localStorage.setItem(
      key,
      JSON.stringify({ version: 1, names: ["react", "@types/node"] }),
    );
  }, SAVED_KEY);

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    const routes = [
      { path: "/explore?q=react", name: "explore" },
      { path: "/package/%40types%2Fnode", name: "detail" },
      { path: "/saved", name: "saved" },
    ] as const;
    for (const route of routes) {
      await page.goto(route.path);
      if (route.name === "explore") {
        await expect(
          page.getByRole("button", { name: "Remove react from saved packages" }),
        ).toBeVisible();
      } else if (route.name === "detail") {
        await expect(
          page.getByRole("button", { name: "Remove @types/node from saved packages" }),
        ).toBeVisible();
      } else {
        await expect(page.locator(".saved-package-card")).toHaveCount(2);
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
        `${route.name} at ${viewport.width}px`,
      ).toBeLessThanOrEqual(viewport.width);

      const screenshotPath = testInfo.outputPath(
        `phase5/${route.name}-${viewport.width}.png`,
      );
      await mkdir(dirname(screenshotPath), { recursive: true });
      await page.screenshot({ path: screenshotPath, fullPage: true });
      if (viewport.width === 1280) {
        const accessibility = await new AxeBuilder({ page }).analyze();
        expect(accessibility.violations).toEqual([]);
      }
    }
  }
});
