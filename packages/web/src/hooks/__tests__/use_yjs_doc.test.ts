import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import * as Y from "yjs";

const mock_destroy = vi.fn();
const MockIndexeddbPersistence = vi.fn().mockImplementation(() => ({
  destroy: mock_destroy,
}));

vi.mock("y-indexeddb", () => ({
  IndexeddbPersistence: MockIndexeddbPersistence,
}));

const { use_yjs_doc } = await import("../use_yjs_doc.js");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("use_yjs_doc", () => {
  it("returns a Y.Doc instance", () => {
    const { result } = renderHook(() => use_yjs_doc("Alice"));
    expect(result.current).toBeInstanceOf(Y.Doc);
  });

  it("creates IndexeddbPersistence keyed by user_name", () => {
    renderHook(() => use_yjs_doc("Alice"));
    expect(MockIndexeddbPersistence).toHaveBeenCalledWith("Alice", expect.any(Y.Doc));
  });

  it("destroys persistence on unmount", () => {
    const { unmount } = renderHook(() => use_yjs_doc("Alice"));
    unmount();
    expect(mock_destroy).toHaveBeenCalledOnce();
  });

  it("returns the same doc instance across re-renders", () => {
    const { result, rerender } = renderHook(() => use_yjs_doc("Alice"));
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
