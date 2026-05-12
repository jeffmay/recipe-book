import { type } from "arktype";
import { Companion } from "./companion.js";
import { IdCompanion } from "./ids.js";
import { EnumCompanion } from "./enums.js";

export const SortOrder = EnumCompanion("SortOrder", ["last_modified", "created", "alphabetical", "manual"]);
export type SortOrder = typeof SortOrder.type.infer;

export const RecipeFolderId = IdCompanion("RecipeFolderId", 12);
export type RecipeFolderId = typeof RecipeFolderId.type.infer;

// Use scope syntax to allow recursive definition
const folder_scope = type.scope({
  RecipeFolder: {
    id: () => RecipeFolderId.type,
    name: "string",
    "parent_folder_id?": () => RecipeFolderId.type,
    tags: "string[]",
    sort_order: () => SortOrder.type,
    "manual_order?": "string[]",
    "children?": "RecipeFolder[]",
  },
}).export();

export const RecipeFolder = Companion("RecipeFolder", folder_scope.RecipeFolder);
export type RecipeFolder = typeof folder_scope.RecipeFolder.infer;

// Backward-compatibility aliases so any existing code referencing the old names still compiles
export const RecipeGroupId = RecipeFolderId;
export type RecipeGroupId = RecipeFolderId;
/** @deprecated Use RecipeFolder instead */
export const RecipeGroup = RecipeFolder;
/** @deprecated Use RecipeFolder instead */
export type RecipeGroup = RecipeFolder;
