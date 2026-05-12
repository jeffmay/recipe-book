import { type } from "arktype";
import { AnyCompanion, Companion } from "./companion.js";
import { EnumCompanion } from "./enums.js";
import { IdCompanion } from "./ids.js";
import { ContainerId, EquipmentId, IngredientId } from "./kitchenware.js";
import { Measurement } from "./measurement.js";

export const RecipeId = IdCompanion("RecipeId", 12);
export type RecipeId = typeof RecipeId.type.infer;

export const SectionItemId = IdCompanion("SectionItemId", 12);
export type SectionItemId = typeof SectionItemId.type.infer;

// Use scope syntax to allow recursive definitions
const section = type.scope({
  "#BaseSectionItem": {
    id: () => SectionItemId.type,
    "notes?": "string[]",
  },
  IngredientItem: {
    "...": "BaseSectionItem",
    kind: "'ingredient'",
    ingredient_id: IngredientId.type,
    quantity: Measurement,
  },
  ContainerItem: {
    "...": "BaseSectionItem",
    kind: "'container'",
    container_id: ContainerId.type,
    contents: "IngredientItem[]",
  },
  TextBlock: {
    "...": "BaseSectionItem",
    kind: "'text_block'",
    text: "string",
  },
  Instruction: {
    "...": "BaseSectionItem",
    kind: "'instruction'",
    instruction: "string", // ex: chop, mix, blend, stir, bake, fry, etc...
    "equipment_id?": () => EquipmentId.type,
    "items?": () => SectionItemId.type.array(),
    "duration_seconds?": "number",
  },
  Section: {
    "...": "BaseSectionItem",
    kind: "'section'",
    "header?": "string",
    contents: "SectionItem[]",
  },
  SectionItem: "IngredientItem | ContainerItem | TextBlock | Instruction | Section",
}).export()

export const SectionItemKind = EnumCompanion("SectionItemKind", [
  "ingredient",
  "container",
  "text_block",
  "instruction",
  "section",
]) satisfies AnyCompanion<SectionItem["kind"]>;
export type SectionItemKind = typeof SectionItemKind.type.infer;

export const IngredientItem = Companion("IngredientItem", section.IngredientItem);
export type IngredientItem = typeof section.IngredientItem.infer;

export const ContainerItem = Companion("ContainerItem", section.ContainerItem);
export type ContainerItem = typeof section.ContainerItem.infer;

export const TextBlock = Companion("TextBlock", section.TextBlock);
export type TextBlock = typeof section.TextBlock.infer;

export const Instruction = Companion("Instruction", section.Instruction);
export type Instruction = typeof section.Instruction.infer;

export const Section = Companion("Section", section.Section);
export type Section = typeof section.Section.infer;

export const SectionItem = Companion("SectionItem", section.SectionItem) satisfies AnyCompanion<{ kind: SectionItemKind }>;
export type SectionItem = typeof section.SectionItem.infer;

export const RecipeVersionId = IdCompanion("RecipeVersionId", 12);
export type RecipeVersionId = typeof RecipeVersionId.type.infer;

export const RecipeVersion = Companion("RecipeVersion", type({
  id: RecipeVersionId.type,
  recipe_id: RecipeId.type,
  sections: Section.type.array(),
  created_at: "number",
}));
export type RecipeVersion = typeof RecipeVersion.type.infer;

export const Recipe = Companion("Recipe", type({
  id: RecipeId.type,
  name: "string",
  description: "string",
  "parent_group_id?": "string",
  versions: RecipeVersion.type.array(),
  created_at: "number",
  updated_at: "number",
}));
export type Recipe = typeof Recipe.type.infer;

export function is_ingredient_item(item: SectionItem): item is IngredientItem {
  return item.kind === "ingredient";
}

export function is_container_item(item: SectionItem): item is ContainerItem {
  return item.kind === "container";
}

export function is_text_block(item: SectionItem): item is TextBlock {
  return item.kind === "text_block";
}

export function is_instruction(item: SectionItem): item is Instruction {
  return item.kind === "instruction";
}

export function is_section(item: SectionItem): item is Section {
  return item.kind === "section";
}
