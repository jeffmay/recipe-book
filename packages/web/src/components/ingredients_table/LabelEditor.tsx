import { useState, useMemo } from "react";
import CreatableSelect from "react-select/creatable";
import type { MultiValue } from "react-select";

interface LabelOption {
  readonly label: string;
  readonly value: string;
}

export interface LabelEditorProps {
  readonly selected_label_names: readonly string[];
  readonly all_label_names: readonly string[];
  readonly ingredient_name: string;
  readonly on_change: (names: readonly string[]) => void;
  readonly on_commit: () => void;
  readonly on_cancel: () => void;
}

export function LabelEditor({
  selected_label_names,
  all_label_names,
  ingredient_name,
  on_change,
  on_commit,
  on_cancel,
}: LabelEditorProps) {
  const [menu_open, set_menu_open] = useState(false);

  const selected_options = useMemo(
    () => selected_label_names.map((name) => ({ label: name, value: name })),
    [selected_label_names],
  );

  const all_options = useMemo(
    () => all_label_names.map((name) => ({ label: name, value: name })),
    [all_label_names],
  );

  function handle_change(new_value: MultiValue<LabelOption>): void {
    on_change(new_value.map((opt) => opt.value));
  }

  return (
    <span className="it-label-editor">
      <CreatableSelect<LabelOption, true>
        isMulti
        value={selected_options}
        options={all_options}
        onChange={handle_change}
        aria-label={`Edit labels for ${ingredient_name}`}
        menuPortalTarget={document.body}
        menuPosition="fixed"
        classNamePrefix="le"
        onMenuOpen={() => set_menu_open(true)}
        onMenuClose={() => set_menu_open(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && !menu_open) {
            e.preventDefault();
            on_cancel();
          }
        }}
      />
      <button
        type="button"
        className="it-confirm-btn"
        onClick={on_commit}
        aria-label="Confirm edit"
      >
        ✔︎
      </button>
      <button
        type="button"
        className="it-cancel-btn"
        onClick={on_cancel}
        aria-label="Cancel edit"
      >
        ✗
      </button>
    </span>
  );
}
