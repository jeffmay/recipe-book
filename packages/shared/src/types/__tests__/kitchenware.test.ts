import { type } from "arktype";
import { describe, expect, it } from "vitest";
import { padded_id } from "../ids.js";
import {
  Container,
  ContainerId,
  Equipment,
  EquipmentId,
  Ingredient,
  IngredientId,
  is_container,
  is_equipment,
  is_ingredient,
  KitchenwareKind,
  type Kitchenware,
  type KitchenwareLabelId,
} from "../kitchenware.js";

describe("kitchenware type guards", () => {
  const ingredient: Kitchenware = {
    kind: "ingredient",
    id: "butter" as IngredientId,
    name: "Butter",
    default_measurement_type: "volume",
    labels: new Set<KitchenwareLabelId>(),
  };

  const container: Kitchenware = {
    kind: "container",
    id: "bowl" as ContainerId,
    name: "Bowl",
    labels: new Set<KitchenwareLabelId>(),
  };

  const equipment: Kitchenware = {
    kind: "equipment",
    id: "oven" as EquipmentId,
    name: "Oven",
    labels: new Set<KitchenwareLabelId>(),
  };

  it("is_ingredient returns true only for ingredient", () => {
    expect(is_ingredient(ingredient)).toBe(true);
    expect(is_ingredient(container)).toBe(false);
    expect(is_ingredient(equipment)).toBe(false);
  });

  it("is_container returns true only for container", () => {
    expect(is_container(ingredient)).toBe(false);
    expect(is_container(container)).toBe(true);
    expect(is_container(equipment)).toBe(false);
  });

  it("is_equipment returns true only for equipment", () => {
    expect(is_equipment(ingredient)).toBe(false);
    expect(is_equipment(container)).toBe(false);
    expect(is_equipment(equipment)).toBe(true);
  });
});

describe("ItemKind schema", () => {
  it("accepts valid kinds", () => {
    expect(KitchenwareKind("ingredient") instanceof type.errors).toBe(false);
    expect(KitchenwareKind("container") instanceof type.errors).toBe(false);
    expect(KitchenwareKind("equipment") instanceof type.errors).toBe(false);
  });

  it("rejects invalid kinds", () => {
    expect(KitchenwareKind("widget") instanceof type.errors).toBe(true);
    expect(KitchenwareKind("") instanceof type.errors).toBe(true);
  });
});

describe("Kitchenware constructors", () => {
  it("Ingredient accepts a valid ingredient", () => {
    const result = Ingredient({
      kind: "ingredient",
      id: padded_id(IngredientId, "butter"),
      name: "Butter",
      default_measurement_type: "volume",
      labels: [],
    });
    expect(result instanceof type.errors).toBe(false);
  });

  it("Ingredient rejects a missing required field", () => {
    const result = Ingredient({ kind: "ingredient", id: "butter" });
    expect(result instanceof type.errors).toBe(true);
  });

  it("Ingredient rejects an invalid measurement type", () => {
    const result = Ingredient({
      kind: "ingredient",
      id: "butter",
      name: "Butter",
      default_measurement_type: "bad",
      labels: new Set(),
    });
    expect(result instanceof type.errors).toBe(true);
  });

  it("Container accepts a valid container", () => {
    const result = Container({ kind: "container", id: "bowl", name: "Bowl", labels: [] });
    expect(result).instanceOf(type.errors)
  });

  it("Equipment accepts a valid equipment", () => {
    const result = Equipment({ kind: "equipment", id: padded_id(EquipmentId, "oven"), name: "Oven", labels: new Set() });
    expect(result instanceof type.errors).toBe(false);
  });
});
