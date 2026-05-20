import { ReadonlyDeep } from "type-fest";
import type { Fraction, VolumeUnit, WeightUnit } from "../types/measurement.js";
import { divideFractions, fractionsEqual, makeFraction, multiplyFractions } from "./fraction.js";

// US customary volume: base unit is tsp (all conversions are exact integers)
const TSP_PER: ReadonlyDeep<Record<VolumeUnit, Fraction | null>> = {
  tsp: makeFraction(1, 1),
  tbsp: makeFraction(3, 1),
  fl_oz: makeFraction(6, 1),
  cup: makeFraction(48, 1),
  pint: makeFraction(96, 1),
  quart: makeFraction(192, 1),
  gallon: makeFraction(768, 1),
  ml: null,
  l: null,
};

// Metric volume: base unit is ml (exact)
const ML_PER: ReadonlyDeep<Record<VolumeUnit, Fraction | null>> = {
  ml: makeFraction(1, 1),
  l: makeFraction(1000, 1),
  tsp: null,
  tbsp: null,
  fl_oz: null,
  cup: null,
  pint: null,
  quart: null,
  gallon: null,
};

// US weight: base unit is oz (exact)
const OZ_PER: ReadonlyDeep<Record<WeightUnit, Fraction | null>> = {
  oz: makeFraction(1, 1),
  lb: makeFraction(16, 1),
  g: null,
  kg: null,
};

// Metric weight: base unit is g (exact)
const G_PER: ReadonlyDeep<Record<WeightUnit, Fraction | null>> = {
  g: makeFraction(1, 1),
  kg: makeFraction(1000, 1),
  oz: null,
  lb: null,
};

function sameSystemVolume(a: VolumeUnit, b: VolumeUnit): boolean {
  return (TSP_PER[a] !== null && TSP_PER[b] !== null) || (ML_PER[a] !== null && ML_PER[b] !== null);
}

export function convertVolume(
  value: ReadonlyDeep<Fraction>,
  from: VolumeUnit,
  to: VolumeUnit,
): Fraction {
  if (from === to) return value;
  const from_tsp = TSP_PER[from];
  const to_tsp = TSP_PER[to];
  if (from_tsp !== null && to_tsp !== null) {
    return divideFractions(multiplyFractions(value, from_tsp), to_tsp);
  }
  const from_ml = ML_PER[from];
  const to_ml = ML_PER[to];
  if (from_ml !== null && to_ml !== null) {
    return divideFractions(multiplyFractions(value, from_ml), to_ml);
  }
  throw new Error(`Cannot convert between ${from} and ${to}: different unit systems`);
}

export function convertWeight(
  value: ReadonlyDeep<Fraction>,
  from: WeightUnit,
  to: WeightUnit,
): Fraction {
  if (from === to) return value;
  const from_oz = OZ_PER[from];
  const to_oz = OZ_PER[to];
  if (from_oz !== null && to_oz !== null) {
    return divideFractions(multiplyFractions(value, from_oz), to_oz);
  }
  const from_g = G_PER[from];
  const to_g = G_PER[to];
  if (from_g !== null && to_g !== null) {
    return divideFractions(multiplyFractions(value, from_g), to_g);
  }
  throw new Error(`Cannot convert between ${from} and ${to}: different unit systems`);
}

export function largestWholeVolumeUnit(
  value: ReadonlyDeep<Fraction>,
  base: VolumeUnit,
): VolumeUnit {
  const us_order: VolumeUnit[] = ["gallon", "quart", "pint", "cup", "fl_oz", "tbsp", "tsp"];
  const metric_order: VolumeUnit[] = ["l", "ml"];
  const candidates = sameSystemVolume(base, "tsp") ? us_order : metric_order;
  for (const candidate of candidates) {
    if (!sameSystemVolume(base, candidate)) continue;
    const converted = convertVolume(value, base, candidate);
    if (
      fractionsEqual(converted, {
        numerator: Math.trunc(converted.numerator / converted.denominator),
        denominator: 1,
      })
    ) {
      return candidate;
    }
  }
  return base;
}

export function largestWholeWeightUnit(
  value: ReadonlyDeep<Fraction>,
  base: WeightUnit,
): WeightUnit {
  const us_order: WeightUnit[] = ["lb", "oz"];
  const metric_order: WeightUnit[] = ["kg", "g"];
  const candidates = OZ_PER[base] !== null ? us_order : metric_order;
  for (const candidate of candidates) {
    const converted = convertWeight(value, base, candidate);
    if (
      fractionsEqual(converted, {
        numerator: Math.trunc(converted.numerator / converted.denominator),
        denominator: 1,
      })
    ) {
      return candidate;
    }
  }
  return base;
}
