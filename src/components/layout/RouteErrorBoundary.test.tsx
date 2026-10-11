import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RouteErrorBoundary } from "./RouteErrorBoundary";

function BrokenPage(): never {
  throw new Error("intentional boundary test");
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("RouteErrorBoundary", () => {
  it("recovers to Explore after a caught route error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/broken"]}>
        <RouteErrorBoundary>
          <Routes>
            <Route path="/broken" element={<BrokenPage />} />
            <Route
              path="/explore"
              element={<h1>Explore recovered after the route error.</h1>}
            />
          </Routes>
        </RouteErrorBoundary>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "PackagePulse hit a problem." }),
    ).toBeVisible();
    await user.click(screen.getByRole("link", { name: "Go to Explore" }));
    expect(
      await screen.findByRole("heading", {
        name: "Explore recovered after the route error.",
      }),
    ).toBeVisible();
  });
});
