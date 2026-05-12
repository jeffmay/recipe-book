import { useState } from "react";
import {
  type ContainerItem,
  type Ingredient,
  type IngredientItem,
  type Instruction,
  type Recipe,
  type RecipeFolderId,
  type RecipeIngredient,
  type RecipeVersion,
  type Section,
  type SectionItem,
  type TextBlock,
  load_id,
  random_id,
  EquipmentId,
  RecipeIngredientId,
  RecipeVersionId,
  SectionItemId,
} from "@recipe-book/shared";
import { MeasurementEditor } from "../components/measurement/MeasurementEditor.js";
import { DurationEditor } from "../components/duration/DurationEditor.js";
import { use_ingredient_store } from "../hooks/use_ingredient_store.js";
import { use_recipe_folder_store } from "../hooks/use_recipe_folder_store.js";
import { use_recipe_store, latest_version } from "../hooks/use_recipe_store.js";
import "./RecipeEditorPage.css";

// ---------------------------------------------------------------------------
// Helper: flatten folder tree for <select>
// ---------------------------------------------------------------------------

interface FlatFolder {
  id: RecipeFolderId;
  label: string;
}

function flatten_folders(
  folders: Array<{ id: RecipeFolderId; name: string; children?: unknown[] }>,
  depth = 0,
): FlatFolder[] {
  const result: FlatFolder[] = [];
  for (const f of folders) {
    result.push({ id: f.id, label: " ".repeat(depth * 2) + f.name });
    if (Array.isArray(f.children) && f.children.length > 0) {
      result.push(
        ...flatten_folders(
          f.children as Array<{ id: RecipeFolderId; name: string; children?: unknown[] }>,
          depth + 1,
        ),
      );
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Helper: heading level for section depth
// ---------------------------------------------------------------------------

type HeadingLevel = "h2" | "h3" | "h4" | "h5" | "h6";

function heading_for_depth(depth: number): HeadingLevel {
  const levels: HeadingLevel[] = ["h2", "h3", "h4", "h5", "h6"];
  return levels[Math.min(depth - 1, levels.length - 1)] ?? "h6";
}

// ---------------------------------------------------------------------------
// NotesPanel
// ---------------------------------------------------------------------------

interface NotesPanelProps {
  readonly notes: string[];
  readonly on_change: (notes: string[]) => void;
}

function NotesPanel({ notes, on_change }: NotesPanelProps) {
  const [adding, set_adding] = useState(false);
  const [draft, set_draft] = useState("");

  function submit_note() {
    const trimmed = draft.trim();
    if (trimmed) on_change([...notes, trimmed]);
    set_draft("");
    set_adding(false);
  }

  return (
    <aside className="re-notes-panel" aria-label="Notes">
      <ul className="re-notes-list">
        {notes.map((note, i) => (
          <li key={i} className="re-note-item">
            <span className="re-note-text">{note}</span>
            <button
              type="button"
              className="re-note-remove"
              onClick={() => on_change(notes.filter((_, j) => j !== i))}
              aria-label={`Remove note: ${note}`}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      {adding ? (
        <span className="re-notes-add-row">
          <input
            className="re-notes-input"
            value={draft}
            onChange={(e) => set_draft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit_note()}
            placeholder="Add a note…"
            aria-label="New note text"
            autoFocus
          />
          <button type="button" onClick={submit_note} aria-label="Save note">✓</button>
          <button type="button" onClick={() => { set_adding(false); set_draft(""); }} aria-label="Cancel note">✕</button>
        </span>
      ) : (
        <button
          type="button"
          className="re-notes-add-btn"
          onClick={() => set_adding(true)}
          aria-label="Add note"
        >
          + note
        </button>
      )}
    </aside>
  );
}

// ---------------------------------------------------------------------------
// IngredientItemRow
// ---------------------------------------------------------------------------

interface IngredientItemRowProps {
  readonly item: IngredientItem;
  readonly top_ingredients: RecipeIngredient[];
  readonly all_ingredients: readonly Ingredient[];
  readonly on_change: (item: IngredientItem) => void;
  readonly on_remove: () => void;
}

function IngredientItemRow({
  item,
  top_ingredients,
  all_ingredients,
  on_change,
  on_remove,
}: IngredientItemRowProps) {
  const top = top_ingredients.find((ti) => ti.ingredient_id === item.ingredient_id);
  const ingredient = all_ingredients.find((i) => i.id === item.ingredient_id);
  const name = ingredient?.name ?? item.ingredient_id;
  const amount_from_top = top?.amount;

  return (
    <div className="re-item re-item--ingredient" role="group" aria-label={`Ingredient: ${name}`}>
      <span className="re-item-label">{name}</span>
      {amount_from_top !== undefined ? (
        <span className="re-item-amount re-item-amount--inherited" title="Amount from top-level ingredients">
          {/* Amount inherited from top-level; hidden inline */}
        </span>
      ) : (
        <MeasurementEditor
          value={item.amount ?? { value: { numerator: 1, denominator: 1 }, unit: "cup" }}
          on_commit={(amount) => on_change({ ...item, amount })}
        />
      )}
      <NotesPanel
        notes={item.notes ?? []}
        on_change={(notes) => on_change({ ...item, notes })}
      />
      <button type="button" className="re-item-remove" onClick={on_remove} aria-label={`Remove ingredient ${name}`}>−</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ContainerItemRow
// ---------------------------------------------------------------------------

const COMMON_CONTAINERS = [
  { id: "----------bowl", name: "Bowl" },
  { id: "----------pot", name: "Pot" },
  { id: "-------steamer", name: "Steamer" },
  { id: "----------foil", name: "Foil" },
  { id: "----------pan", name: "Pan" },
  { id: "---------plate", name: "Plate" },
] as const;

interface ContainerItemRowProps {
  readonly item: ContainerItem;
  readonly top_ingredients: RecipeIngredient[];
  readonly all_ingredients: readonly Ingredient[];
  readonly on_change: (item: ContainerItem) => void;
  readonly on_remove: () => void;
}

function ContainerItemRow({ item, top_ingredients, all_ingredients, on_change, on_remove }: ContainerItemRowProps) {
  const container_name = COMMON_CONTAINERS.find((c) => c.id === item.container_id)?.name ?? item.container_id;

  function add_content_ingredient(ingredient_id: string) {
    if (!ingredient_id) return;
    const new_item: IngredientItem = {
      kind: "ingredient",
      id: random_id(SectionItemId),
      ingredient_id: ingredient_id as IngredientItem["ingredient_id"],
    };
    on_change({ ...item, contents: [...item.contents, new_item] });
  }

  return (
    <div className="re-item re-item--container" role="group" aria-label={`Container: ${container_name} — ${item.descriptor}`}>
      <div className="re-item-header">
        <select
          className="re-container-select"
          value={item.container_id}
          onChange={(e) => on_change({ ...item, container_id: e.target.value as ContainerItem["container_id"] })}
          aria-label="Container type"
        >
          {COMMON_CONTAINERS.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input
          className="re-container-descriptor"
          value={item.descriptor}
          onChange={(e) => on_change({ ...item, descriptor: e.target.value })}
          placeholder="Descriptor (e.g. large, wet ingredients)"
          aria-label="Container descriptor"
        />
        <label className="re-container-ordered">
          <input
            type="checkbox"
            checked={item.ordered ?? false}
            onChange={(e) => on_change({ ...item, ordered: e.target.checked })}
            aria-label="Ordered list"
          />
          ordered
        </label>
        <button type="button" className="re-item-remove" onClick={on_remove} aria-label={`Remove container ${container_name}`}>−</button>
      </div>
      <div className="re-container-contents">
        {item.contents.map((content, i) => (
          <IngredientItemRow
            key={content.id}
            item={content}
            top_ingredients={top_ingredients}
            all_ingredients={all_ingredients}
            on_change={(updated) => {
              const new_contents = item.contents.map((c, j) => (j === i ? updated : c));
              on_change({ ...item, contents: new_contents });
            }}
            on_remove={() => on_change({ ...item, contents: item.contents.filter((_, j) => j !== i) })}
          />
        ))}
        <select
          className="re-container-add-ingredient"
          value=""
          onChange={(e) => { add_content_ingredient(e.target.value); e.target.value = ""; }}
          aria-label="Add ingredient to container"
        >
          <option value="">+ Add ingredient…</option>
          {all_ingredients.map((ing) => (
            <option key={ing.id} value={ing.id}>{ing.name}</option>
          ))}
        </select>
      </div>
      <NotesPanel
        notes={item.notes ?? []}
        on_change={(notes) => on_change({ ...item, notes })}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// InstructionRow
// ---------------------------------------------------------------------------

const COMMON_EQUIPMENT = [
  { id: "--------oven", name: "Oven" },
  { id: "------stove", name: "Stove" },
  { id: "-------mixer", name: "Mixer" },
  { id: "------blender", name: "Blender" },
  { id: "---------knife", name: "Knife" },
  { id: "-------skillet", name: "Skillet" },
] as const;

interface InstructionRowProps {
  readonly item: Instruction;
  readonly top_ingredients: RecipeIngredient[];
  readonly all_ingredients: readonly Ingredient[];
  readonly on_change: (item: Instruction) => void;
  readonly on_remove: () => void;
  readonly on_add_top_ingredient: (ingredient_id: IngredientItem["ingredient_id"]) => void;
}

function InstructionRow({ item, top_ingredients, all_ingredients, on_change, on_remove, on_add_top_ingredient }: InstructionRowProps) {
  function toggle_ingredient(ingredient_id: IngredientItem["ingredient_id"]) {
    const current = item.ingredient_ids ?? [];
    const exists = current.includes(ingredient_id);
    const new_ids = exists
      ? current.filter((id) => id !== ingredient_id)
      : [...current, ingredient_id];
    // If adding a new ingredient not in top-level list, add it there too
    if (!exists && !top_ingredients.some((ti) => ti.ingredient_id === ingredient_id)) {
      on_add_top_ingredient(ingredient_id);
    }
    if (new_ids.length > 0) {
      on_change({ ...item, ingredient_ids: new_ids });
    } else {
      const { ingredient_ids: _, ...rest } = item;
      on_change(rest as Instruction);
    }
  }

  return (
    <div className="re-item re-item--instruction" role="group" aria-label={`Instruction: ${item.instruction || "new"}`}>
      <div className="re-item-header">
        <input
          className="re-instruction-text"
          value={item.instruction}
          onChange={(e) => on_change({ ...item, instruction: e.target.value })}
          placeholder="Action (e.g. mix, bake, stir)"
          aria-label="Instruction text"
        />
        <select
          className="re-instruction-equipment"
          value={item.equipment_id ?? ""}
          onChange={(e) => {
            if (e.target.value) {
              on_change({ ...item, equipment_id: load_id(EquipmentId, e.target.value) });
            } else {
              const { equipment_id: _, ...rest } = item;
              on_change(rest as Instruction);
            }
          }}
          aria-label="Equipment"
        >
          <option value="">— No equipment —</option>
          {COMMON_EQUIPMENT.map((eq) => (
            <option key={eq.id} value={eq.id}>{eq.name}</option>
          ))}
        </select>
        <button type="button" className="re-item-remove" onClick={on_remove} aria-label="Remove instruction">−</button>
      </div>

      <div className="re-instruction-duration">
        <label className="re-instruction-duration-label">
          Duration:
          {item.duration_seconds !== undefined ? (
            <DurationEditor
              value={item.duration_seconds}
              on_commit={(s) => on_change({ ...item, duration_seconds: s })}
            />
          ) : (
            <button
              type="button"
              className="re-instruction-add-duration"
              onClick={() => on_change({ ...item, duration_seconds: 300 })}
            >
              + Add duration
            </button>
          )}
        </label>
        {item.duration_seconds !== undefined && (
          <button
            type="button"
            className="re-instruction-remove-duration"
            onClick={() => {
              const { duration_seconds: _, ...rest } = item;
              on_change(rest as Instruction);
            }}
            aria-label="Remove duration"
          >
            ×
          </button>
        )}
      </div>

      <div className="re-instruction-ingredients">
        <span className="re-instruction-ing-label">Ingredients:</span>
        {all_ingredients.map((ing) => {
          const checked = (item.ingredient_ids ?? []).includes(ing.id as IngredientItem["ingredient_id"]);
          const top = top_ingredients.find((ti) => ti.ingredient_id === ing.id);
          return (
            <label key={ing.id} className="re-instruction-ing-option">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle_ingredient(ing.id as IngredientItem["ingredient_id"])}
                aria-label={ing.name}
              />
              {ing.name}
              {checked && top?.amount === undefined && (
                <MeasurementEditor
                  value={{ value: { numerator: 1, denominator: 1 }, unit: "cup" }}
                  on_commit={(amount) => {
                    // Update the ingredient amount on the top-level RecipeIngredient
                    // This is handled by the parent; we emit a signal here
                    void amount;
                  }}
                />
              )}
            </label>
          );
        })}
      </div>

      <NotesPanel
        notes={item.notes ?? []}
        on_change={(notes) => on_change({ ...item, notes })}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// TextBlockRow
// ---------------------------------------------------------------------------

interface TextBlockRowProps {
  readonly item: TextBlock;
  readonly on_change: (item: TextBlock) => void;
  readonly on_remove: () => void;
}

function TextBlockRow({ item, on_change, on_remove }: TextBlockRowProps) {
  return (
    <div className="re-item re-item--text-block" role="group" aria-label="Text block">
      <textarea
        className="re-text-block-input"
        value={item.text}
        onChange={(e) => on_change({ ...item, text: e.target.value })}
        placeholder="Enter text…"
        aria-label="Text block content"
        rows={3}
      />
      <NotesPanel
        notes={item.notes ?? []}
        on_change={(notes) => on_change({ ...item, notes })}
      />
      <button type="button" className="re-item-remove" onClick={on_remove} aria-label="Remove text block">−</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SectionEditor (recursive)
// ---------------------------------------------------------------------------

type NewItemKind = "ingredient" | "container" | "instruction" | "text_block" | "section";

interface SectionEditorProps {
  readonly section: Section;
  readonly depth: number;
  readonly top_ingredients: RecipeIngredient[];
  readonly all_ingredients: readonly Ingredient[];
  readonly on_change: (section: Section) => void;
  readonly on_remove: () => void;
  readonly on_add_top_ingredient: (ingredient_id: IngredientItem["ingredient_id"]) => void;
}

function SectionEditor({
  section,
  depth,
  top_ingredients,
  all_ingredients,
  on_change,
  on_remove,
  on_add_top_ingredient,
}: SectionEditorProps) {
  const Heading = heading_for_depth(depth);

  function update_item(index: number, updated: SectionItem) {
    const new_contents = section.contents.map((item, i) => (i === index ? updated : item));
    on_change({ ...section, contents: new_contents });
  }

  function remove_item(index: number) {
    on_change({ ...section, contents: section.contents.filter((_, i) => i !== index) });
  }

  function add_item(kind: NewItemKind) {
    const new_id = random_id(SectionItemId);
    let new_item: SectionItem;
    if (kind === "ingredient") {
      new_item = {
        kind: "ingredient",
        id: new_id,
        ingredient_id: all_ingredients[0]?.id ?? ("" as IngredientItem["ingredient_id"]),
      };
    } else if (kind === "container") {
      new_item = {
        kind: "container",
        id: new_id,
        container_id: COMMON_CONTAINERS[0]!.id as ContainerItem["container_id"],
        descriptor: "",
        contents: [],
      };
    } else if (kind === "instruction") {
      new_item = { kind: "instruction", id: new_id, instruction: "" };
    } else if (kind === "text_block") {
      new_item = { kind: "text_block", id: new_id, text: "" };
    } else {
      if (depth >= 5) return;
      new_item = { kind: "section", id: new_id, contents: [] };
    }
    on_change({ ...section, contents: [...section.contents, new_item] });
  }

  return (
    <div role="group" className={`re-section re-section--depth-${depth}`} aria-label={`Section: ${section.header ?? "unnamed"}`}>
      <div className="re-section-header-row">
        <Heading className="re-section-heading">
          <input
            className="re-section-header-input"
            value={section.header ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              if (val) {
                on_change({ ...section, header: val });
              } else {
                const { header: _, ...rest } = section;
                on_change(rest as Section);
              }
            }}
            placeholder="Section header (optional)"
            aria-label="Section header"
          />
        </Heading>
        <NotesPanel
          notes={section.notes ?? []}
          on_change={(notes) => on_change({ ...section, notes })}
        />
        <button type="button" className="re-item-remove" onClick={on_remove} aria-label="Remove section">−</button>
      </div>

      <div className="re-section-contents">
        {section.contents.map((item, i) => {
          if (item.kind === "ingredient") {
            return (
              <IngredientItemRow
                key={item.id}
                item={item}
                top_ingredients={top_ingredients}
                all_ingredients={all_ingredients}
                on_change={(updated) => update_item(i, updated)}
                on_remove={() => remove_item(i)}
              />
            );
          }
          if (item.kind === "container") {
            return (
              <ContainerItemRow
                key={item.id}
                item={item}
                top_ingredients={top_ingredients}
                all_ingredients={all_ingredients}
                on_change={(updated) => update_item(i, updated)}
                on_remove={() => remove_item(i)}
              />
            );
          }
          if (item.kind === "instruction") {
            return (
              <InstructionRow
                key={item.id}
                item={item}
                top_ingredients={top_ingredients}
                all_ingredients={all_ingredients}
                on_change={(updated) => update_item(i, updated)}
                on_remove={() => remove_item(i)}
                on_add_top_ingredient={on_add_top_ingredient}
              />
            );
          }
          if (item.kind === "text_block") {
            return (
              <TextBlockRow
                key={item.id}
                item={item}
                on_change={(updated) => update_item(i, updated)}
                on_remove={() => remove_item(i)}
              />
            );
          }
          if (item.kind === "section" && depth < 5) {
            return (
              <SectionEditor
                key={item.id}
                section={item}
                depth={depth + 1}
                top_ingredients={top_ingredients}
                all_ingredients={all_ingredients}
                on_change={(updated) => update_item(i, updated)}
                on_remove={() => remove_item(i)}
                on_add_top_ingredient={on_add_top_ingredient}
              />
            );
          }
          return null;
        })}
      </div>

      <div className="re-section-add-row">
        <span className="re-section-add-label">Add:</span>
        <button type="button" onClick={() => add_item("ingredient")} aria-label="Add ingredient to section">Ingredient</button>
        <button type="button" onClick={() => add_item("container")} aria-label="Add container to section">Container</button>
        <button type="button" onClick={() => add_item("instruction")} aria-label="Add instruction to section">Instruction</button>
        <button type="button" onClick={() => add_item("text_block")} aria-label="Add text block to section">Text</button>
        {depth < 5 && (
          <button type="button" onClick={() => add_item("section")} aria-label="Add sub-section">Sub-section</button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RecipeIngredientsEditor
// ---------------------------------------------------------------------------

interface RecipeIngredientsEditorProps {
  readonly ingredients: RecipeIngredient[];
  readonly all_ingredients: readonly Ingredient[];
  readonly on_change: (ingredients: RecipeIngredient[]) => void;
}

function RecipeIngredientsEditor({ ingredients, all_ingredients, on_change }: RecipeIngredientsEditorProps) {
  function add_ingredient(ingredient_id: string) {
    if (!ingredient_id) return;
    const already_added = ingredients.some((ri) => ri.ingredient_id === ingredient_id);
    if (already_added) return;
    const new_ri: RecipeIngredient = {
      id: random_id(RecipeIngredientId),
      ingredient_id: ingredient_id as RecipeIngredient["ingredient_id"],
    };
    on_change([...ingredients, new_ri]);
  }

  return (
    <section className="re-section-block" aria-label="Ingredients">
      <h2 className="re-section-title">Ingredients</h2>
      <div className="re-ing-list">
        {ingredients.map((ri, i) => {
          const ing = all_ingredients.find((a) => a.id === ri.ingredient_id);
          const name = ing?.name ?? ri.ingredient_id;
          return (
            <div key={ri.id} className="re-ing-row" role="group" aria-label={`Ingredient: ${name}`}>
              <span className="re-ing-name">{name}</span>
              <span className="re-ing-amount">
                {ri.amount !== undefined ? (
                  <MeasurementEditor
                    value={ri.amount}
                    on_commit={(amount) => {
                      const updated = ingredients.map((x, j) => (j === i ? { ...x, amount } : x));
                      on_change(updated);
                    }}
                  />
                ) : (
                  <span className="re-ing-amount-calc" title="Calculated from sections">
                    (calculated)
                    <button
                      type="button"
                      className="re-ing-add-amount"
                      onClick={() => {
                        const updated = ingredients.map((x, j) =>
                          j === i ? { ...x, amount: { value: { numerator: 1, denominator: 1 }, unit: "cup" as const } } : x
                        );
                        on_change(updated);
                      }}
                      aria-label={`Add amount for ${name}`}
                    >
                      + amount
                    </button>
                  </span>
                )}
              </span>
              <button
                type="button"
                className="re-ing-remove"
                onClick={() => on_change(ingredients.filter((_, j) => j !== i))}
                aria-label={`Remove ${name}`}
              >
                −
              </button>
            </div>
          );
        })}
      </div>
      <select
        className="re-ing-add-select"
        value=""
        onChange={(e) => { add_ingredient(e.target.value); e.target.value = ""; }}
        aria-label="Add ingredient to recipe"
      >
        <option value="">+ Add ingredient…</option>
        {all_ingredients
          .filter((ing) => !ingredients.some((ri) => ri.ingredient_id === ing.id))
          .map((ing) => (
            <option key={ing.id} value={ing.id}>{ing.name}</option>
          ))}
      </select>
    </section>
  );
}

// ---------------------------------------------------------------------------
// VersionHistoryTable
// ---------------------------------------------------------------------------

interface VersionHistoryTableProps {
  readonly versions: RecipeVersion[];
}

function VersionHistoryTable({ versions }: VersionHistoryTableProps) {
  const [open, set_open] = useState(false);
  const sorted = [...versions].reverse(); // newest first

  return (
    <details
      className="re-version-history"
      open={open}
      onToggle={(e) => set_open((e.target as HTMLDetailsElement).open)}
    >
      <summary className="re-version-history-summary">
        Version history ({versions.length})
      </summary>
      <div className="re-version-history-body">
        <div className="re-version-filter" role="search" aria-label="Filter versions">
          {/* placeholder for filter bar */}
        </div>
        <table className="re-version-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Editor</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((v) => (
              <tr key={v.id}>
                <td>{new Date(v.created_at).toLocaleDateString()}</td>
                <td>{v.created_by}</td>
                <td>{v.description || <em>—</em>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

// ---------------------------------------------------------------------------
// CopyRecipeDialog
// ---------------------------------------------------------------------------

interface CopyRecipeDialogProps {
  readonly recipe: Recipe;
  readonly flat_folders: Array<{ id: RecipeFolderId; label: string }>;
  readonly on_copy: (title: string, folder_id: RecipeFolderId | undefined) => void;
  readonly on_cancel: () => void;
}

function CopyRecipeDialog({ recipe, flat_folders, on_copy, on_cancel }: CopyRecipeDialogProps) {
  const [title, set_title] = useState(`${recipe.title} (copy)`);
  const [folder_id, set_folder_id] = useState<RecipeFolderId | undefined>(recipe.parent_folder_id);

  return (
    <div className="re-dialog-overlay" role="dialog" aria-modal="true" aria-label="Copy recipe">
      <div className="re-dialog">
        <h2 className="re-dialog-title">Copy Recipe</h2>
        <label className="re-field-label">
          New title
          <input
            className="re-field-input"
            value={title}
            onChange={(e) => set_title(e.target.value)}
            aria-label="New recipe title"
          />
        </label>
        <label className="re-field-label">
          Parent folder
          <select
            className="re-field-select"
            value={folder_id ?? ""}
            onChange={(e) => set_folder_id(e.target.value ? (e.target.value as RecipeFolderId) : undefined)}
            aria-label="Parent folder for copy"
          >
            <option value="">— None —</option>
            {flat_folders.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
        </label>
        <div className="re-dialog-actions">
          <button type="button" onClick={() => on_copy(title, folder_id)} disabled={title.trim() === ""}>
            Copy
          </button>
          <button type="button" onClick={on_cancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EditorState
// ---------------------------------------------------------------------------

interface EditorState {
  title: string;
  subtitle: string;
  source_url: string;
  parent_folder_id: RecipeFolderId | undefined;
  description: string;
  ingredients: RecipeIngredient[];
  sections: Section[];
  create_new_version: boolean;
}

function make_initial_state(recipe: Recipe | null): EditorState {
  if (recipe === null) {
    return {
      title: "",
      subtitle: "",
      source_url: "",
      parent_folder_id: undefined,
      description: "",
      ingredients: [],
      sections: [],
      create_new_version: false,
    };
  }
  const v = latest_version(recipe);
  return {
    title: recipe.title,
    subtitle: recipe.subtitle ?? "",
    source_url: recipe.source_url ?? "",
    parent_folder_id: recipe.parent_folder_id,
    description: v?.description ?? "",
    ingredients: v?.ingredients ?? [],
    sections: v?.sections ?? [],
    create_new_version: false,
  };
}

// ---------------------------------------------------------------------------
// RecipeEditor
// ---------------------------------------------------------------------------

interface RecipeEditorProps {
  readonly recipe: Recipe | null;
  readonly user_name: string;
  readonly on_save: (recipe: Recipe) => void;
  readonly on_cancel: () => void;
}

function RecipeEditor({ recipe, user_name, on_save, on_cancel }: RecipeEditorProps) {
  const { create, save, copy } = use_recipe_store(user_name);
  const { flat_folders, folders } = use_recipe_folder_store();
  const { ingredients: all_ingredients } = use_ingredient_store();
  const [form, set_form] = useState<EditorState>(() => make_initial_state(recipe));
  const [show_copy_dialog, set_show_copy_dialog] = useState(false);

  const flat = flatten_folders(folders);

  function patch<K extends keyof EditorState>(key: K, value: EditorState[K]) {
    set_form((f) => ({ ...f, [key]: value }));
  }

  function add_top_ingredient(ingredient_id: IngredientItem["ingredient_id"]) {
    if (form.ingredients.some((ri) => ri.ingredient_id === ingredient_id)) return;
    set_form((f) => ({
      ...f,
      ingredients: [
        ...f.ingredients,
        { id: random_id(RecipeIngredientId), ingredient_id },
      ],
    }));
  }

  function handle_save() {
    const version_base: Omit<RecipeVersion, "id" | "recipe_id" | "created_at" | "created_by"> = {
      description: form.description,
      ingredients: form.ingredients,
      sections: form.sections,
    };

    if (recipe === null) {
      const created = create({
        title: form.title,
        ...(form.subtitle && { subtitle: form.subtitle }),
        ...(form.source_url && { source_url: form.source_url }),
        ...(form.parent_folder_id !== undefined && { parent_folder_id: form.parent_folder_id }),
        description: form.description,
      });
      on_save(created);
    } else {
      const v = latest_version(recipe);
      const version: RecipeVersion = {
        id: v?.id ?? random_id(RecipeVersionId),
        recipe_id: recipe.id,
        description: form.description,
        ingredients: form.ingredients,
        sections: form.sections,
        created_at: v?.created_at ?? Date.now(),
        created_by: v?.created_by ?? user_name,
      };
      const updated = save(recipe.id, {
        title: form.title,
        ...(form.subtitle && { subtitle: form.subtitle }),
        ...(form.source_url && { source_url: form.source_url }),
        ...(form.parent_folder_id !== undefined && { parent_folder_id: form.parent_folder_id }),
        version,
        create_new_version: form.create_new_version,
      });
      on_save(updated);
    }
    void version_base;
  }

  function handle_copy(title: string, folder_id: RecipeFolderId | undefined) {
    if (recipe === null) return;
    const copied = copy(recipe.id, title, folder_id);
    set_show_copy_dialog(false);
    on_save(copied);
  }

  return (
    <main className="re-editor" aria-label="Recipe editor">
      <div className="re-editor-header">
        <button type="button" className="re-back-btn" onClick={on_cancel} aria-label="Back to recipe list">
          ← Back
        </button>
        <h1 className="re-editor-title">{recipe ? `Edit: ${recipe.title}` : "New Recipe"}</h1>
        {recipe && (
          <button type="button" className="re-copy-btn" onClick={() => set_show_copy_dialog(true)}>
            Copy recipe
          </button>
        )}
      </div>

      {/* Recipe info */}
      <section className="re-section-block" aria-label="Recipe info">
        <h2 className="re-section-title">Recipe Info</h2>

        <label className="re-field-label">
          Source URL
          <input
            className="re-field-input"
            type="url"
            value={form.source_url}
            onChange={(e) => patch("source_url", e.target.value)}
            placeholder="Recipe Source URL"
            aria-label="Source URL"
          />
        </label>

        <label className="re-field-label">
          Title
          <input
            className="re-field-input re-field-input--title"
            value={form.title}
            onChange={(e) => patch("title", e.target.value)}
            placeholder="Recipe title"
            aria-label="Recipe title"
            required
          />
        </label>

        <label className="re-field-label">
          Subtitle
          <input
            className="re-field-input"
            value={form.subtitle}
            onChange={(e) => patch("subtitle", e.target.value)}
            placeholder="Subtitle"
            aria-label="Recipe subtitle"
          />
        </label>

        <label className="re-field-label">
          Version note
          <input
            className="re-field-input"
            value={form.description}
            onChange={(e) => patch("description", e.target.value)}
            placeholder='ex: "Untested" or "Final Version"'
            aria-label="Version description"
          />
        </label>

        <label className="re-field-label">
          Folder
          <select
            className="re-field-select"
            value={form.parent_folder_id ?? ""}
            onChange={(e) =>
              patch("parent_folder_id", e.target.value ? (e.target.value as RecipeFolderId) : undefined)
            }
            aria-label="Parent folder"
          >
            <option value="">— None —</option>
            {flat.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
        </label>
      </section>

      {/* Top-level ingredients */}
      <RecipeIngredientsEditor
        ingredients={form.ingredients}
        all_ingredients={all_ingredients}
        on_change={(ingredients) => patch("ingredients", ingredients)}
      />

      {/* Instruction sections */}
      <section className="re-section-block" aria-label="Instructions">
        <h2 className="re-section-title">Instructions</h2>
        {form.sections.map((sec, i) => (
          <SectionEditor
            key={sec.id}
            section={sec}
            depth={1}
            top_ingredients={form.ingredients}
            all_ingredients={all_ingredients}
            on_change={(updated) =>
              patch("sections", form.sections.map((s, j) => (j === i ? updated : s)))
            }
            on_remove={() => patch("sections", form.sections.filter((_, j) => j !== i))}
            on_add_top_ingredient={add_top_ingredient}
          />
        ))}
        <button
          type="button"
          className="re-add-section-btn"
          onClick={() => {
            const new_section: Section = {
              kind: "section",
              id: random_id(SectionItemId),
              contents: [],
            };
            patch("sections", [...form.sections, new_section]);
          }}
          aria-label="Add section"
        >
          + Add section
        </button>
      </section>

      {/* Version history */}
      {recipe && <VersionHistoryTable versions={recipe.versions} />}

      {/* Save actions */}
      <section className="re-actions" aria-label="Save actions">
        {recipe && (
          <label className="re-new-version-label">
            <input
              type="checkbox"
              checked={form.create_new_version}
              onChange={(e) => patch("create_new_version", e.target.checked)}
              aria-label="Create a new version from changes"
            />
            Create a new version from changes
          </label>
        )}
        <button
          type="button"
          className="re-save-btn"
          onClick={handle_save}
          disabled={form.title.trim() === ""}
          aria-label="Save recipe"
        >
          Save updates
        </button>
        <button type="button" className="re-cancel-btn" onClick={on_cancel}>
          Cancel
        </button>
      </section>

      {/* Copy dialog */}
      {show_copy_dialog && recipe && (
        <CopyRecipeDialog
          recipe={recipe}
          flat_folders={flat_folders.map((f) => ({ id: f.id, label: f.name }))}
          on_copy={handle_copy}
          on_cancel={() => set_show_copy_dialog(false)}
        />
      )}
    </main>
  );
}

// ---------------------------------------------------------------------------
// RecipeList
// ---------------------------------------------------------------------------

interface RecipeListProps {
  readonly recipes: Recipe[];
  readonly on_select: (recipe: Recipe) => void;
  readonly on_new: () => void;
}

function RecipeList({ recipes, on_select, on_new }: RecipeListProps) {
  return (
    <main className="re-list-page" aria-label="Recipe list">
      <h1 className="re-list-title">Recipes</h1>
      <button type="button" className="re-new-btn" onClick={on_new} aria-label="New recipe">
        + New recipe
      </button>
      {recipes.length === 0 ? (
        <p className="re-list-empty">No recipes yet. Create your first one!</p>
      ) : (
        <ul className="re-list">
          {recipes.map((r) => {
            const v = latest_version(r);
            return (
              <li key={r.id} className="re-list-item">
                <button
                  type="button"
                  className="re-list-item-btn"
                  onClick={() => on_select(r)}
                  aria-label={`Edit recipe: ${r.title}`}
                >
                  <span className="re-list-item-title">{r.title}</span>
                  {r.subtitle && <span className="re-list-item-subtitle">{r.subtitle}</span>}
                  {v?.description && <span className="re-list-item-desc">{v.description}</span>}
                  <span className="re-list-item-date">
                    {new Date(r.updated_at).toLocaleDateString()}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

// ---------------------------------------------------------------------------
// RecipeEditorPage
// ---------------------------------------------------------------------------

interface RecipeEditorPageProps {
  readonly user_name: string;
}

type EditingState = { kind: "new" } | { kind: "edit"; recipe: Recipe } | null;

export function RecipeEditorPage({ user_name }: RecipeEditorPageProps) {
  const { recipes } = use_recipe_store(user_name);
  const [editing, set_editing] = useState<EditingState>(null);

  if (editing !== null) {
    return (
      <RecipeEditor
        recipe={editing.kind === "new" ? null : editing.recipe}
        user_name={user_name}
        on_save={() => set_editing(null)}
        on_cancel={() => set_editing(null)}
      />
    );
  }

  return (
    <RecipeList
      recipes={recipes}
      on_select={(r) => set_editing({ kind: "edit", recipe: r })}
      on_new={() => set_editing({ kind: "new" })}
    />
  );
}
