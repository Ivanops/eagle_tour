"use client";

import { Link } from "../lib/router";
import { FormEvent, useEffect, useState } from "react";
import { AppNav } from "./app-nav";
import { AuthPanel } from "./auth-panel";
import {
  canCreateTournaments,
  createTournament,
  deleteTournament,
  formatGender,
  formatTournamentStatus,
  MAX_TOURNAMENTS_PER_CREATOR,
  readMatches,
  readSession,
  readTournaments,
  SessionPlayer,
  TennisMatch,
  Tournament,
  TournamentGender,
} from "../lib/tennis-store";

type TournamentFilter = "general" | "created" | "joined";
type NoticeTone = "success" | "error";

function getTodayDateInputValue() {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset() * 60000;
  return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

export function TournamentsHome() {
  const todayDate = getTodayDateInputValue();
  const [session, setSession] = useState<SessionPlayer | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<TennisMatch[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<NoticeTone>("success");
  const [name, setName] = useState("");
  const [date, setDate] = useState(todayDate);
  const [location, setLocation] = useState("");
  const [level, setLevel] = useState("Intermediate");
  const [gender, setGender] = useState<TournamentGender>("mixto");
  const [password, setPassword] = useState("");
  const [filter, setFilter] = useState<TournamentFilter>("general");

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const [nextTournaments, nextMatches] = await Promise.all([
        readTournaments(),
        readMatches(),
      ]);

      if (!isMounted) {
        return;
      }

      setSession(readSession());
      setTournaments(nextTournaments);
      setMatches(nextMatches);
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  async function refreshData() {
    const [nextTournaments, nextMatches] = await Promise.all([
      readTournaments(),
      readMatches(),
    ]);
    setTournaments(nextTournaments);
    setMatches(nextMatches);
  }

  async function handleAuthenticated(nextSession: SessionPlayer) {
    setSession(readSession());
    setSession(nextSession);
    await refreshData();
  }

  async function handleCreateTournament(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session) {
      setNoticeTone("error");
      setNotice("Sign in to create tournaments.");
      return;
    }

    if (!name.trim() || !location.trim()) {
      setNoticeTone("error");
      setNotice("Complete the tournament name and location.");
      return;
    }

    if (date < todayDate) {
      setNoticeTone("error");
      setNotice("Choose a date from today onward.");
      return;
    }

    if (!/^\d{4}$/.test(password.trim())) {
      setNoticeTone("error");
      setNotice("Tournament password must be exactly 4 digits.");
      return;
    }

    const result = await createTournament({
      name,
      date,
      location,
      level,
      gender,
      password,
      creator: session,
    });

    if (!result.ok) {
      setNoticeTone("error");
      setNotice(result.message);
      await refreshData();
      return;
    }

    setName("");
    setDate(todayDate);
    setLocation("");
    setLevel("Intermediate");
    setGender("mixto");
    setPassword("");
    setShowCreate(false);
    setNoticeTone("success");
    setNotice(result.message);
    await refreshData();
  }

  if (!session) {
    return (
      <main className="page-shell">
        <AuthPanel onAuthenticated={handleAuthenticated} />
      </main>
    );
  }

  const filteredTournaments = tournaments
    .filter((tournament) => {
      if (filter === "created") {
        return tournament.creatorEmail === session.email;
      }

      if (filter === "joined") {
        return tournament.playerEmails.includes(session.email);
      }

      return true;
    })
    .slice(0, 12);
  const filterLabel = {
    general: "latest tournaments",
    created: "tournaments created by you",
    joined: "tournaments you joined",
  }[filter];
  const createdTournamentCount = tournaments.filter(
    (tournament) => tournament.creatorEmail === session.email,
  ).length;
  const hasCreationPermission = canCreateTournaments(session);
  const canCreateTournament =
    hasCreationPermission && createdTournamentCount < MAX_TOURNAMENTS_PER_CREATOR;

  async function handleDeleteTournament(tournamentId: string, tournamentName: string) {
    if (!session) {
      setNoticeTone("error");
      setNotice("Sign in to delete tournaments.");
      return;
    }

    if (!window.confirm(`Delete ${tournamentName}? This will also delete its matches.`)) {
      return;
    }

    const result = await deleteTournament(tournamentId, session);
    setNoticeTone(result.ok ? "success" : "error");
    setNotice(result.message);

    if (result.ok) {
      await refreshData();
    }
  }

  return (
    <main className="page-shell">
      <AppNav session={session} onLogout={() => setSession(null)} />

      <section className="mobile-hero">
        <p className="eyebrow">Player home</p>
        <h1>Available tournaments</h1>
        <p>
          Explore tournaments, review your entries, or create a new one to invite
          players.
        </p>
        <button
          className="primary-button submit-button"
          disabled={!canCreateTournament}
          onClick={() => setShowCreate((current) => !current)}
          type="button"
        >
          {showCreate ? "Hide form" : "Create tournament"}
        </button>
        {!canCreateTournament ? (
          <p className="field-help">
            {hasCreationPermission
              ? `You already created ${MAX_TOURNAMENTS_PER_CREATOR} tournaments. Delete one to create another.`
              : "You need permission from a super user to create tournaments."}
          </p>
        ) : null}
      </section>

      {showCreate && canCreateTournament ? (
        <section className="panel create-panel">
          <div className="panel-header">
            <p className="section-kicker">New tournament</p>
            <h2>Create tournament</h2>
          </div>
          <form className="auth-form tournament-form" onSubmit={handleCreateTournament}>
            <label>
              Name
              <input
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex: Club Open April"
                type="text"
                value={name}
              />
            </label>
            <label>
              Tournament date
              <input
                min={todayDate}
                onChange={(event) => setDate(event.target.value)}
                required
                type="date"
                value={date}
              />
              <span className="field-help">
                Defaults to today. Past dates are not allowed.
              </span>
            </label>
            <label>
              Location
              <input
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Ex: Club courts"
                type="text"
                value={location}
              />
            </label>
            <label>
              Level
              <input
                onChange={(event) => setLevel(event.target.value)}
                placeholder="Ex: Intermediate"
                type="text"
                value={level}
              />
            </label>
            <label>
              Tournament type
              <select
                onChange={(event) => setGender(event.target.value as TournamentGender)}
                value={gender}
              >
                <option value="mixto">Mixed</option>
                <option value="femenino">Female only</option>
                <option value="masculino">Male only</option>
              </select>
            </label>
            <label>
              Tournament password
              <input
                inputMode="numeric"
                maxLength={4}
                onChange={(event) => setPassword(event.target.value.replace(/\D/g, "").slice(0, 4))}
                pattern="[0-9]{4}"
                placeholder="1234"
                required
                type="text"
                value={password}
              />
              <span className="field-help">
                Players will use this 4-digit password to join the tournament.
              </span>
            </label>
            <button className="primary-button submit-button" type="submit">
              Save tournament
            </button>
          </form>
        </section>
      ) : null}

      {notice ? <p className={`notice notice-${noticeTone}`}>{notice}</p> : null}

      <section className="panel tournament-filter-panel">
        <div className="panel-header">
          <p className="section-kicker">Browse</p>
          <h2>{filteredTournaments.length} {filterLabel}</h2>
        </div>
        <div className="filter-bar" aria-label="Tournament filters">
          <button
            className={filter === "general" ? "filter-button active" : "filter-button"}
            onClick={() => setFilter("general")}
            type="button"
          >
            All
          </button>
          <button
            className={filter === "created" ? "filter-button active" : "filter-button"}
            onClick={() => setFilter("created")}
            type="button"
          >
            Created by me
          </button>
          <button
            className={filter === "joined" ? "filter-button active" : "filter-button"}
            onClick={() => setFilter("joined")}
            type="button"
          >
            Joined
          </button>
        </div>
      </section>

      <section className="tournament-list" aria-label="Tournament list">
        {filteredTournaments.map((tournament) => {
          const isJoined = tournament.playerEmails.includes(session.email);
          const isCreator = tournament.creatorEmail === session.email;
          const matchCount = matches.filter((match) => tournament.matchIds.includes(match.id)).length;

          return (
            <article className="tournament-card" key={tournament.id}>
              <Link className="tournament-card-link" href={`/torneos/${tournament.id}`}>
                <div>
                  <p className="section-kicker">{tournament.level}</p>
                  <h2>{tournament.name}</h2>
                  <p>{tournament.location}</p>
                </div>
                <div className="card-meta">
                  <span>{tournament.date || "Date to be confirmed"}</span>
                  <span>{formatGender(tournament.gender)}</span>
                  <span>{formatTournamentStatus(tournament.status)}</span>
                  <span>{matchCount} matches</span>
                  <strong>
                    {isJoined
                      ? "Joined"
                      : tournament.status === "abierto"
                        ? "Join with code"
                        : "Registration closed"}
                  </strong>
                </div>
              </Link>
              {isCreator ? (
                <button
                  className="danger-button inline-action"
                  onClick={() => handleDeleteTournament(tournament.id, tournament.name)}
                  type="button"
                >
                  Delete tournament
                </button>
              ) : null}
            </article>
          );
        })}
      </section>
      {!filteredTournaments.length ? (
        <p className="notice">There are no tournaments for this filter.</p>
      ) : null}
    </main>
  );
}
