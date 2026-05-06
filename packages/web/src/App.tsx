import { useState } from "react";
import { use_user } from "./hooks/use_user.js";
import { use_yjs_doc } from "./hooks/use_yjs_doc.js";
import { UserMenu } from "./components/UserMenu.js";
import { SelectUserPage } from "./pages/SelectUserPage.js";
import { ProfileSettingsPage } from "./pages/ProfileSettingsPage.js";

type Route = "home" | "profile_settings";

interface AppContentProps {
  readonly user_name: string;
  readonly on_rename: (name: string) => void;
  readonly on_clear: () => void;
}

function AppContent({ user_name, on_rename, on_clear: _on_clear }: AppContentProps) {
  const [route, set_route] = useState<Route>("home");
  use_yjs_doc(user_name);

  function handle_save_profile(name: string) {
    on_rename(name);
    set_route("home");
  }

  return (
    <div className="app">
      <header className="top-nav">
        <button className="nav-menu-btn" aria-label="Menu">☰</button>
        <span className="app-title">Recipe Book</span>
        <div className="nav-right">
          <button className="undo-btn" aria-label="Undo">↩ Undo</button>
          <UserMenu
            user_name={user_name}
            on_profile={() => set_route("profile_settings")}
          />
        </div>
      </header>

      {route === "profile_settings" ? (
        <ProfileSettingsPage
          current_name={user_name}
          on_save={handle_save_profile}
          on_cancel={() => set_route("home")}
        />
      ) : (
        <main className="page-content">
          <p className="placeholder">Your recipes will appear here.</p>
        </main>
      )}
    </div>
  );
}

export function App() {
  const { user_name, set_user_name, clear_user } = use_user();

  if (user_name === null) {
    return <SelectUserPage on_select={set_user_name} />;
  }

  return (
    <AppContent
      key={user_name}
      user_name={user_name}
      on_rename={set_user_name}
      on_clear={clear_user}
    />
  );
}
