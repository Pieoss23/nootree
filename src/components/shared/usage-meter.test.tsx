import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { UsageMeter } from "./usage-meter";

describe("UsageMeter", () => {
  it("renders current usage against a numeric limit", () => {
    render(<UsageMeter label="Pazienti attivi" current={12} limit={30} />);
    expect(screen.getByText("Pazienti attivi")).toBeInTheDocument();
    expect(screen.getByText("12 / 30")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "12");
  });

  it("hides the progress bar and shows only the count when unlimited", () => {
    render(<UsageMeter label="Pazienti attivi" current={12} limit={null} />);
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
});
