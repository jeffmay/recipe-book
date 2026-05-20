import { describe, it, expect } from "vitest";
import {
  convertVolume,
  convertWeight,
  largestWholeVolumeUnit,
  largestWholeWeightUnit,
} from "../units.js";
import { makeFraction, fractionsEqual, fractionToDecimal } from "../fraction.js";

describe("convertVolume", () => {
  it("returns same value when units match", () => {
    const f = makeFraction(1, 2);
    expect(convertVolume(f, "cup", "cup")).toBe(f);
  });

  it("converts 3 tsp to 1 tbsp", () => {
    const result = convertVolume(makeFraction(3, 1), "tsp", "tbsp");
    expect(Math.abs(fractionToDecimal(result) - 1)).toBeLessThan(0.001);
  });

  it("converts 16 tbsp to 1 cup", () => {
    const result = convertVolume(makeFraction(16, 1), "tbsp", "cup");
    expect(Math.abs(fractionToDecimal(result) - 1)).toBeLessThan(0.001);
  });

  it("converts 1000 ml to 1 l", () => {
    const result = convertVolume(makeFraction(1000, 1), "ml", "l");
    expect(fractionsEqual(result, makeFraction(1, 1))).toBe(true);
  });
});

describe("convertWeight", () => {
  it("returns same value when units match", () => {
    const f = makeFraction(1, 2);
    expect(convertWeight(f, "g", "g")).toBe(f);
  });

  it("converts 1000 g to 1 kg", () => {
    const result = convertWeight(makeFraction(1000, 1), "g", "kg");
    expect(fractionsEqual(result, makeFraction(1, 1))).toBe(true);
  });
});

describe("largestWholeVolumeUnit", () => {
  it("picks cup when 16 tbsp", () => {
    expect(largestWholeVolumeUnit(makeFraction(16, 1), "tbsp")).toBe("cup");
  });

  it("stays at ml when no larger unit divides evenly", () => {
    expect(largestWholeVolumeUnit(makeFraction(1, 1), "ml")).toBe("ml");
  });
});

describe("largestWholeWeightUnit", () => {
  it("picks kg for 1000 g", () => {
    expect(largestWholeWeightUnit(makeFraction(1000, 1), "g")).toBe("kg");
  });
});
