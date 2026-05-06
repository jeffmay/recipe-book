import "./UserMenu.css";

interface UserMenuProps {
  readonly user_name: string;
  readonly on_profile: () => void;
}

export function UserMenu({ user_name, on_profile }: UserMenuProps) {
  return (
    <details className="user-menu">
      <summary className="user-menu-trigger" aria-label={`User menu for ${user_name}`}>
        {user_name} ▾
      </summary>
      <div className="user-menu-dropdown" role="menu">
        <button
          className="user-menu-item"
          role="menuitem"
          onClick={on_profile}
        >
          Profile settings
        </button>
      </div>
    </details>
  );
}
