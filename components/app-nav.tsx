"use client";

import { Link } from "../lib/router";
import { SessionPlayer, saveSession } from "../lib/tennis-store";

type AppNavProps = {
  session: SessionPlayer;
  onLogout?: () => void;
};

export function AppNav({ session, onLogout }: AppNavProps) {
  function handleLogout() {
    saveSession(null);
    onLogout?.();
  }

  return (
    <header className="app-nav">
      <Link className="brand-link" href="/">
        TennisApp
      </Link>
      <nav>
        <Link href="/">Torneos</Link>
        <Link href="/jugador">Jugador</Link>
        {session.role === "super" ? <Link href="/admin/usuarios">Usuarios</Link> : null}
      </nav>
      <div className="nav-player">
        <span>{session.name}</span>
        <button className="ghost-button" onClick={handleLogout} type="button">
          Salir
        </button>
      </div>
    </header>
  );
}
