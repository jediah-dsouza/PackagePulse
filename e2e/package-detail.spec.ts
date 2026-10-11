import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const viewports = [
  { width: 360, height: 800 },
  { width: 768, height: 1024 },
  { width: 1280, height: 900 },
] as const;

function packageRecord(name: string, manyDependencies = false) {
  const dependencies = manyDependencies
    ? Object.fromEntries(
        Array.from({ length: 45 }, (_, index) => [
          `keyboard-dependency-${String(index + 1).padStart(2, "0")}`,
          `^${index + 1}.0.0`,
        ]),
      )
    : { beta: "~3.0.0" };
  return {
    name,
    description: `A deterministic metadata fixture for ${name}.`,
    "dist-tags": { latest: "2.4.1" },
    time: {
      created: "2023-01-01T00:00:00.000Z",
      modified: "2026-05-12T00:00:00.000Z",
      "1.0.0": "2024-01-12T00:00:00.000Z",
      "2.4.1": "2026-05-12T00:00:00.000Z",
    },
    versions: {
      "1.0.0": {
        name,
        version: "1.0.0",
        dependencies: { alpha: "^1.2.0" },
      },
      "2.4.1": {
        name,
        version: "2.4.1",
        keywords: ["ui", "testing"],
        license: "MIT",
        repository: {
          type: "git",
          url: "git+https://github.com/example/packagepulse-fixture.git",
        },
        homepage: "https://example.test/packagepulse",
        dependencies,
        peerDependencies: { react: "^19.0.0" },
        optionalDependencies: { "optional-addon": ">=1.0.0" },
      },
    },
  };
}

function versionRecord(name: string, version: string) {
  return {
    name,
    version,
    license: "MIT",
    dependencies: { alpha: "^1.2.0" },
  };
}

async function mockPackageRegistry(
  page: Page,
  requests: string[] = [],
  options: { manyDependencies?: boolean } = {},
) {
  await page.route("https://registry.npmjs.org/**", async (route) => {
    const url = new URL(route.request().url());
    requests.push(url.pathname);
    const parts = url.pathname
      .slice(1)
      .split("/")
      .map((part) => decodeURIComponent(part));
    const name = parts[0] ?? "unknown-package";
    const version = parts[1];
    const payload = version
      ? versionRecord(name, version)
      : packageRecord(name, options.manyDependencies);

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(payload),
    });
  });
}

async function tabUntilFocused(page: Page, target: Locator) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (await target.evaluate((element) => element === document.activeElement)) return;
    await page.keyboard.press("Tab");
  }
  throw new Error("Keyboard navigation did not reach the expected control.");
}

