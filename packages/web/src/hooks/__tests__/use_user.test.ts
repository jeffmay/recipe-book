import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { use_user, USER_STORAGE_KEY } from "../use_user.js";

beforeEach(() => {
  localStorage.clear();
});

describe("use_user", () => {
  it("returns null when no user is stored", () => {
    const { result } = renderHook(() => use_user());
    expect(result.current.user_name).toBeNull();
  });

  it("reads an existing user from localStorage on mount", () => {
    localStorage.setItem(USER_STORAGE_KEY, "Alice");
    const { result } = renderHook(() => use_user());
    expect(result.current.user_name).toBe("Alice");
  });

  it("set_user_name updates state and localStorage", () => {
    const { result } = renderHook(() => use_user());
    act(() => result.current.set_user_name("Bob"));
    expect(result.current.user_name).toBe("Bob");
    expect(localStorage.getItem(USER_STORAGE_KEY)).toBe("Bob");
  });

  it("clear_user resets state and removes from localStorage", () => {
    localStorage.setItem(USER_STORAGE_KEY, "Alice");
    const { result } = renderHook(() => use_user());
    act(() => result.current.clear_user());
    expect(result.current.user_name).toBeNull();
    expect(localStorage.getItem(USER_STORAGE_KEY)).toBeNull();
  });
});
