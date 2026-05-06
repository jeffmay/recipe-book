export const SortOrder = ["last_modified", "created", "alphabetical", "manual"] as const;
export type SortOrder = typeof SortOrder[number];

export interface RecipeGroup {
  readonly id: string;
  readonly name: string;
  readonly parent_group_id?: string;
  readonly tags: readonly string[];
  readonly sort_order: SortOrder;
  readonly manual_order?: readonly string[];
}
