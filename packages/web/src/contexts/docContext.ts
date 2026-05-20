import { createContext, useContext } from "react";
import * as Y from "yjs";

export const DocContext = createContext<Y.Doc | null>(null);

export function useDoc(): Y.Doc {
  const doc = useContext(DocContext);
  if (doc === null) throw new Error("useDoc must be called inside a DocContext.Provider");
  return doc;
}
