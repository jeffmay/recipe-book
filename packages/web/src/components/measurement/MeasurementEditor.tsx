import { useState } from "react";
import {
  simplify,
  convert_volume,
  convert_weight,
  largest_whole_volume_unit,
  largest_whole_weight_unit,
  unit_type,
  type Fraction,
  type Measurement,
  type MeasurementType,
  type MeasurementUnit,
  type VolumeUnit,
  type WeightUnit,
} from "@recipe-book/shared";
import { FractionDisplay, OP_MODES, OP_ROWS, type OpMode } from "./FractionEditor.js";
import "./MeasurementEditor.css";

// ---------------------------------------------------------------------------
// Unit groups
// ---------------------------------------------------------------------------

const VOLUME_US: readonly VolumeUnit[] = ["tsp", "tbsp", "fl_oz", "cup", "pint", "quart", "gallon"];
const VOLUME_METRIC: readonly VolumeUnit[] = ["ml", "l"];
const WEIGHT_US: readonly WeightUnit[] = ["oz", "lb"];
const WEIGHT_METRIC: readonly WeightUnit[] = ["g", "kg"];

const UNIT_LABELS: Record<MeasurementUnit, string> = {
  tsp: "tsp", tbsp: "tbsp", fl_oz: "fl oz", cup: "cup",
  pint: "pint", quart: "quart", gallon: "gallon",
  ml: "ml", l: "L",
  oz: "oz", lb: "lb", g: "g", kg: "kg",
  whole: "whole", pinch: "pinch", dash: "dash",
};

const DEFAULT_UNIT: Record<MeasurementType, MeasurementUnit> = {
  volume: "cup",
  weight: "oz",
  count: "whole",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function infer_type(unit: MeasurementUnit): MeasurementType {
  return unit_type(unit) ?? "volume";
}

/** Convert between units of the same type and system; returns value unchanged on failure. */
function try_convert(value: Fraction, from: MeasurementUnit, to: MeasurementUnit): Fraction {
  if (from === to) return value;
  try {
    const t = infer_type(from);
    if (t !== infer_type(to)) return value;
    if (t === "volume") return convert_volume(value, from as VolumeUnit, to as VolumeUnit);
    if (t === "weight") return convert_weight(value, from as WeightUnit, to as WeightUnit);
    return value;
  } catch {
    return value; // cross-system (e.g. tsp → ml)
  }
}

/** Convert to the largest unit that makes the value a whole number. */
function best_unit_conversion(value: Fraction, unit: MeasurementUnit): Measurement {
  const t = infer_type(unit);
  if (t === "volume") {
    const best = largest_whole_volume_unit(value, unit as VolumeUnit);
    return { value: convert_volume(value, unit as VolumeUnit, best), unit: best };
  }
  if (t === "weight") {
    const best = largest_whole_weight_unit(value, unit as WeightUnit);
    return { value: convert_weight(value, unit as WeightUnit, best), unit: best };
  }
  return { value, unit };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface MeasurementEditorProps {
  readonly value: Measurement;
  readonly on_commit: (value: Measurement) => void;
}

export function MeasurementEditor({ value, on_commit }: MeasurementEditorProps) {
  const [editing, set_editing] = useState(false);
  const [original, set_original] = useState<Fraction>(value.value);
  const [current, set_current] = useState<Fraction>(value.value);
  const [op_mode, set_op_mode] = useState<OpMode>("÷");
  const [mtype, set_mtype] = useState<MeasurementType>(() => infer_type(value.unit));
  const [unit, set_unit] = useState<MeasurementUnit>(value.unit);

  function open_editor() {
    set_original(value.value);
    set_current(value.value);
    set_op_mode("÷");
    set_mtype(infer_type(value.unit));
    set_unit(value.unit);
    set_editing(true);
  }

  function reset() {
    set_current(original);
  }

  function apply_op_button(label: string) {
    const op = OP_ROWS[op_mode].find((o) => o.label === label);
    if (op) set_current(simplify(op.apply(current)));
  }

  function handle_type_change(new_type: MeasurementType) {
    set_mtype(new_type);
    set_unit(DEFAULT_UNIT[new_type]);
    // No fraction conversion when switching between measurement types
  }

  function handle_unit_change(new_unit: MeasurementUnit) {
    const converted = try_convert(current, unit, new_unit);
    set_current(converted);
    set_unit(new_unit);
  }

  function commit() {
    const result = best_unit_conversion(current, unit);
    on_commit({ value: simplify(result.value), unit: result.unit });
    set_editing(false);
  }

  if (!editing) {
    return (
      <span className="me-root me-root--closed">
        <FractionDisplay value={value.value} />
        <span className="me-unit">{UNIT_LABELS[value.unit]}</span>
        <button
          type="button"
          className="fe-toggle-btn"
          onClick={open_editor}
          aria-label="Edit measurement"
        >
          ±
        </button>
      </span>
    );
  }

  return (
    <span className="me-root me-root--open">
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
        <span className="me-unit">{UNIT_LABELS[unit]}</span>
      </span>

      <span className="fe-op-modes" role="group" aria-label="Operation type">
        {OP_MODES.map((mode) => (
          <label key={mode} className="fe-mode-label">
            <input
              type="radio"
              className="fe-mode-radio"
              name="me-op-mode"
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
            onClick={() => apply_op_button(op.label)}
          >
            {op.label}
          </button>
        ))}
      </span>

      {/* Type + unit selectors inserted between op buttons and OK */}
      <span className="me-controls">
        <label className="me-control-label">
          Type
          <select
            className="me-select"
            value={mtype}
            onChange={(e) => handle_type_change(e.target.value as MeasurementType)}
            aria-label="Measurement type"
          >
            <option value="volume">Volume</option>
            <option value="weight">Weight</option>
            <option value="count">Count</option>
          </select>
        </label>

        <label className="me-control-label">
          Unit
          <select
            className="me-select"
            value={unit}
            onChange={(e) => handle_unit_change(e.target.value as MeasurementUnit)}
            aria-label="Measurement unit"
          >
            {mtype === "volume" && (
              <>
                <optgroup label="US">
                  {VOLUME_US.map((u) => (
                    <option key={u} value={u}>{UNIT_LABELS[u]}</option>
                  ))}
                </optgroup>
                <optgroup label="Metric">
                  {VOLUME_METRIC.map((u) => (
                    <option key={u} value={u}>{UNIT_LABELS[u]}</option>
                  ))}
                </optgroup>
              </>
            )}
            {mtype === "weight" && (
              <>
                <optgroup label="US">
                  {WEIGHT_US.map((u) => (
                    <option key={u} value={u}>{UNIT_LABELS[u]}</option>
                  ))}
                </optgroup>
                <optgroup label="Metric">
                  {WEIGHT_METRIC.map((u) => (
                    <option key={u} value={u}>{UNIT_LABELS[u]}</option>
                  ))}
                </optgroup>
              </>
            )}
            {mtype === "count" && (
              <>
                <option value="whole">{UNIT_LABELS.whole}</option>
                <option value="pinch">{UNIT_LABELS.pinch}</option>
                <option value="dash">{UNIT_LABELS.dash}</option>
              </>
            )}
          </select>
        </label>
      </span>

      <button type="button" className="fe-ok-btn" onClick={commit} aria-label="OK">
        OK
      </button>
    </span>
  );
}
