import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ProfileSettingsPage } from "../ProfileSettingsPage.js";

describe("ProfileSettingsPage", () => {
  it("renders current name in the input", () => {
    render(
      <ProfileSettingsPage current_name="Alice" on_save={vi.fn()} on_cancel={vi.fn()} />,
    );
    expect(screen.getByLabelText("Your name")).toHaveValue("Alice");
  });

  it("Save is disabled when name is unchanged", () => {
    render(
      <ProfileSettingsPage current_name="Alice" on_save={vi.fn()} on_cancel={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("Save is disabled when name is empty", async () => {
    render(
      <ProfileSettingsPage current_name="Alice" on_save={vi.fn()} on_cancel={vi.fn()} />,
    );
    await userEvent.clear(screen.getByLabelText("Your name"));
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("Save is enabled when name changes to a non-empty value", async () => {
    render(
      <ProfileSettingsPage current_name="Alice" on_save={vi.fn()} on_cancel={vi.fn()} />,
    );
    const input = screen.getByLabelText("Your name");
    await userEvent.clear(input);
    await userEvent.type(input, "Bob");
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });

  it("calls on_save with trimmed name when Save is clicked", async () => {
    const on_save = vi.fn();
    render(
      <ProfileSettingsPage current_name="Alice" on_save={on_save} on_cancel={vi.fn()} />,
    );
    const input = screen.getByLabelText("Your name");
    await userEvent.clear(input);
    await userEvent.type(input, "  Bob  ");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(on_save).toHaveBeenCalledWith("Bob");
  });

  it("calls on_cancel when Cancel is clicked", async () => {
    const on_cancel = vi.fn();
    render(
      <ProfileSettingsPage current_name="Alice" on_save={vi.fn()} on_cancel={on_cancel} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(on_cancel).toHaveBeenCalledOnce();
  });
});
