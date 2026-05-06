import { useState, type FormEvent } from "react";
import "./SelectUserPage.css";

interface SelectUserPageProps {
  readonly on_select: (name: string) => void;
}

export function SelectUserPage({ on_select }: SelectUserPageProps) {
  const [name, set_name] = useState("");

  function handle_submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed !== "") on_select(trimmed);
  }

  return (
    <main className="select-user-page">
      <h1 className="select-user-title">Recipe Book</h1>
      <p className="select-user-subtitle">Enter your name to get started.</p>
      <form className="select-user-form" onSubmit={handle_submit}>
        <label className="select-user-label" htmlFor="user-name-input">
          Your name
        </label>
        <input
          id="user-name-input"
          className="select-user-input"
          type="text"
          value={name}
          onChange={(e) => set_name(e.target.value)}
          placeholder="e.g. Alice"
          autoFocus
          autoComplete="name"
        />
        <button
          type="submit"
          className="select-user-submit"
          disabled={name.trim() === ""}
        >
          Get Started
        </button>
      </form>
    </main>
  );
}
