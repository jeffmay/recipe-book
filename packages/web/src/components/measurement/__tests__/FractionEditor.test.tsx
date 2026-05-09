import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { make_fraction, simplify } from "@recipe-book/shared";
import { FractionEditor } from "../FractionEditor.js";

const ONE_HALF = make_fraction(1, 2);
const ONE = make_fraction(1, 1);
const THREE = make_fraction(3, 1);

function setup(value = ONE, on_commit = vi.fn()) {
  render(<FractionEditor value={value} on_commit={on_commit} />);
  return { on_commit };
}

async function open_editor(value = ONE) {
  const { on_commit } = setup(value);
  await userEvent.click(screen.getByRole("button", { name: "Edit value" }));
  return { on_commit };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("FractionEditor — closed state", () => {
  it("shows the fraction display with aria-label", () => {
    setup(ONE_HALF);
    expect(screen.getByLabelText("1/2")).toBeInTheDocument();
  });

  it("shows the ± button", () => {
    setup();
    expect(screen.getByRole("button", { name: "Edit value" })).toBeInTheDocument();
  });

  it("does not show the OK button when closed", () => {
    setup();
    expect(screen.queryByRole("button", { name: "OK" })).not.toBeInTheDocument();
  });
});

describe("FractionEditor — opening the editor", () => {
  it("clicking ± replaces it with the < button", async () => {
    await open_editor();
    expect(screen.getByRole("button", { name: "Reset to original" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit value" })).not.toBeInTheDocument();
  });

  it("shows the OK button after opening", async () => {
    await open_editor();
    expect(screen.getByRole("button", { name: "OK" })).toBeInTheDocument();
  });

  it("shows the operation type radio group", async () => {
    await open_editor();
    expect(screen.getByRole("group", { name: "Operation type" })).toBeInTheDocument();
  });

  it("defaults to the ÷ mode button row", async () => {
    await open_editor();
    expect(screen.getByRole("button", { name: "÷2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "÷3" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "÷5" })).toBeInTheDocument();
  });
});

describe("FractionEditor — operation mode switching", () => {
  it("switching to × shows multiply buttons", async () => {
    await open_editor();
    await userEvent.click(screen.getByRole("radio", { name: "×" }));
    expect(screen.getByRole("button", { name: "×2" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "÷2" })).not.toBeInTheDocument();
  });

  it("switching to − shows subtract buttons", async () => {
    await open_editor();
    await userEvent.click(screen.getByRole("radio", { name: "−" }));
    expect(screen.getByRole("button", { name: "−1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "−½" })).toBeInTheDocument();
  });

  it("switching to + shows add buttons", async () => {
    await open_editor();
    await userEvent.click(screen.getByRole("radio", { name: "+" }));
    expect(screen.getByRole("button", { name: "+1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+½" })).toBeInTheDocument();
  });
});

describe("FractionEditor — applying operations", () => {
  it("÷2 halves the current value", async () => {
    await open_editor(ONE);
    await userEvent.click(screen.getByRole("button", { name: "÷2" }));
    expect(screen.getByLabelText("1/2")).toBeInTheDocument();
  });

  it("×3 triples the current value", async () => {
    await open_editor(ONE);
    await userEvent.click(screen.getByRole("radio", { name: "×" }));
    await userEvent.click(screen.getByRole("button", { name: "×3" }));
    expect(screen.getByLabelText("3")).toBeInTheDocument();
  });

  it("+1 adds one to the current value", async () => {
    await open_editor(ONE);
    await userEvent.click(screen.getByRole("radio", { name: "+" }));
    await userEvent.click(screen.getByRole("button", { name: "+1" }));
    expect(screen.getByLabelText("2")).toBeInTheDocument();
  });

  it("−½ subtracts one half", async () => {
    await open_editor(ONE);
    await userEvent.click(screen.getByRole("radio", { name: "−" }));
    await userEvent.click(screen.getByRole("button", { name: "−½" }));
    expect(screen.getByLabelText("1/2")).toBeInTheDocument();
  });

  it("chains multiple operations", async () => {
    await open_editor(THREE);
    await userEvent.click(screen.getByRole("button", { name: "÷3" }));
    // 3 ÷ 3 = 1
    expect(screen.getByLabelText("1")).toBeInTheDocument();
  });
});

describe("FractionEditor — reset", () => {
  it("< resets the display to the original value", async () => {
    await open_editor(ONE);
    await userEvent.click(screen.getByRole("button", { name: "÷2" }));
    expect(screen.getByLabelText("1/2")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Reset to original" }));
    expect(screen.getByLabelText("1")).toBeInTheDocument();
  });

  it("editor stays open after reset", async () => {
    await open_editor();
    await userEvent.click(screen.getByRole("button", { name: "Reset to original" }));
    expect(screen.getByRole("button", { name: "OK" })).toBeInTheDocument();
  });
});

describe("FractionEditor — OK", () => {
  it("calls on_commit with the current fraction", async () => {
    const { on_commit } = await open_editor(ONE);
    await userEvent.click(screen.getByRole("button", { name: "÷2" }));
    await userEvent.click(screen.getByRole("button", { name: "OK" }));
    expect(on_commit).toHaveBeenCalledWith(simplify(ONE_HALF));
  });

  it("closes the editor and restores ± after OK", async () => {
    await open_editor();
    await userEvent.click(screen.getByRole("button", { name: "OK" }));
    expect(screen.getByRole("button", { name: "Edit value" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "OK" })).not.toBeInTheDocument();
  });

  it("calls on_commit with unchanged value when no ops applied", async () => {
    const { on_commit } = await open_editor(ONE);
    await userEvent.click(screen.getByRole("button", { name: "OK" }));
    expect(on_commit).toHaveBeenCalledWith(ONE);
  });
});

describe("FractionEditor — extra_controls slot", () => {
  it("renders extra_controls between op buttons and OK", async () => {
    render(
      <FractionEditor
        value={ONE}
        on_commit={vi.fn()}
        extra_controls={<span data-testid="extra">extra</span>}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Edit value" }));
    expect(screen.getByTestId("extra")).toBeInTheDocument();
  });
});
