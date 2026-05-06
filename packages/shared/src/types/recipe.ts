import type { Measurement } from "./measurement.js";

export interface IngredientItem {
  readonly kind: "ingredient_item";
  readonly id: string;
  readonly ingredient_id: string;
  readonly quantity: Measurement;
  readonly notes?: string;
}

export interface ContainerItem {
  readonly kind: "container_item";
  readonly id: string;
  readonly container_id: string;
  readonly contents: readonly IngredientItem[];
  readonly notes?: string;
}

export interface SectionLabel {
  readonly kind: "section_label";
  readonly id: string;
  readonly label: string;
}

export interface InstructionBlock {
  readonly kind: "instruction_block";
  readonly id: string;
  readonly text: string;
  readonly notes?: string;
}

export interface EquipmentInstruction {
  readonly kind: "equipment_instruction";
  readonly id: string;
  readonly equipment_id: string;
  readonly instruction: string;
  readonly duration_seconds?: number;
  readonly notes?: string;
}

export type RecipeItem =
  | IngredientItem
  | ContainerItem
  | SectionLabel
  | InstructionBlock
  | EquipmentInstruction;

export type RecipeItemKind = RecipeItem["kind"];

export interface RecipeVersion {
  readonly id: string;
  readonly recipe_id: string;
  readonly items: readonly RecipeItem[];
  readonly created_at: number;
}

export interface Recipe {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly parent_group_id?: string;
  readonly versions: readonly RecipeVersion[];
  readonly created_at: number;
  readonly updated_at: number;
}

export function is_ingredient_item(item: RecipeItem): item is IngredientItem {
  return item.kind === "ingredient_item";
}

export function is_container_item(item: RecipeItem): item is ContainerItem {
  return item.kind === "container_item";
}

export function is_section_label(item: RecipeItem): item is SectionLabel {
  return item.kind === "section_label";
}

export function is_instruction_block(item: RecipeItem): item is InstructionBlock {
  return item.kind === "instruction_block";
}

export function is_equipment_instruction(item: RecipeItem): item is EquipmentInstruction {
  return item.kind === "equipment_instruction";
}
