import { render, screen } from "@testing-library/react";
import { ArrowButton } from "./ArrowButton";

describe("Tests for ArrowButton component", () => {
  test("Should render an accessible name for the up arrow button", () => {
    render(<ArrowButton arrowDirection="up" onClick={() => undefined} label="Move up" />);

    expect(screen.getByRole("button", { name: "Move up" })).toBeInTheDocument();
  });

  test("Should render an accessible name for the down arrow button", () => {
    render(<ArrowButton arrowDirection="down" onClick={() => undefined} label="Move down" />);

    expect(screen.getByRole("button", { name: "Move down" })).toBeInTheDocument();
  });
});