test("package detail layout works at mobile, tablet and desktop widths", async ({
  page,
}, testInfo) => {
  await mockPackageRegistry(page);

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/package/react");
    await expect(page.getByRole("heading", { name: "react" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Dependencies" })).toBeVisible();
    await expect(page.getByRole("link", { name: "beta" })).toBeVisible();

    const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(pageWidth, `package detail at ${viewport.width}px`).toBeLessThanOrEqual(
      viewport.width,
    );

    const screenshotPath = testInfo.outputPath(
      `phase3/package-detail-${viewport.width}.png`,
    );
    await mkdir(dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath, fullPage: true });

    if (viewport.width === 1280) {
      const accessibility = await new AxeBuilder({ page }).analyze();
      expect(accessibility.violations).toEqual([]);
    }
  }
});

test("scoped package direct navigation, refresh, version selection and history work", async ({
  page,
}) => {
  const requests: string[] = [];
  await mockPackageRegistry(page, requests);

  await page.goto("/package/%40types%2Fnode");
  await expect(page.getByRole("heading", { name: "@types/node" })).toBeVisible();
  await expect(page).toHaveURL(/\/package\/%40types%2Fnode$/);
  expect(requests[0]).toBe("/%40types%2Fnode");

  await page.reload();
  await expect(page.getByRole("heading", { name: "@types/node" })).toBeVisible();
  await page.getByLabel("Package version").selectOption("1.0.0");
  await expect(page.getByRole("link", { name: "alpha" })).toBeVisible();
  expect(requests).toContain("/%40types%2Fnode/1.0.0");

  await page.getByRole("link", { name: "alpha" }).click();
  await expect(page).toHaveURL(/\/package\/alpha$/);
  await expect(page.getByRole("heading", { name: "alpha" })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/package\/%40types%2Fnode$/);
  await expect(page.getByRole("heading", { name: "@types/node" })).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(/\/package\/alpha$/);
});

test("keyboard users can copy the package name and inspect the full dependency group", async ({
  page,
}) => {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await mockPackageRegistry(page, [], { manyDependencies: true });
  await page.goto("/package/%40scope%2Fkeyboard-fixture");

  const copyName = page.getByRole("button", { name: "Copy package name" });
  await tabUntilFocused(page, copyName);
  await expect(copyName).toBeFocused();
  const focusStyle = await copyName.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
  });
  expect(focusStyle.outlineStyle).not.toBe("none");
  expect(focusStyle.outlineWidth).toBe("3px");
  await page.keyboard.press("Enter");
  await expect(page.getByText("Package name copied.", { exact: true })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);

  const dependencySummary = page.locator("details.dependency-group summary").first();
  await tabUntilFocused(page, dependencySummary);
  await expect(dependencySummary).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(dependencySummary.locator("xpath=..")).not.toHaveAttribute("open", "");
  await page.keyboard.press("Enter");
  await expect(dependencySummary.locator("xpath=..")).toHaveAttribute("open", "");

  const showAll = page.getByRole("button", {
    name: "Show all 45 dependencies",
  });
  await tabUntilFocused(page, showAll);
  await expect(showAll).toBeFocused();
  await page.keyboard.press("Enter");
  const showLess = page.getByRole("button", { name: "Show less" });
  await expect(showLess).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByRole("link", { name: "keyboard-dependency-45" }),
  ).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Show all 45 dependencies" }),
  ).toHaveAttribute("aria-expanded", "false");
});

test("a 404 is specific and a rate-limited package request can be retried", async ({
  page,
}) => {
  let attempts = 0;
  let retryAllowed = false;
  await page.route("https://registry.npmjs.org/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname
      .slice(1)
      .split("/")
      .map((part) => decodeURIComponent(part));
    const name = path[0] ?? "";
    if (name === "missing-package") {
      await route.fulfill({ status: 404, body: "Not found" });
      return;
    }

    if (name === "retry-package" && path.length === 1) {
      attempts += 1;
      if (!retryAllowed) {
        await route.fulfill({
          status: 429,
          headers: { "content-type": "application/json", "retry-after": "1" },
          body: JSON.stringify({ error: "rate limited" }),
        });
        return;
      }
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(packageRecord("retry-package")),
    });
  });

  await page.goto("/package/missing-package");
  await expect(page.getByRole("alert")).toContainText(
    "Package not found in the npm Registry.",
  );
  await expect(page.getByRole("link", { name: /search packages/i })).toHaveAttribute(
    "href",
    "/explore?q=missing-package",
  );

  await page.goto("/package/retry-package");
  await expect(page.getByRole("alert")).toContainText(
    "The npm Registry is limiting package requests.",
  );
  const requestsBeforeRetry = attempts;
  retryAllowed = true;
  await page.getByRole("button", { name: "Retry package request" }).click();
  await expect(page.getByRole("heading", { name: "retry-package" })).toBeVisible();
  expect(attempts).toBeGreaterThan(requestsBeforeRetry);
});

test("network and malformed package responses stay recoverable through retry", async ({
  page,
}) => {
  let responseMode: "network" | "malformed" | "success" = "network";
  let requestCount = 0;
  await page.route("https://registry.npmjs.org/**", async (route) => {
    requestCount += 1;
    if (responseMode === "network") {
      await route.abort("failed");
      return;
    }
    if (responseMode === "malformed") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "{malformed",
      });
      responseMode = "success";
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(packageRecord("recoverable-package")),
    });
  });

  await page.goto("/package/recoverable-package");
  await expect(page.getByRole("alert")).toContainText(
    "Couldn't reach the npm Registry.",
  );
  responseMode = "malformed";
  await page.getByRole("button", { name: "Retry package request" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Package details couldn't be read.",
  );
  await page.getByRole("button", { name: "Retry package request" }).click();
  await expect(
    page.getByRole("heading", { name: "recoverable-package" }),
  ).toBeVisible();
  expect(requestCount).toBeGreaterThanOrEqual(3);
});
