import { type } from "arktype";
import { ObjectType } from "arktype/internal/variants/object.ts";

/**
 * Creates a Set from an Array.
 *
 * You can convert this to readonly with .as<ReadonlySet<t>>()
 *
 * @todo is the $ type necessary?
 *
 * @example
 * const setOfStrings = setOf("string");
 * const s = setOfStrings.parse(["a", "b", "a"]);
 * console.log(s); // Set { "a", "b" }
 */
export function setOf<t>(of: type.Any<t>): ObjectType<Set<t>> {
  return of
    .array()
    .pipe((x: t[]) => new Set(x))
    .as<Set<t>>();
}

// export function readonly<t, $ = any>(set: Type<Set<t>, $>): ObjectType<ReadonlySet<t>, $> {
//   return set.as<ReadonlySet<t>>();
// }
