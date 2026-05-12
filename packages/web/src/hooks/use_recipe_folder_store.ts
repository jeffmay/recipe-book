import { useEffect, useState } from "react";
import {
  type RecipeFolder,
  type RecipeFolderId,
  create_recipe_folder,
  delete_recipe_folder,
  get_recipe_folder_ymap,
  get_recipe_folders,
  get_recipe_folders_flat,
  update_recipe_folder,
} from "@recipe-book/shared";
import { use_doc } from "../contexts/doc_context.js";

export interface RecipeFolderStore {
  readonly folders: RecipeFolder[];
  readonly flat_folders: Array<Omit<RecipeFolder, "children">>;
  readonly create_folder: (name: string, parent_id?: RecipeFolderId) => RecipeFolder;
  readonly update_folder: (folder: RecipeFolder) => void;
  readonly delete_folder: (id: RecipeFolderId) => void;
}

export function use_recipe_folder_store(): RecipeFolderStore {
  const doc = use_doc();
  const [folders, set_folders] = useState<RecipeFolder[]>(() => get_recipe_folders(doc));
  const [flat_folders, set_flat_folders] = useState(() => get_recipe_folders_flat(doc));

  useEffect(() => {
    const map = get_recipe_folder_ymap(doc);
    function update() {
      set_folders(get_recipe_folders(doc));
      set_flat_folders(get_recipe_folders_flat(doc));
    }
    map.observe(update);
    return () => map.unobserve(update);
  }, [doc]);

  return {
    folders,
    flat_folders,
    create_folder: (name, parent_id) => create_recipe_folder(doc, name, parent_id),
    update_folder: (folder) => update_recipe_folder(doc, folder),
    delete_folder: (id) => delete_recipe_folder(doc, id),
  };
}
