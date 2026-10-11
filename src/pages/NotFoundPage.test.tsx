import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { AppRoutes } from "../app/App";
import { AppShell } from "../components/layout/AppShell";

afterEach(cleanup);

describe("NotFound route", () => {
  it("shows a useful 404 and returns to Explore", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/missing-route"]}>
        <AppShell>
          <AppRoutes />
        </AppShell>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "That route is not in PackagePulse." }),
    ).toBeVisible();
    await user.click(screen.getByRole("link", { name: "Go to Explore" }));
    expect(
      await screen.findByText(
        /Search the public npm Registry by package name or keyword/,
      ),
    ).toBeVisible();
  });
});
