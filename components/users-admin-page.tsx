"use client";

import { useEffect, useState } from "react";
import { Link } from "../lib/router";
import { AppNav } from "./app-nav";
import { AuthPanel } from "./auth-panel";
import {
  formatGender,
  formatPlayerRole,
  readPlayers,
  readSession,
  RegisteredPlayer,
  SessionPlayer,
  updateTournamentCreationPermission,
} from "../lib/tennis-store";

type NoticeTone = "success" | "error";

export function UsersAdminPage() {
  const [session, setSession] = useState<SessionPlayer | null>(null);
  const [players, setPlayers] = useState<RegisteredPlayer[]>([]);
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<NoticeTone>("success");

  async function refreshData() {
    const currentSession = readSession();
    setSession(currentSession);
    setPlayers(await readPlayers());
  }

  useEffect(() => {
    refreshData();
  }, []);

  async function handleAuthenticated(nextSession: SessionPlayer) {
    setSession(nextSession);
    setPlayers(await readPlayers());
  }

  async function handleToggleTournamentCreation(targetEmail: string, canCreate: boolean) {
    if (!session) {
      return;
    }

    const result = await updateTournamentCreationPermission(targetEmail, session, canCreate);
    setNoticeTone(result.ok ? "success" : "error");
    setNotice(result.message);

    if (result.ok) {
      refreshData();
    }
  }

  if (!session) {
    return (
      <main className="page-shell">
        <AuthPanel onAuthenticated={handleAuthenticated} />
      </main>
    );
  }

  if (session.role !== "super") {
    return (
      <main className="page-shell">
        <AppNav session={session} onLogout={() => setSession(null)} />
        <section className="panel">
          <p className="section-kicker">Admin</p>
          <h1>Only the super user can access this page</h1>
          <p>This page controls who can create tournaments.</p>
          <Link className="secondary-button inline-action" href="/">
            Back to tournaments
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <AppNav session={session} onLogout={() => setSession(null)} />

      <section className="entity-hero">
        <div>
          <p className="eyebrow">Super user</p>
          <h1>Users and permissions</h1>
          <p>Choose which players can create tournaments.</p>
        </div>
        <div className="entity-meta">
          <span>{players.length} users</span>
          <strong>{formatPlayerRole(session.role)}</strong>
        </div>
      </section>

      {notice ? <p className={`notice notice-${noticeTone}`}>{notice}</p> : null}

      <section className="panel">
        <div className="panel-header">
          <p className="section-kicker">Players</p>
          <h2>Creation permissions</h2>
        </div>
        <div className="stack-list admin-user-list">
          {players.map((player) => {
            const canCreate = player.role === "organizer" || player.role === "super";
            const isSuper = player.role === "super";

            return (
              <div className="info-card admin-user-card" key={player.email}>
                <div className="admin-user-main">
                  <h3>{player.name}</h3>
                  <p>{player.email}</p>
                  <div className="admin-user-meta">
                    <span>{formatGender(player.gender)}</span>
                    <span>{formatPlayerRole(player.role)}</span>
                  </div>
                </div>
                <div className="admin-user-action">
                  {!isSuper ? (
                    <button
                      className={canCreate ? "danger-button inline-action" : "secondary-button inline-action"}
                      onClick={() => handleToggleTournamentCreation(player.email, !canCreate)}
                      type="button"
                    >
                      {canCreate ? "Remove organizer" : "Make organizer"}
                    </button>
                  ) : (
                    <p className="field-help">The super user can always create tournaments.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
