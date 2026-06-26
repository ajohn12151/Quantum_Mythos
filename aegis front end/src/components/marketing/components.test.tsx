import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuroraBackground } from "./AuroraBackground";
import { PageBackdrop } from "./PageBackdrop";
import { QuantumBackground } from "./QuantumBackground";
import { NetworkScan } from "./NetworkScan";
import { CursorGlow } from "./CursorGlow";
import { SpotlightCard } from "./SpotlightCard";
import { TiltMedia } from "./TiltMedia";
import { Marquee } from "./Marquee";
import { AppWindow } from "./AppWindow";

describe("marketing effect layers mount without crashing (jsdom)", () => {
  it("canvas/effect components render", () => {
    expect(() => {
      render(<AuroraBackground />);
      render(<PageBackdrop />);
      render(<QuantumBackground />);
      render(<NetworkScan />);
      render(<CursorGlow />);
    }).not.toThrow();
  });
});

describe("marketing content wrappers render their children", () => {
  it("SpotlightCard renders children", () => {
    render(
      <SpotlightCard>
        <span>spotlight-child</span>
      </SpotlightCard>,
    );
    expect(screen.getByText("spotlight-child")).toBeInTheDocument();
  });

  it("TiltMedia renders children", () => {
    render(
      <TiltMedia>
        <span>tilt-child</span>
      </TiltMedia>,
    );
    expect(screen.getByText("tilt-child")).toBeInTheDocument();
  });

  it("AppWindow renders its title and body", () => {
    render(
      <AppWindow title="aegis · test">
        <div>window-body</div>
      </AppWindow>,
    );
    expect(screen.getByText("aegis · test")).toBeInTheDocument();
    expect(screen.getByText("window-body")).toBeInTheDocument();
  });

  it("Marquee renders its items (duplicated for the loop)", () => {
    render(
      <Marquee>
        <span>chip-a</span>
      </Marquee>,
    );
    expect(screen.getAllByText("chip-a").length).toBeGreaterThanOrEqual(1);
  });
});
