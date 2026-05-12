import { type, type Type } from "arktype";
import { constantCase, snakeCase, type ConstantCase, type SnakeCase } from "string-ts";
import { type Companion } from "./companion";

/**
 * The expected shape of a companion object for generating and validating enums.
 * 
 * Satisfying this type signature allows you to use the functions in this module.
 */
export interface EnumCompanion<N extends string, V extends readonly string[]> extends Companion<N, V[number]> {
  readonly type: Type<V[number]>;
  readonly types: StringTypeEnum<V[number]>
  readonly values: V;
  readonly enum: StringEnum<V[number]>
}

/**
 * Constructs an EnumCompanion object with the given parameters. The type function is generated based on the provided name and values.
 *
 * @param name the name of the enumeration type.
 * @param values an array of the allowed values for the enumeration.
 * @param extend extend the default companion object with additional properties or methods.
 * @returns an EnumCompanion object with the specified name and values, and a type function that generates an Arktype enumerated type for the values.
 */
export function EnumCompanion<const V extends readonly string[], N extends string, R extends EnumCompanion<N, V> = EnumCompanion<N, V>>(name: N, values: V, extend?: (o: EnumCompanion<N, V>) => R): R {
  const enumeration: Record<string, string> = {};
  for (const v of values) {
    enumeration[constantCase(v).toUpperCase()] = v;
  }
  const types: Record<string, Type> = {}
  for (const v of values) {
    types[snakeCase(v).toUpperCase()] = type(`'${v}'`);
  }
  const base: EnumCompanion<N, V> = {
    name,
    type: type.enumerated(...values),
    types: types as StringTypeEnum<V[number]>,
    enum: enumeration as StringEnum<V[number]>,
    values,
  };
  return extend ? extend(base) : base as R;
}

/**
 * A object with uppercase-snakified string keys assigned to their original string value.
 */
export type StringEnum<A extends string> = Readonly<{
  [V in A as ConstantCase<V>]: V
}>

/**
 * A object with uppercase-snakified string keys assigned to an ArkType of their original literal string value.
 */
export type StringTypeEnum<A extends string> = Readonly<{
  [V in A as SnakeCase<V>]: Type<`'${V}'`>
}>
