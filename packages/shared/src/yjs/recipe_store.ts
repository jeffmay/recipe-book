import { type } from "arktype";
import * as Y from "yjs";
import { is_type_error } from "../assertions/index.js";
import { load_id, random_id } from "../types/ids.js";
import { ContainerId, EquipmentId, IngredientId } from "../types/kitchenware.js";
import { Measurement } from "../types/measurement.js";
import {
  type ContainerItem,
  type IngredientItem,
  type Instruction,
  type Recipe,
  type RecipeIngredient,
  type RecipeVersion,
  type Section,
  type SectionItem,
  type TextBlock,
  RecipeId,
  RecipeIngredientId,
  RecipeVersionId,
  SectionItemId,
} from "../types/recipe.js";
import { RecipeFolderId } from "../types/recipe_group.js";

const MAP_KEY = "recipes";

export function get_recipe_ymap(doc: Y.Doc): Y.Map<unknown> {
  return doc.getMap(MAP_KEY);
}

// ---------------------------------------------------------------------------
// Stored shape validation (uses `unknown` for nested arrays to avoid deep
// ArkType schemas; individual sub-objects are validated structurally).
// ---------------------------------------------------------------------------

const StoredRecipe = type({
  title: "string",
  "subtitle?": "string",
  "source_url?": "string",
  "parent_folder_id?": RecipeFolderId.type,
  versions: "unknown[]",
  created_at: "number",
  updated_at: "number",
});

function validate_ingredient_item(raw: unknown): IngredientItem | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (r["kind"] !== "ingredient") return null;
  if (typeof r["id"] !== "string" || typeof r["ingredient_id"] !== "string") return null;
  return {
    kind: "ingredient",
    id: load_id(SectionItemId, r["id"]),
    ingredient_id: load_id(IngredientId, r["ingredient_id"]),
    ...(r["amount"] !== undefined && { amount: r["amount"] as Measurement }),
    ...(Array.isArray(r["notes"]) && { notes: r["notes"] as string[] }),
  };
}

function validate_container_item(raw: unknown): ContainerItem | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (r["kind"] !== "container") return null;
  if (typeof r["id"] !== "string" || typeof r["container_id"] !== "string") return null;
  const contents: IngredientItem[] = [];
  if (Array.isArray(r["contents"])) {
    for (const c of r["contents"]) {
      const item = validate_ingredient_item(c);
      if (item !== null) contents.push(item);
    }
  }
  return {
    kind: "container",
    id: load_id(SectionItemId, r["id"]),
    container_id: load_id(ContainerId, r["container_id"] as string),
    descriptor: typeof r["descriptor"] === "string" ? r["descriptor"] : "",
    ...(typeof r["ordered"] === "boolean" && { ordered: r["ordered"] }),
    contents,
    ...(Array.isArray(r["notes"]) && { notes: r["notes"] as string[] }),
  };
}

function validate_text_block(raw: unknown): TextBlock | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (r["kind"] !== "text_block") return null;
  if (typeof r["id"] !== "string" || typeof r["text"] !== "string") return null;
  return {
    kind: "text_block",
    id: load_id(SectionItemId, r["id"]),
    text: r["text"],
    ...(Array.isArray(r["notes"]) && { notes: r["notes"] as string[] }),
  };
}

function validate_instruction(raw: unknown): Instruction | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (r["kind"] !== "instruction") return null;
  if (typeof r["id"] !== "string" || typeof r["instruction"] !== "string") return null;
  return {
    kind: "instruction",
    id: load_id(SectionItemId, r["id"]),
    instruction: r["instruction"],
    ...(typeof r["equipment_id"] === "string" && {
      equipment_id: load_id(EquipmentId, r["equipment_id"] as string),
    }),
    ...(Array.isArray(r["ingredient_ids"]) && {
      ingredient_ids: (r["ingredient_ids"] as string[]).map((id) => load_id(IngredientId, id)),
    }),
    ...(typeof r["duration_seconds"] === "number" && { duration_seconds: r["duration_seconds"] }),
    ...(Array.isArray(r["notes"]) && { notes: r["notes"] as string[] }),
  };
}

