import { useState, type ReactNode } from "react";
import {
  make_fraction,
  simplify,
  integer_part,
  fractional_part,
  format_fraction,
  add_fractions,
  subtract_fractions,
  multiply_fractions,
  divide_fractions,
  type Fraction,
} from "@recipe-book/shared";
import "./FractionEditor.css";

// ---------------------------------------------------------------------------
// Shared display + op constants (also used by MeasurementEditor)
// ---------------------------------------------------------------------------

export type OpMode = "÷" | "×" | "−" | "+";

export interface OpButton {
  readonly label: string;
  readonly apply: (f: Fraction) => Fraction;
}

export const OP_MODES: readonly OpMode[] = ["÷", "×", "−", "+"];

export const OP_ROWS: Record<OpMode, readonly OpButton[]> = {
  "÷": [
    { label: "÷2", apply: (f) => divide_fractions(f, make_fraction(2, 1)) },
    { label: "÷3", apply: (f) => divide_fractions(f, make_fraction(3, 1)) },
    { label: "÷5", apply: (f) => divide_fractions(f, make_fraction(5, 1)) },
  ],
  "×": [
    { label: "×2", apply: (f) => multiply_fractions(f, make_fraction(2, 1)) },
    { label: "×3", apply: (f) => multiply_fractions(f, make_fraction(3, 1)) },
    { label: "×5", apply: (f) => multiply_fractions(f, make_fraction(5, 1)) },
  ],
  "−": [
    { label: "−1", apply: (f) => subtract_fractions(f, make_fraction(1, 1)) },
    { label: "−½", apply: (f) => subtract_fractions(f, make_fraction(1, 2)) },
    { label: "−⅓", apply: (f) => subtract_fractions(f, make_fraction(1, 3)) },
    { label: "−⅕", apply: (f) => subtract_fractions(f, make_fraction(1, 5)) },
    { label: "−⅛", apply: (f) => subtract_fractions(f, make_fraction(1, 8)) },
  ],
  "+": [
    { label: "+⅛", apply: (f) => add_fractions(f, make_fraction(1, 8)) },
    { label: "+⅕", apply: (f) => add_fractions(f, make_fraction(1, 5)) },
    { label: "+⅓", apply: (f) => add_fractions(f, make_fraction(1, 3)) },
    { label: "+½", apply: (f) => add_fractions(f, make_fraction(1, 2)) },
    { label: "+1", apply: (f) => add_fractions(f, make_fraction(1, 1)) },
  ],
};

// ---------------------------------------------------------------------------
// FractionDisplay
// ---------------------------------------------------------------------------

export interface FractionDisplayProps {
  readonly value: Fraction;
}

export function FractionDisplay({ value }: FractionDisplayProps) {
  const s = simplify(value);
  const int = integer_part(s);
  const frac = fractional_part(s);

  return (
    <span className="fe-display" aria-label={format_fraction(s)}>
      {(int !== 0 || frac.numerator === 0) && (
        <span className="fe-integer">{int === 0 ? "0" : int}</span>
      )}
      {frac.numerator !== 0 && (
        <span className="fe-fraction">
          <sup>{Math.abs(frac.numerator)}</sup>
          {"⁄"}
          <sub>{frac.denominator}</sub>
        </span>
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------
// FractionEditor
// ---------------------------------------------------------------------------

export interface FractionEditorProps {
  readonly value: Fraction;
  readonly on_commit: (value: Fraction) => void;
  /** Rendered between the operation buttons and the OK button when editing. */
  readonly extra_controls?: ReactNode;
}

export function FractionEditor({ value, on_commit, extra_controls }: FractionEditorProps) {
  const [editing, set_editing] = useState(false);
  const [original, set_original] = useState<Fraction>(value);
  const [current, set_current] = useState<Fraction>(value);
  const [op_mode, set_op_mode] = useState<OpMode>("÷");

  function open_editor() {
    set_original(value);
    set_current(value);
    set_op_mode("÷");
    set_editing(true);
  }

  function reset() {
    set_current(original);
  }

  function apply_op(op: OpButton) {
    set_current(simplify(op.apply(current)));
  }

  function commit() {
    on_commit(current);
    set_editing(false);
  }

  if (!editing) {
    return (
      <span className="fe-root fe-root--closed">
        <FractionDisplay value={value} />
        <button
          type="button"
          className="fe-toggle-btn"
          onClick={open_editor}
          aria-label="Edit value"
        >
          ±
        </button>
      </span>
    );
  }

  return (
    <span className="fe-root fe-root--open">
      <span className="fe-header">
        <button
          type="button"
          className="fe-toggle-btn"
          onClick={reset}
          aria-label="Reset to original"
        >
          {"<"}
        </button>
        <FractionDisplay value={current} />
      </span>

      <span className="fe-op-modes" role="group" aria-label="Operation type">
        {OP_MODES.map((mode) => (
          <label key={mode} className="fe-mode-label">
            <input
              type="radio"
              className="fe-mode-radio"
              name="fe-op-mode"
              value={mode}
              checked={op_mode === mode}
              onChange={() => set_op_mode(mode)}
              aria-label={mode}
            />
            <span className="fe-mode-symbol" aria-hidden>
              {mode}
            </span>
          </label>
        ))}
      </span>

      <span className="fe-op-buttons">
        {OP_ROWS[op_mode].map((op) => (
          <button
            key={op.label}
            type="button"
            className="fe-op-btn"
            onClick={() => apply_op(op)}
          >
            {op.label}
          </button>
        ))}
      </span>

      {extra_controls}

      <button type="button" className="fe-ok-btn" onClick={commit} aria-label="OK">
        OK
      </button>
    </span>
  );
}
