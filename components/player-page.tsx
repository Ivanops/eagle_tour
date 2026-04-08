"use client";

import { Link } from "../lib/router";
import { FormEvent, useEffect, useState } from "react";
import { AppNav } from "./app-nav";
import { AuthPanel } from "./auth-panel";
import {
  formatGender,
  formatPlayerRole,
  formatTournamentStatus,
  PlayerGender,
  readMatches,
  readSession,
  readTournaments,
  SessionPlayer,
  TennisMatch,
  Tournament,
  updatePlayerProfile,
} from "../lib/tennis-store";

type NoticeTone = "success" | "error";

export function PlayerPage() {
  const [session, setSession] = useState<SessionPlayer | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [createdTournaments, setCreatedTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<TennisMatch[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [gender, setGender] = useState<PlayerGender>("femenino");
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<NoticeTone>("success");

  async function loadPlayerData(currentSession: SessionPlayer) {
    setPlayerName(currentSession.name);
    setGender(currentSession.gender);
    const [allTournaments, allMatches] = await Promise.all([readTournaments(), readMatches()]);
    const joinedTournaments = allTournaments.filter((tournament) =>
      tournament.playerEmails.includes(currentSession.email),
    );
    const joinedMatchIds = new Set(
      joinedTournaments.flatMap((tournament) => tournament.matchIds),
    );
    setTournaments(joinedTournaments);
    setCreatedTournaments(
      allTournaments.filter((tournament) => tournament.creatorEmail === currentSession.email),
    );
    setMatches(allMatches.filter((match) => joinedMatchIds.has(match.id)));
  }

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
    const currentSession = readSession();
      if (!isMounted) {
        return;
      }

    setSession(currentSession);

    if (currentSession) {
        await loadPlayerData(currentSession);
    }
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleAuthenticated(nextSession: SessionPlayer) {
    setSession(nextSession);
    await loadPlayerData(nextSession);
  }

  async function handleUpdateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session) {
      return;
    }

    const result = await updatePlayerProfile(session.email, { name: playerName, gender });
    setNoticeTone(result.ok ? "success" : "error");
    setNotice(result.message);

    if (result.ok) {
      setSession({
        ...session,
        name: result.player.name,
        gender,
        role: result.player.role,
      });
      setPlayerName(result.player.name);
    }
  }

  if (!session) {
    return (
      <main className="page-shell">
        <AuthPanel onAuthenticated={handleAuthenticated} />
      </main>
    );
  }

  return (
    <main className="page-shell">
      <AppNav session={session} onLogout={() => setSession(null)} />
      <section className="entity-hero">
        <div>
          <p className="eyebrow">Player</p>
          <h1>{session.name}</h1>
          <p>{session.email}</p>
        </div>
        <div className="entity-meta">
          <span>{session.verified ? "Email verified" : "Email pending"}</span>
          <span>{formatGender(session.gender)}</span>
          <span>{formatPlayerRole(session.role)}</span>
          <strong>{tournaments.length} tournaments</strong>
          <strong>{createdTournaments.length} created</strong>
        </div>
      </section>

      <section className="content-grid auth-grid player-profile-grid">
        <article className="panel">
          <div className="panel-header">
            <p className="section-kicker">Profile</p>
            <h2>Player details</h2>
          </div>
          <form className="auth-form" onSubmit={handleUpdateProfile}>
            <label>
              Display name
              <input
                onChange={(event) => setPlayerName(event.target.value)}
                placeholder="Ex: Lucia Navarro"
                type="text"
                value={playerName}
              />
            </label>
            <label>
              Gender
              <select
                onChange={(event) => setGender(event.target.value as PlayerGender)}
                value={gender}
              >
                <option value="femenino">Female</option>
                <option value="masculino">Male</option>
              </select>
            </label>
            <button className="primary-button submit-button" type="submit">
              Save profile
            </button>
          </form>
          {notice ? <p className={`notice notice-${noticeTone}`}>{notice}</p> : null}
        </article>

        <article className="panel">
          <div className="panel-header">
            <p className="section-kicker">Tournaments</p>
            <h2>Joined</h2>
          </div>
          <div className="stack-list">
            {tournaments.length ? tournaments.map((tournament) => (
              <Link className="info-card link-card" href={`/torneos/${tournament.id}`} key={tournament.id}>
                <h3>{tournament.name}</h3>
                <p>{tournament.date}</p>
              </Link>
            )) : <p className="notice">You have not joined any tournaments yet.</p>}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <p className="section-kicker">Tournaments</p>
            <h2>Created by me</h2>
          </div>
          <div className="stack-list">
            {createdTournaments.length ? createdTournaments.map((tournament) => (
              <Link className="info-card link-card" href={`/torneos/${tournament.id}`} key={tournament.id}>
                <h3>{tournament.name}</h3>
                <p>{tournament.date}</p>
                <span>{formatTournamentStatus(tournament.status)}</span>
              </Link>
            )) : <p className="notice">You have not created any tournaments yet.</p>}
          </div>
        </article>

        <article className="panel panel-accent">
          <div className="panel-header">
            <p className="section-kicker">Matches</p>
            <h2>My matches</h2>
          </div>
          <div className="stack-list">
            {matches.map((match) => (
              <Link className="info-card link-card" href={`/partidos/${match.id}`} key={match.id}>
                <h3>{match.round}</h3>
                <p>
                  {match.playerA} vs {match.playerB}
                </p>
              </Link>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
