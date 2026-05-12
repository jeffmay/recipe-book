import { useState } from "react";
import parse from "parse-duration";
import humanize, { type HumanizeDurationOptions } from "humanize-duration";
import "./DurationEditor.css";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type DurationUnit = "min" | "sec";

const MIN_DELTAS = [-5, -1, 1, 5] as const;
const SEC_DELTAS = [-15, -5, 5, 15] as const;

const HUMANIZE_OPTS: HumanizeDurationOptions = {
  units: ["h", "m", "s"],
  largest: 2,
  round: true,
};

function humanize_seconds(seconds: number): string {
  return humanize(seconds * 1000, HUMANIZE_OPTS);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface DurationEditorProps {
  readonly value: number; // seconds
  readonly on_commit: (seconds: number) => void;
}

export function DurationEditor({ value, on_commit }: DurationEditorProps) {
  const [editing, set_editing] = useState(false);
  const [original, set_original] = useState(value);
  const [current, set_current] = useState(value);
  const [unit, set_unit] = useState<DurationUnit>("min");
  const [input_text, set_input_text] = useState("");
  const [input_error, set_input_error] = useState(false);

  function open_editor() {
    set_original(value);
    set_current(value);
    set_unit("min");
    set_input_text(humanize_seconds(value));
    set_input_error(false);
    set_editing(true);
  }

  function handle_input_change(text: string) {
    set_input_text(text);
    if (text.trim() === "") {
      set_input_error(false);
      return;
    }
    const parsed_ms = parse(text);
    if (parsed_ms != null && parsed_ms >= 0) {
      set_current(Math.round(parsed_ms / 1000));
      set_input_error(false);
    } else {
      set_input_error(true);
    }
  }

  function adjust(delta_seconds: number) {
    const new_value = Math.max(0, current + delta_seconds);
    set_current(new_value);
    set_input_text(humanize_seconds(new_value));
    set_input_error(false);
  }

  function revert() {
    set_current(original);
    set_input_text(humanize_seconds(original));
    set_input_error(false);
  }

  function commit() {
    on_commit(current);
    set_editing(false);
  }

  if (!editing) {
    return (
      <span className="de-root de-root--closed">
        <span className="de-display">{humanize_seconds(value)}</span>
        <button
          type="button"
          className="de-toggle-btn"
          onClick={open_editor}
          aria-label="Edit duration"
        >
          ±
        </button>
      </span>
    );
  }

  const deltas = unit === "min" ? MIN_DELTAS : SEC_DELTAS;

  return (
    <span className="de-root de-root--open">
      <span className="de-header">
        <button
          type="button"
          className="de-toggle-btn"
          onClick={revert}
          aria-label="Reset to original"
        >
          {"<"}
        </button>
        <input
          className={`de-input${input_error ? " de-input--error" : ""}`}
          type="text"
          value={input_text}
          onChange={(e) => handle_input_change(e.target.value)}
          aria-label="Duration"
          aria-invalid={input_error}
          placeholder="e.g. 5 min, 1h 30m"
        />
      </span>

      <span className="de-unit-toggle" role="group" aria-label="Duration unit">
        <button
          type="button"
          className={`de-unit-btn${unit === "min" ? " de-unit-btn--active" : ""}`}
          onClick={() => set_unit("min")}
          aria-pressed={unit === "min"}
        >
          min
        </button>
        <button
          type="button"
          className={`de-unit-btn${unit === "sec" ? " de-unit-btn--active" : ""}`}
          onClick={() => set_unit("sec")}
          aria-pressed={unit === "sec"}
        >
          sec
        </button>
      </span>

      <span className="de-adjust-buttons">
        {deltas.map((delta) => {
          const seconds = unit === "min" ? delta * 60 : delta;
          const label = delta > 0 ? `+${delta}` : String(delta);
          return (
            <button
              key={delta}
              type="button"
              className="de-adjust-btn"
              onClick={() => adjust(seconds)}
              aria-label={`${label} ${unit}`}
            >
              {label}
            </button>
          );
        })}
      </span>

      <button type="button" className="de-ok-btn" onClick={commit} aria-label="OK">
        OK
      </button>
    </span>
  );
}
