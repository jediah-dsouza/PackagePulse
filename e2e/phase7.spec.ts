import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const viewports = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 900 },
  { width: 1440, height: 900 },
] as const;

const routes = [
  { path: "/", name: "home" },
  { path: "/explore?q=react", name: "explore-success" },
  { path: "/package/react", name: "detail-success" },
  { path: "/compare", name: "compare-selected" },
  { path: "/saved", name: "saved-populated" },
  { path: "/unknown-route", name: "not-found" },
] as const;

function packageRecord(name: string) {
  return {
    name,
    description: `A deterministic Phase 7 fixture for ${name}.`,
    "dist-tags": { latest: "2.0.0" },
    time: {
      "1.0.0": "2024-01-12T00:00:00.000Z",
      "2.0.0": "2025-05-12T08:30:00.000Z",
    },
    versions: {
      "1.0.0": {
        name,
        version: "1.0.0",
        dependencies: { oldDependency: "^1.0.0" },
      },
      "2.0.0": {
        name,
        version: "2.0.0",
        description: `A deterministic Phase 7 fixture for ${name}.`,
        keywords: ["ui", "accessibility"],
        license: "MIT",
        repository: {
          type: "git",
          url: "git+https://github.com/example/packagepulse-phase7.git",
        },
        homepage: "https://example.test/packagepulse",
        dependencies: { alpha: "^1.0.0" },
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
                description: "A deterministic Phase 7 search fixture.",
                version: "2.0.0",
                keywords: ["ui", "accessibility"],
                license: "MIT",
              },
            },
          ],
        }),
      });
      return;
    }

    const parts = url.pathname.slice(1).split("/").map(decodeURIComponent);
    const name = parts[0] ?? "unknown-package";
    const version = parts[1];
    const payload = version
      ? { name, version, dependencies: { alpha: "^1.0.0" } }
      : packageRecord(name);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(payload),
    });
  });
}

async function waitForRouteContent(page: Page, path: string) {
  await page.goto(path);
  await page.locator("#main-content h1").first().waitFor();

  if (path.startsWith("/explore?")) {
    await expect(
      page.getByRole("link", { name: "Open package details for react" }),
    ).toBeVisible();
  } else if (path.startsWith("/package/")) {
    await expect(page.getByRole("link", { name: "alpha" })).toBeVisible();
  } else if (path === "/compare") {
    await expect(
      page.getByRole("heading", { name: "Metadata comparison" }),
    ).toBeVisible();
    await expect(page.getByText("MIT").first()).toBeVisible();
  } else if (path === "/saved") {
    await expect(
      page.getByText("A deterministic Phase 7 fixture for react."),
    ).toBeVisible();
  }
}

