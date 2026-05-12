import { type } from "arktype";
import * as Y from "yjs";
import { is_type_error } from "../assertions/index.js";
import { load_id, random_id } from "../types/ids.js";
import { RecipeFolder, RecipeFolderId } from "../types/recipe_group.js";
import { SortOrder } from "../types/recipe_group.js";

const MAP_KEY = "recipe_folders";

export function get_recipe_folder_ymap(doc: Y.Doc): Y.Map<unknown> {
  return doc.getMap(MAP_KEY);
}

// Stored format omits the `children` field — the tree is rebuilt from parent_folder_id
const StoredRecipeFolder = type({
  name: "string",
  "parent_folder_id?": RecipeFolderId.type,
  tags: "string[]",
  sort_order: SortOrder.type,
  "manual_order?": "string[]",
});
type StoredRecipeFolder = typeof StoredRecipeFolder.infer;

function to_stored(folder: RecipeFolder): StoredRecipeFolder {
  return {
    name: folder.name,
    tags: folder.tags,
    sort_order: folder.sort_order,
    ...(folder.parent_folder_id !== undefined && { parent_folder_id: folder.parent_folder_id }),
    ...(folder.manual_order !== undefined && { manual_order: folder.manual_order }),
  };
}

function validate_stored(id: RecipeFolderId, raw: unknown): Omit<RecipeFolder, "children"> | null {
  const result = StoredRecipeFolder(raw);
  if (is_type_error(result)) return null;
  return {
    id,
    name: result.name,
    tags: result.tags,
    sort_order: result.sort_order,
    ...(result.parent_folder_id !== undefined && { parent_folder_id: result.parent_folder_id }),
    ...(result.manual_order !== undefined && { manual_order: result.manual_order }),
  };
}

/** Returns a flat list of all folders (without the children array). */
export function get_recipe_folders_flat(doc: Y.Doc): Array<Omit<RecipeFolder, "children">> {
  const map = get_recipe_folder_ymap(doc);
  const results: Array<Omit<RecipeFolder, "children">> = [];
  map.forEach((value, id) => {
    const folder = validate_stored(load_id(RecipeFolderId, id), value);
    if (folder !== null) results.push(folder);
  });
  return results.sort((a, b) => a.name.localeCompare(b.name));
}

/** Builds the folder hierarchy from a flat list. Returns root-level folders. */
export function build_folder_tree(flat: Array<Omit<RecipeFolder, "children">>): RecipeFolder[] {
  const by_id = new Map<string, RecipeFolder>();
  for (const f of flat) {
    by_id.set(f.id, { ...f, children: [] });
  }
  const roots: RecipeFolder[] = [];
  for (const folder of by_id.values()) {
    if (folder.parent_folder_id !== undefined) {
      const parent = by_id.get(folder.parent_folder_id);
      if (parent !== undefined) {
        (parent.children ??= []).push(folder);
        continue;
      }
    }
    roots.push(folder);
  }
  return roots;
}

/** Returns the full folder tree (root folders with nested children). */
export function get_recipe_folders(doc: Y.Doc): RecipeFolder[] {
  return build_folder_tree(get_recipe_folders_flat(doc));
}

export function create_recipe_folder(
  doc: Y.Doc,
  name: string,
  parent_folder_id?: RecipeFolderId,
): RecipeFolder {
  const id = random_id(RecipeFolderId);
  const folder: RecipeFolder = {
    id,
    name,
    tags: [],
    sort_order: "manual",
    ...(parent_folder_id !== undefined && { parent_folder_id }),
  };
  get_recipe_folder_ymap(doc).set(id, to_stored(folder));
  return folder;
}

export function update_recipe_folder(doc: Y.Doc, folder: RecipeFolder): void {
  const map = get_recipe_folder_ymap(doc);
  if (!map.has(folder.id)) return;
  map.set(folder.id, to_stored(folder));
}

export function delete_recipe_folder(doc: Y.Doc, id: RecipeFolderId): void {
  get_recipe_folder_ymap(doc).delete(id);
}
