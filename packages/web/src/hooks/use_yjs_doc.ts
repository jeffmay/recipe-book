import { useEffect, useRef } from "react";
import * as Y from "yjs";
import { IndexeddbPersistence } from "y-indexeddb";

export function use_yjs_doc(user_name: string): Y.Doc {
  const doc_ref = useRef<Y.Doc>(new Y.Doc());

  useEffect(() => {
    const persistence = new IndexeddbPersistence(user_name, doc_ref.current);
    return () => {
      persistence.destroy();
    };
  }, [user_name]);

  return doc_ref.current;
}
