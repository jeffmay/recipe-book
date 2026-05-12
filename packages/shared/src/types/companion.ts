import { Type } from "arktype";

/**
 * The shape of a companion object of a type.
 * 
 * This companion object holds the reified name and compiler type information for a type. It is useful to pass around for generic functions
 * that need to be able to perform type-specific logic, such as parsing, validation, and generation.
 */
export interface Companion<N extends string, T, $ = object> {
  readonly name: N
  readonly type: Type<T, $>
}

/**
 * Constructs a simple companion object with the given name and type.
 * 
 * The extend function can be used to add additional properties or methods to the companion object.
 * 
 * @param name the name of the type, used for debugging purposes
 * @param type the Arktype type that represents the type information for this companion
 * @param extend a function that takes the base companion object and returns an extended version of it with additional properties or methods
 * @returns a companion object with the specified name and type, and any additional properties or methods provided by the extend function
 */
export function Companion<N extends string, const T, const $ = object, R extends Companion<N, T, $> = Companion<N, T, $>>(name: N, type: Type<T, $>, extend?: (o: Companion<N, T, $>) => R): R {
  const base: Companion<N, T, $> = { name, type };
  return extend ? extend(base) : base as R;
}

/**
 * Useful for checking if a companion object matches an expected type output without concern for the name or scope.
 */
export type AnyCompanion<T> = Companion<any, T, any> // eslint-disable-line @typescript-eslint/no-explicit-any