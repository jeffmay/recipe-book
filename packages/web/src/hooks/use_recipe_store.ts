import { useEffect, useState } from "react";
import {
  type CreateRecipeInput,
  type Recipe,
  type RecipeId,
  type RecipeVersion,
  type SaveRecipeInput,
  copy_recipe,
  create_recipe,
  delete_recipe,
  get_recipe_ymap,
  get_recipes,
  save_recipe,
} from "@recipe-book/shared";
import type { RecipeFolderId } from "@recipe-book/shared";
import { use_doc } from "../contexts/doc_context.js";

export interface RecipeStore {
  readonly recipes: Recipe[];
  readonly create: (input: Omit<CreateRecipeInput, "created_by">) => Recipe;
  readonly save: (recipe_id: RecipeId, input: Omit<SaveRecipeInput, "created_by">) => Recipe;
  readonly copy: (recipe_id: RecipeId, new_title: string, new_folder_id?: RecipeFolderId) => Recipe;
  readonly remove: (recipe_id: RecipeId) => void;
}

export function use_recipe_store(user_name: string): RecipeStore {
  const doc = use_doc();
  const [recipes, set_recipes] = useState<Recipe[]>(() => get_recipes(doc));

  useEffect(() => {
    const map = get_recipe_ymap(doc);
    function update() {
      set_recipes(get_recipes(doc));
    }
    map.observe(update);
    return () => map.unobserve(update);
  }, [doc]);

  return {
    recipes,
    create: (input) => create_recipe(doc, { ...input, created_by: user_name }),
    save: (recipe_id, input) => save_recipe(doc, recipe_id, { ...input, created_by: user_name }),
    copy: (recipe_id, new_title, new_folder_id) =>
      copy_recipe(doc, recipe_id, new_title, new_folder_id, user_name),
    remove: (recipe_id) => delete_recipe(doc, recipe_id),
  };
}

/** Returns the most-recent version of a recipe, or undefined if none exist. */
export function latest_version(recipe: Recipe): RecipeVersion | undefined {
  return recipe.versions.at(-1);
}