function validate_section(raw: unknown): Section | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (r["kind"] !== "section") return null;
  if (typeof r["id"] !== "string") return null;
  const contents: SectionItem[] = [];
  if (Array.isArray(r["contents"])) {
    for (const c of r["contents"]) {
      const item = validate_section_item(c);
      if (item !== null) contents.push(item);
    }
  }
  return {
    kind: "section",
    id: load_id(SectionItemId, r["id"]),
    ...(typeof r["header"] === "string" && { header: r["header"] }),
    contents,
    ...(Array.isArray(r["notes"]) && { notes: r["notes"] as string[] }),
  };
}

function validate_section_item(raw: unknown): SectionItem | null {
  if (typeof raw !== "object" || raw === null) return null;
  const kind = (raw as Record<string, unknown>)["kind"];
  if (kind === "ingredient") return validate_ingredient_item(raw);
  if (kind === "container") return validate_container_item(raw);
  if (kind === "text_block") return validate_text_block(raw);
  if (kind === "instruction") return validate_instruction(raw);
  if (kind === "section") return validate_section(raw);
  return null;
}

function validate_recipe_ingredient(raw: unknown): RecipeIngredient | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r["id"] !== "string" || typeof r["ingredient_id"] !== "string") return null;
  return {
    id: load_id(RecipeIngredientId, r["id"]),
    ingredient_id: load_id(IngredientId, r["ingredient_id"]),
    ...(r["amount"] !== undefined && { amount: r["amount"] as Measurement }),
  };
}

function validate_recipe_version(raw: unknown): RecipeVersion | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (
    typeof r["id"] !== "string" ||
    typeof r["recipe_id"] !== "string" ||
    typeof r["description"] !== "string" ||
    typeof r["created_at"] !== "number" ||
    typeof r["created_by"] !== "string"
  ) return null;

  const ingredients: RecipeIngredient[] = [];
  if (Array.isArray(r["ingredients"])) {
    for (const i of r["ingredients"]) {
      const ri = validate_recipe_ingredient(i);
      if (ri !== null) ingredients.push(ri);
    }
  }
  const sections: Section[] = [];
  if (Array.isArray(r["sections"])) {
    for (const s of r["sections"]) {
      const section = validate_section(s);
      if (section !== null) sections.push(section);
    }
  }
  return {
    id: load_id(RecipeVersionId, r["id"]),
    recipe_id: load_id(RecipeId, r["recipe_id"]),
    description: r["description"],
    ingredients,
    sections,
    created_at: r["created_at"],
    created_by: r["created_by"],
  };
}