test("all route success states remain accessible and tappable at target viewports", async ({
  page,
}, testInfo) => {
  test.setTimeout(180_000);
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });

  await page.addInitScript(() => {
    localStorage.setItem(
      "packagepulse:compare:v1",
      JSON.stringify(["react", "@types/node"]),
    );
    localStorage.setItem(
      "packagepulse:saved:v1",
      JSON.stringify({ version: 1, names: ["react", "@types/node"] }),
    );
  });
  await mockRegistry(page);

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);

    for (const route of routes) {
      await waitForRouteContent(page, route.path);

      const measurements = await page.evaluate(() => {
        const targets = Array.from(
          document.querySelectorAll<HTMLElement>(
            'button, a[href], input:not([type="hidden"]), select, summary',
          ),
        )
          .filter((element) => {
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return (
              rect.width > 0 &&
              rect.height > 0 &&
              style.visibility !== "hidden" &&
              style.display !== "none"
            );
          })
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              label:
                element.getAttribute("aria-label") ||
                element.innerText.trim().replace(/\s+/g, " ") ||
                element.getAttribute("placeholder") ||
                element.tagName.toLowerCase(),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            };
          });
        const styles = getComputedStyle(document.documentElement);
        const parseColor = (color: string) => {
          const hex = color.trim().match(/^#([0-9a-f]{6})$/i)?.[1];
          if (hex) {
            return [0, 2, 4].map((offset) =>
              Number.parseInt(hex.slice(offset, offset + 2), 16),
            );
          }
          const rgb = color.match(/rgba?\(([^)]+)\)/i)?.[1];
          return (
            rgb
              ?.match(/[\d.]+/g)
              ?.slice(0, 3)
              .map(Number) ?? [0, 0, 0]
          );
        };
        const luminance = (color: string) => {
          const channels = parseColor(color).map((channel) => {
            const normalized = channel / 255;
            return normalized <= 0.04045
              ? normalized / 12.92
              : ((normalized + 0.055) / 1.055) ** 2.4;
          });
          return (
            0.2126 * (channels[0] ?? 0) +
            0.7152 * (channels[1] ?? 0) +
            0.0722 * (channels[2] ?? 0)
          );
        };
        const contrast = (foreground: string, background: string) => {
          const values = [luminance(foreground), luminance(background)].sort(
            (left, right) => right - left,
          );
          return ((values[0] ?? 0) + 0.05) / ((values[1] ?? 0) + 0.05);
        };
        const border = styles.getPropertyValue("--pp-border").trim();
        const surfaces = [
          styles.getPropertyValue("--pp-bg").trim(),
          styles.getPropertyValue("--pp-surface").trim(),
          styles.getPropertyValue("--pp-surface-2").trim(),
        ];

        return {
          pageWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
          targets,
          borderContrast: surfaces.map((surface) => contrast(border, surface)),
        };
      });

      expect(
        measurements.pageWidth,
        `${route.name} at ${viewport.width}px should not overflow`,
      ).toBeLessThanOrEqual(measurements.viewportWidth);
      expect(
        measurements.targets.filter(
          (target) => target.width < 44 || target.height < 44,
        ),
        `${route.name} at ${viewport.width}px has undersized controls`,
      ).toEqual([]);
      expect(
        measurements.borderContrast.every((ratio) => ratio >= 3),
        `${route.name} control border ratios: ${measurements.borderContrast.join(", ")}`,
      ).toBe(true);

      const axe = await new AxeBuilder({ page }).analyze();
      expect(
        axe.violations,
        `${route.name} at ${viewport.width}px: ${axe.violations.map((item) => item.id).join(", ")}`,
      ).toEqual([]);

      const screenshotPath = testInfo.outputPath(
        `phase7/${viewport.width}/${route.name}.png`,
      );
      await mkdir(dirname(screenshotPath), { recursive: true });
      await page.screenshot({ path: screenshotPath, fullPage: true });
    }
  }

  expect(browserErrors).toEqual([]);
});

test("keyboard skip link and mobile dialog keep visible, contained focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  await page.keyboard.press("Tab");

  const skipLink = page.getByRole("link", { name: "Skip to content" });
  await expect(skipLink).toBeFocused();
  const skipOutline = await skipLink.evaluate((element) => {
    const style = getComputedStyle(element);
    return { style: style.outlineStyle, width: style.outlineWidth };
  });
  expect(skipOutline).toEqual({ style: "solid", width: "3px" });

  await page.keyboard.press("Enter");
  const main = page.locator("#main-content");
  await expect(main).toBeFocused();
  const mainOutline = await main.evaluate((element) => {
    const style = getComputedStyle(element);
    return { style: style.outlineStyle, width: style.outlineWidth };
  });
  expect(mainOutline).toEqual({ style: "solid", width: "3px" });

  const menuTrigger = page.getByRole("button", { name: "Open navigation" });
  await menuTrigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Navigate PackagePulse" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(":focus")).toHaveCount(1);
  const dialogAxe = await new AxeBuilder({ page })
    .include("#mobile-navigation")
    .analyze();
  expect(dialogAxe.violations).toEqual([]);

  for (let index = 0; index < 6; index += 1) {
    await page.keyboard.press("Tab");
    const focus = await page.evaluate(() => {
      const activeElement = document.activeElement;
      return {
        insideDialog: Boolean(
          activeElement &&
          document.querySelector("#mobile-navigation")?.contains(activeElement),
        ),
        label:
          activeElement?.getAttribute("aria-label") ||
          activeElement?.textContent?.trim() ||
          activeElement?.tagName,
      };
    });
    expect(focus.insideDialog, `Tab ${index + 1} moved focus to ${focus.label}`).toBe(
      true,
    );
  }

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(menuTrigger).toBeFocused();
});

