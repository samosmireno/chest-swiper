import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardPanel } from "./DashboardPanel";
import { GameProvider } from "../../context/GameContext";
import type { GameScreenPanel } from "../../config";

const mockConfig = vi.hoisted(() => ({
  panel: "insights" as GameScreenPanel,
}));

vi.mock("../../config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../config")>();
  return {
    ...actual,
    // Getter so each render reads the current value — a plain property would
    // be frozen at whatever mockConfig.panel held on first import.
    get GAME_SCREEN_PANEL() {
      return mockConfig.panel;
    },
    // Keep tests off the network: both panels' fetch hooks bail without a URL.
    SHEETS_WEBHOOK_URL: "",
  };
});

function renderPanel(panel: GameScreenPanel) {
  mockConfig.panel = panel;
  return render(
    <GameProvider profiles={[]}>
      <DashboardPanel
        sessionResults={[]}
        cumulativeStats={{ totalSessions: 0, perCard: {} }}
        profiles={[]}
      />
    </GameProvider>,
  );
}

describe("DashboardPanel", () => {
  it("renders community insights when GAME_SCREEN_PANEL is 'insights'", async () => {
    renderPanel("insights");
    expect(await screen.findByText(/community insights/i)).toBeInTheDocument();
    expect(screen.queryByText(/^leaderboard$/i)).toBeNull();
  });

  it("renders the leaderboard when GAME_SCREEN_PANEL is 'leaderboard'", () => {
    renderPanel("leaderboard");
    expect(screen.getByText(/^leaderboard$/i)).toBeInTheDocument();
    expect(screen.queryByText(/community insights/i)).toBeNull();
  });
});