function validate_stored(id: RecipeId, raw: unknown): Recipe | null {
  const result = StoredRecipe(raw);
  if (is_type_error(result)) return null;

  const versions: RecipeVersion[] = [];
  for (const v of result.versions) {
    const version = validate_recipe_version(v);
    if (version !== null) versions.push(version);
  }
  return {
    id,
    title: result.title,
    versions,
    created_at: result.created_at,
    updated_at: result.updated_at,
    ...(result.subtitle !== undefined && { subtitle: result.subtitle }),
    ...(result.source_url !== undefined && { source_url: result.source_url }),
    ...(result.parent_folder_id !== undefined && { parent_folder_id: result.parent_folder_id }),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function get_recipes(doc: Y.Doc): Recipe[] {
  const map = get_recipe_ymap(doc);
  const results: Recipe[] = [];
  map.forEach((value, id) => {
    const recipe = validate_stored(load_id(RecipeId, id), value);
    if (recipe !== null) results.push(recipe);
  });
  return results.sort((a, b) => b.updated_at - a.updated_at);
}

export function get_recipe(doc: Y.Doc, id: RecipeId): Recipe | null {
  return validate_stored(id, get_recipe_ymap(doc).get(id));
}

export interface CreateRecipeInput {
  title: string;
  subtitle?: string;
  source_url?: string;
  parent_folder_id?: RecipeFolderId;
  description?: string;
  created_by: string;
}

export function create_recipe(doc: Y.Doc, input: CreateRecipeInput): Recipe {
  const now = Date.now();
  const recipe_id = random_id(RecipeId);
  const initial_version: RecipeVersion = {
    id: random_id(RecipeVersionId),
    recipe_id,
    description: input.description ?? "",
    ingredients: [],
    sections: [],
    created_at: now,
    created_by: input.created_by,
  };
  const recipe: Recipe = {
    id: recipe_id,
    title: input.title,
    versions: [initial_version],
    created_at: now,
    updated_at: now,
    ...(input.subtitle !== undefined && { subtitle: input.subtitle }),
    ...(input.source_url !== undefined && { source_url: input.source_url }),
    ...(input.parent_folder_id !== undefined && { parent_folder_id: input.parent_folder_id }),
  };
  get_recipe_ymap(doc).set(recipe_id, recipe);
  return recipe;
}

export interface SaveRecipeInput {
  title: string;
  subtitle?: string;
  source_url?: string;
  parent_folder_id?: RecipeFolderId;
  /** The current active version to save. */
  version: RecipeVersion;
  /** When true, adds the version as a new entry instead of replacing the latest. */
  create_new_version: boolean;
  created_by: string;
}

export function save_recipe(doc: Y.Doc, recipe_id: RecipeId, input: SaveRecipeInput): Recipe {
  const existing = get_recipe(doc, recipe_id);
  if (existing === null) throw new Error(`Recipe ${recipe_id} not found`);

  const now = Date.now();
  let versions: RecipeVersion[];
  if (input.create_new_version) {
    const new_version: RecipeVersion = {
      ...input.version,
      id: random_id(RecipeVersionId),
      recipe_id,
      created_at: now,
      created_by: input.created_by,
    };
    versions = [...existing.versions, new_version];
  } else {
    // Replace the last version in place
    const updated_version: RecipeVersion = {
      ...input.version,
      recipe_id,
      created_at: input.version.created_at,
      created_by: input.version.created_by,
    };
    versions = existing.versions.length === 0
      ? [updated_version]
      : [...existing.versions.slice(0, -1), updated_version];
  }

  const updated: Recipe = {
    id: existing.id,
    title: input.title,
    versions,
    created_at: existing.created_at,
    updated_at: now,
    ...(input.subtitle !== undefined && { subtitle: input.subtitle }),
    ...(input.source_url !== undefined && { source_url: input.source_url }),
    ...(input.parent_folder_id !== undefined && { parent_folder_id: input.parent_folder_id }),
  };
  get_recipe_ymap(doc).set(recipe_id, updated);
  return updated;
}

export function copy_recipe(
  doc: Y.Doc,
  recipe_id: RecipeId,
  new_title: string,
  new_folder_id: RecipeFolderId | undefined,
  created_by: string,
): Recipe {
  const original = get_recipe(doc, recipe_id);
  if (original === null) throw new Error(`Recipe ${recipe_id} not found`);
  const now = Date.now();
  const new_recipe_id = random_id(RecipeId);
  const copied_versions: RecipeVersion[] = original.versions.map((v) => ({
    ...v,
    id: random_id(RecipeVersionId),
    recipe_id: new_recipe_id,
    created_at: now,
    created_by,
  }));
  const copy: Recipe = {
    id: new_recipe_id,
    title: new_title,
    versions: copied_versions,
    created_at: now,
    updated_at: now,
    ...(original.subtitle !== undefined && { subtitle: original.subtitle }),
    ...(original.source_url !== undefined && { source_url: original.source_url }),
    ...(new_folder_id !== undefined && { parent_folder_id: new_folder_id }),
  };
  get_recipe_ymap(doc).set(new_recipe_id, copy);
  return copy;
}

export function delete_recipe(doc: Y.Doc, id: RecipeId): void {
  get_recipe_ymap(doc).delete(id);
}
