import type { MeasurementType } from "./measurement.js";

export interface Ingredient {
  readonly kind: "ingredient";
  readonly id: string;
  readonly name: string;
  readonly default_measurement_type: MeasurementType;
  readonly labels: readonly string[];
  readonly parent_id?: string;
}

export interface Container {
  readonly kind: "container";
  readonly id: string;
  readonly name: string;
  readonly labels: readonly string[];
}

export interface Equipment {
  readonly kind: "equipment";
  readonly id: string;
  readonly name: string;
  readonly labels: readonly string[];
}

export type Kitchenware = Ingredient | Container | Equipment;

export type KitchenwareType = Kitchenware["kind"];

export function is_ingredient(k: Kitchenware): k is Ingredient {
  return k.kind === "ingredient";
}

export function is_container(k: Kitchenware): k is Container {
  return k.kind === "container";
}

export function is_equipment(k: Kitchenware): k is Equipment {
  return k.kind === "equipment";
}
