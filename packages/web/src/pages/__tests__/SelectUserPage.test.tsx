import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { SelectUserPage } from "../SelectUserPage.js";

describe("SelectUserPage", () => {
  it("renders the title, subtitle, and form", () => {
    render(<SelectUserPage on_select={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Recipe Book" })).toBeInTheDocument();
    expect(screen.getByLabelText("Your name")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Get Started" })).toBeInTheDocument();
  });

  it("submit button is disabled when name is empty", () => {
    render(<SelectUserPage on_select={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Get Started" })).toBeDisabled();
  });

  it("submit button is enabled after typing a name", async () => {
    render(<SelectUserPage on_select={vi.fn()} />);
    await userEvent.type(screen.getByLabelText("Your name"), "Alice");
    expect(screen.getByRole("button", { name: "Get Started" })).toBeEnabled();
  });

  it("calls on_select with trimmed name on submit", async () => {
    const on_select = vi.fn();
    render(<SelectUserPage on_select={on_select} />);
    await userEvent.type(screen.getByLabelText("Your name"), "  Alice  ");
    await userEvent.click(screen.getByRole("button", { name: "Get Started" }));
    expect(on_select).toHaveBeenCalledWith("Alice");
  });

  it("does not call on_select when name is only whitespace", async () => {
    const on_select = vi.fn();
    render(<SelectUserPage on_select={on_select} />);
    await userEvent.type(screen.getByLabelText("Your name"), "   ");
    await userEvent.click(screen.getByRole("button", { name: "Get Started" }));
    expect(on_select).not.toHaveBeenCalled();
  });
});
