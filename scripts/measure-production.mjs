import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { readdir, stat } from "node:fs/promises";
import { gzipSync } from "node:zlib";

const port = Number(process.env.PREVIEW_PORT ?? 4175);
const origin = `http://127.0.0.1:${port}`;
const sampleCount = 5;
const routeCases = [
  { path: "/", name: "home" },
  { path: "/explore?q=react", name: "explore-success" },
  { path: "/package/react", name: "detail-success" },
  { path: "/compare", name: "compare-selected" },
  { path: "/saved", name: "saved-populated" },
  { path: "/not-found-route", name: "not-found" },
];

const preview = spawn(
  "npm",
  [
    "run",
    "preview",
    "--",
    "--host",
    "127.0.0.1",
    "--port",
    String(port),
    "--strictPort",
  ],
  { cwd: process.cwd(), stdio: "ignore" },
);

let browser;

function median(values) {
  const ordered = [...values].sort((left, right) => left - right);
  return ordered[Math.floor(ordered.length / 2)] ?? 0;
}

function mockPackument(name) {
  return {
    name,
    description: `Production measurement fixture for ${name}.`,
    "dist-tags": { latest: "2.0.0" },
    time: { "2.0.0": "2025-05-12T08:30:00.000Z" },
    versions: {
      "2.0.0": {
        name,
        version: "2.0.0",
        description: `Production measurement fixture for ${name}.`,
        license: "MIT",
        keywords: ["ui", "fixture"],
        dependencies: { alpha: "^1.0.0" },
      },
    },
  };
}

async function mockRegistry(page) {
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
                description: "Production measurement fixture for react.",
                version: "2.0.0",
                license: "MIT",
                keywords: ["ui"],
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
      : mockPackument(name);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(payload),
    });
  });
}

async function waitForContent(page, path) {
  if (path.startsWith("/explore?")) {
    await page.getByRole("link", { name: "Open package details for react" }).waitFor();
  } else if (path.startsWith("/package/")) {
    await page.getByRole("heading", { name: "react" }).waitFor();
  } else if (path === "/compare") {
    await page.getByRole("heading", { name: "Metadata comparison" }).waitFor();
    await page.getByText("MIT").first().waitFor();
  } else if (path === "/saved") {
    await page.getByText("Production measurement fixture for react.").waitFor();
  } else {
    await page.locator("#main-content h1").first().waitFor();
  }
}

async function measureRoute(route) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addInitScript(() => {
    if (window.location.pathname === "/compare") {
      localStorage.setItem(
        "packagepulse:compare:v1",
        JSON.stringify(["react", "@types/node"]),
      );
    }
    if (window.location.pathname === "/saved") {
      localStorage.setItem(
        "packagepulse:saved:v1",
        JSON.stringify({ version: 1, names: ["react", "@types/node"] }),
      );
    }
    const metrics = { cls: 0, lcp: 0, shifts: [] };
    Object.defineProperty(window, "__packagePulseMetrics", { value: metrics });
    new PerformanceObserver((entries) => {
      for (const entry of entries.getEntries()) {
        if (!entry.hadRecentInput) {
          metrics.cls += entry.value;
          metrics.shifts.push({
            value: entry.value,
            sources: entry.sources.map((source) => ({
              element:
                source.node instanceof Element
                  ? `${source.node.tagName.toLowerCase()}${source.node.id ? `#${source.node.id}` : ""}${typeof source.node.className === "string" && source.node.className ? `.${source.node.className.trim().replace(/\s+/g, ".")}` : ""}`
                  : null,
              previousRect: source.previousRect,
              currentRect: source.currentRect,
            })),
          });
        }
      }
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((entries) => {
      for (const entry of entries.getEntries()) {
        metrics.lcp = entry.startTime;
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
  });

  const page = await context.newPage();
  await mockRegistry(page);
  const client = await context.newCDPSession(page);
  await client.send("Performance.enable");

  try {
    await page.goto(`${origin}${route.path}`, { waitUntil: "load" });
    await waitForContent(page, route.path);
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    await page.waitForTimeout(150);
    const browserMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType("navigation")[0];
      const paint = performance.getEntriesByType("paint");
      const fcp = paint.find((entry) => entry.name === "first-contentful-paint");
      const resources = performance.getEntriesByType("resource");
      return {
        responseStartMs: navigation.responseStart - navigation.startTime,
        domContentLoadedMs: navigation.domContentLoadedEventEnd - navigation.startTime,
        loadEventEndMs: navigation.loadEventEnd - navigation.startTime,
        firstContentfulPaintMs: fcp?.startTime ?? null,
        largestContentfulPaintMs: window.__packagePulseMetrics.lcp,
        cumulativeLayoutShift: window.__packagePulseMetrics.cls,
        layoutShiftEntries: window.__packagePulseMetrics.shifts,
        resourceCount: resources.length,
        resourceTransferBytes: resources.reduce(
          (total, resource) => total + resource.transferSize,
          0,
        ),
      };
    });
    const cdpMetrics = await client.send("Performance.getMetrics");
    const jsHeapUsedBytes = cdpMetrics.metrics.find(
      (metric) => metric.name === "JSHeapUsedSize",
    )?.value;
    return { ...browserMetrics, jsHeapUsedBytes };
  } finally {
    await client.detach();
    await page.close();
    await context.close();
  }
}

async function bundleSizes() {
  const files = await readdir("dist/assets");
  const measurements = [];
  for (const file of files) {
    const path = `dist/assets/${file}`;
    const contents = await (await import("node:fs/promises")).readFile(path);
    measurements.push({
      file,
      bytes: (await stat(path)).size,
      gzipBytes: gzipSync(contents).byteLength,
    });
  }
  return measurements;
}

try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(origin);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      // Preview server may still be starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!ready) throw new Error(`Production preview did not start at ${origin}`);

  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
    headless: true,
    args: ["--no-sandbox"],
  });
  console.log(
    JSON.stringify(
      {
        method: "Playwright Chromium against local Vite production preview",
        browser: browser.version(),
        viewport: "1280x900",
        samplesPerRoute: sampleCount,
        warmupSamplesExcluded: 1,
        registry: "deterministic route-intercepted fixtures",
        bundles: await bundleSizes(),
      },
      null,
      2,
    ),
  );

  for (const route of routeCases) {
    await measureRoute(route);
    const samples = [];
    for (let index = 0; index < sampleCount; index += 1) {
      samples.push(await measureRoute(route));
    }
    const keys = Object.keys(samples[0] ?? {}).filter(
      (key) => key !== "layoutShiftEntries",
    );
    const summary = Object.fromEntries(
      keys.map((key) => {
        const values = samples
          .map((sample) => sample[key])
          .filter((value) => typeof value === "number");
        return [key, median(values)];
      }),
    );
    const largestLayoutShifts = samples
      .flatMap((sample) => sample.layoutShiftEntries)
      .sort((left, right) => right.value - left.value)
      .slice(0, 3);
    console.log(
      JSON.stringify({ route: route.name, median: summary, largestLayoutShifts }),
    );
  }
} catch (error) {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
} finally {
  await browser?.close();
  preview.kill("SIGTERM");
}
