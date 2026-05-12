import { describe, expect, it } from "vitest";
import { padded_id } from "../ids.js";
import { ContainerId, EquipmentId, IngredientId } from "../kitchenware.js";
import {
  type ContainerItem,
  type IngredientItem,
  type Instruction,
  is_container_item,
  is_ingredient_item,
  is_instruction,
  is_section,
  is_text_block,
  type SectionItem,
  SectionItemId,
  type Section,
  type TextBlock,
  RecipeIngredient,
  RecipeIngredientId,
} from "../recipe.js";

describe("recipe item type guards", () => {
  const ingredient_item: IngredientItem = {
    kind: "ingredient",
    id: padded_id(SectionItemId, "item-1"),
    ingredient_id: padded_id(IngredientId, "butter"),
    amount: { value: { numerator: 1, denominator: 2 }, unit: "cup" },
  };

  const container_item: ContainerItem = {
    kind: "container",
    id: padded_id(SectionItemId, "item-2"),
    container_id: padded_id(ContainerId, "bowl"),
    descriptor: "large",
    contents: [],
  };

  const section: Section = {
    kind: "section",
    id: padded_id(SectionItemId, "item-3"),
    header: "Wet ingredients",
    contents: [],
  };

  const text_block: TextBlock = {
    kind: "text_block",
    id: padded_id(SectionItemId, "item-4"),
    text: "Whisk until combined.",
  };

  const instruction: Instruction = {
    kind: "instruction",
    id: padded_id(SectionItemId, "item-5"),
    equipment_id: padded_id(EquipmentId, "oven"),
    instruction: "Bake at 350°F",
    duration_seconds: 1200,
  };

  const all_items: SectionItem[] = [
    ingredient_item,
    container_item,
    section,
    text_block,
    instruction,
  ];

  it("is_ingredient_item identifies only ingredient items", () => {
    expect(all_items.filter(is_ingredient_item)).toEqual([ingredient_item]);
  });

  it("is_container_item identifies only container items", () => {
    expect(all_items.filter(is_container_item)).toEqual([container_item]);
  });

  it("is_section_label identifies only section labels", () => {
    expect(all_items.filter(is_section)).toEqual([section]);
  });

  it("is_instruction_block identifies only instruction blocks", () => {
    expect(all_items.filter(is_text_block)).toEqual([text_block]);
  });

  it("is_equipment_instruction identifies only equipment instructions", () => {
    expect(all_items.filter(is_instruction)).toEqual([instruction]);
  });
});

describe("IngredientItem", () => {
  it("accepts an item without amount", () => {
    const item: IngredientItem = {
      kind: "ingredient",
      id: padded_id(SectionItemId, "item-1"),
      ingredient_id: padded_id(IngredientId, "butter"),
    };
    expect(item.amount).toBeUndefined();
  });

  it("accepts an item with notes", () => {
    const item: IngredientItem = {
      kind: "ingredient",
      id: padded_id(SectionItemId, "item-1"),
      ingredient_id: padded_id(IngredientId, "butter"),
      notes: ["add more to taste", "better at room temp"],
    };
    expect(item.notes).toHaveLength(2);
  });
});

describe("ContainerItem", () => {
  it("requires a descriptor", () => {
    const item: ContainerItem = {
      kind: "container",
      id: padded_id(SectionItemId, "item-2"),
      container_id: padded_id(ContainerId, "bowl"),
      descriptor: "wet ingredients",
      contents: [],
    };
    expect(item.descriptor).toBe("wet ingredients");
  });

  it("accepts an ordered container", () => {
    const item: ContainerItem = {
      kind: "container",
      id: padded_id(SectionItemId, "item-2"),
      container_id: padded_id(ContainerId, "bowl"),
      descriptor: "large",
      ordered: true,
      contents: [],
    };
    expect(item.ordered).toBe(true);
  });
});

describe("Instruction", () => {
  it("accepts ingredient_ids for referenced ingredients", () => {
    const instr: Instruction = {
      kind: "instruction",
      id: padded_id(SectionItemId, "item-5"),
      instruction: "Mix together",
      ingredient_ids: [padded_id(IngredientId, "butter"), padded_id(IngredientId, "flour")],
    };
    expect(instr.ingredient_ids).toHaveLength(2);
  });

  it("accepts a duration in seconds", () => {
    const instr: Instruction = {
      kind: "instruction",
      id: padded_id(SectionItemId, "item-5"),
      instruction: "Bake",
      duration_seconds: 1800,
    };
    expect(instr.duration_seconds).toBe(1800);
  });
});

describe("RecipeIngredient", () => {
  it("accepts an ingredient without amount", () => {
    const ri: RecipeIngredient = {
      id: padded_id(RecipeIngredientId, "ri-1"),
      ingredient_id: padded_id(IngredientId, "butter"),
    };
    expect(ri.amount).toBeUndefined();
  });

  it("accepts an ingredient with an amount", () => {
    const ri: RecipeIngredient = {
      id: padded_id(RecipeIngredientId, "ri-1"),
      ingredient_id: padded_id(IngredientId, "butter"),
      amount: { value: { numerator: 1, denominator: 2 }, unit: "cup" },
    };
    expect(ri.amount?.unit).toBe("cup");
  });

  it("validates via ArkType companion", () => {
    const ri = {
      id: padded_id(RecipeIngredientId, "ri-1"),
      ingredient_id: padded_id(IngredientId, "butter"),
    };
    const result = RecipeIngredient.type(ri);
    expect(result instanceof Error).toBe(false);
  });
});