test("package detail loading state reserves space and remains accessible", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  let releaseResponse!: () => void;
  const responseGate = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });
  await page.route("https://registry.npmjs.org/react", async (route) => {
    await responseGate;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(packageRecord("react")),
    });
  });

  try {
    await page.goto("/package/react");
    const skeleton = page.getByRole("status", {
      name: "Loading package details",
    });
    await expect(skeleton).toBeVisible();
    await expect(skeleton).toHaveAttribute("aria-busy", "true");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Loading package details",
      }),
    ).toBeAttached();
    await expect
      .poll(() => skeleton.evaluate((element) => getComputedStyle(element).minHeight))
      .toBe("640px");

    const axe = await new AxeBuilder({ page }).analyze();
    expect(axe.violations).toEqual([]);
    const screenshotPath = testInfo.outputPath("phase7/loading/package-detail.png");
    await mkdir(dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath, fullPage: true });

    releaseResponse();
    await expect(page.getByRole("heading", { name: "react" })).toBeVisible();
  } finally {
    releaseResponse();
  }
});

test("empty, error, and partial Registry states remain announced and accessible", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.addInitScript(() => {
    localStorage.setItem("packagepulse:compare:v1", JSON.stringify(["alpha", "beta"]));
    localStorage.removeItem("packagepulse:saved:v1");
  });

  const captureAccessibleState = async (name: string) => {
    const axe = await new AxeBuilder({ page }).analyze();
    expect(axe.violations, `${name}: ${axe.violations.map((item) => item.id)}`).toEqual(
      [],
    );
    const screenshotPath = testInfo.outputPath(`phase7/states/${name}.png`);
    await mkdir(dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath, fullPage: true });
  };

  await page.route("https://registry.npmjs.org/-/v1/search**", async (route) => {
    const query = new URL(route.request().url()).searchParams.get("text");
    if (query === "react") {
      await route.fulfill({
        status: 429,
        headers: { "retry-after": "1" },
        contentType: "application/json",
        body: JSON.stringify({ error: "Too Many Requests" }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ total: 0, objects: [] }),
    });
  });

  await page.goto("/explore?q=empty");
  await expect(page.getByRole("heading", { name: "No packages found" })).toBeVisible();
  await captureAccessibleState("explore-empty");

  await page.getByRole("searchbox", { name: "Package name or keyword" }).fill("react");
  await page.getByRole("searchbox", { name: "Package name or keyword" }).press("Enter");
  await expect(page.getByRole("alert")).toContainText("limiting requests");
  await expect(page.getByRole("button", { name: "Retry search" })).toBeVisible();
  await captureAccessibleState("explore-rate-limit");

  await page.route("https://registry.npmjs.org/**", async (route) => {
    const name = new URL(route.request().url()).pathname.slice(1).split("/")[0];
    if (name === "missing-package") {
      await route.fulfill({ status: 404, body: "Not found" });
      return;
    }
    if (name === "beta") {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "temporarily unavailable" }),
      });
      return;
    }
    const packageName = decodeURIComponent(name ?? "alpha");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(packageRecord(packageName)),
    });
  });

  await page.goto("/package/missing-package");
  await expect(page.getByRole("alert")).toContainText("Package not found");
  await captureAccessibleState("detail-not-found");

  await page.goto("/compare");
  await expect(page.getByRole("columnheader", { name: /alpha/i })).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("temporarily unavailable");
  await captureAccessibleState("compare-partial-error");

  await page.goto("/saved");
  await expect(
    page.getByRole("heading", { name: "A place for your shortlist" }),
  ).toBeVisible();
  await captureAccessibleState("saved-empty");
});

test("reduced motion removes skeleton animation and smooth scrolling", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });

  let resolveSearch!: () => void;
  const responseGate = new Promise<void>((resolve) => {
    resolveSearch = resolve;
  });
  await page.route("https://registry.npmjs.org/-/v1/search**", async (route) => {
    await responseGate;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        total: 1,
        objects: [
          {
            package: {
              name: "react",
              description: "Reduced motion fixture.",
              version: "2.0.0",
            },
          },
        ],
      }),
    });
  });

  await page.goto("/explore?q=react");
  await expect(page.getByRole("status")).toContainText("Searching the npm Registry");
  const motionStyles = await page.evaluate(() => ({
    scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
    skeletonDuration: getComputedStyle(
      document.querySelector(".search-skeleton") as Element,
    ).animationDuration,
    skeletonIterations: getComputedStyle(
      document.querySelector(".search-skeleton") as Element,
    ).animationIterationCount,
  }));
  expect(motionStyles.scrollBehavior).toBe("auto");
  expect(Number.parseFloat(motionStyles.skeletonDuration)).toBeLessThanOrEqual(0.00001);
  expect(motionStyles.skeletonIterations).toBe("1");

  resolveSearch();
  await expect(
    page.getByRole("link", { name: "Open package details for react" }),
  ).toBeVisible();
});
