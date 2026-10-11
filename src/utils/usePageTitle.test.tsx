import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AppRoutes } from "../app/App";
import { AppShell } from "../components/layout/AppShell";

function renderRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppShell>
        <AppRoutes />
      </AppShell>
    </MemoryRouter>,
  );
}

describe("Phase 1 route shells", () => {
  it("renders the home discovery shell with working route links", () => {
    renderRoute("/");

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Inspect the details before you install.",
      }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: /explore packages/i })).toHaveAttribute(
      "href",
      "/explore",
    );
  });

  it("renders each required route and its own title", async () => {
    const cases = [
      ["/explore", "Explore packages"],
      ["/compare", "Compare packages"],
      ["/saved", "Saved packages"],
    ] as const;

    for (const [path, title] of cases) {
      const view = renderRoute(path);

      expect(screen.getByRole("heading", { level: 1, name: title })).toBeVisible();
      await waitFor(() => expect(document.title).toContain(title));
      view.unmount();
    }
  });

  it("keeps a scoped package route parameter visible as text", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          name: "@scope/demo",
          "dist-tags": { latest: "1.0.0" },
          time: { "1.0.0": "2025-01-01T00:00:00.000Z" },
          versions: {
            "1.0.0": { name: "@scope/demo", version: "1.0.0" },
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    renderRoute("/package/%40scope%2Fdemo");

    expect(await screen.findByRole("heading", { name: "@scope/demo" })).toBeVisible();
  });

  it("renders a designed not-found route with a recovery link", () => {
    renderRoute("/not-a-real-route");

    expect(
      screen.getByRole("heading", {
        name: "That route is not in PackagePulse.",
      }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: /go to explore/i })).toHaveAttribute(
      "href",
      "/explore",
    );
  });
});
