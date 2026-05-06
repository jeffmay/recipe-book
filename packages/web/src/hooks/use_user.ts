import { useState, useCallback } from "react";

export const USER_STORAGE_KEY = "recipe_book_current_user";

export interface UseUserResult {
  readonly user_name: string | null;
  readonly set_user_name: (name: string) => void;
  readonly clear_user: () => void;
}

export function use_user(): UseUserResult {
  const [user_name, set_state] = useState<string | null>(
    () => localStorage.getItem(USER_STORAGE_KEY),
  );

  const set_user_name = useCallback((name: string) => {
    localStorage.setItem(USER_STORAGE_KEY, name);
    set_state(name);
  }, []);

  const clear_user = useCallback(() => {
    localStorage.removeItem(USER_STORAGE_KEY);
    set_state(null);
  }, []);

  return { user_name, set_user_name, clear_user };
}
