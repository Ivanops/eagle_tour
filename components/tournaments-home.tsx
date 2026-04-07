"use client";

import { Link } from "../lib/router";
import { FormEvent, useEffect, useState } from "react";
import { AppNav } from "./app-nav";
import { AuthPanel } from "./auth-panel";
import {
  createTournament,
  formatGender,
  formatTournamentStatus,
  readMatches,
  readSession,
  readTournaments,
  SessionPlayer,
  TennisMatch,
  Tournament,
  TournamentGender,
} from "../lib/mock-tennis-store";

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
  const [level, setLevel] = useState("Intermedio");
  const [gender, setGender] = useState<TournamentGender>("mixto");
  const [password, setPassword] = useState("");
  const [filter, setFilter] = useState<TournamentFilter>("general");

  useEffect(() => {
    setSession(readSession());
    setTournaments(readTournaments());
    setMatches(readMatches());
  }, []);

  function refreshData() {
    setTournaments(readTournaments());
    setMatches(readMatches());
  }

  function handleAuthenticated(nextSession: SessionPlayer) {
    setSession(nextSession);
    refreshData();
  }

  function handleCreateTournament(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session) {
      setNoticeTone("error");
      setNotice("Inicia sesion para crear torneos.");
      return;
    }

    if (!name.trim() || !location.trim() || !password.trim()) {
      setNoticeTone("error");
      setNotice("Completa nombre, sede y password del torneo.");
      return;
    }

    if (date < todayDate) {
      setNoticeTone("error");
      setNotice("Elige una fecha de hoy en adelante.");
      return;
    }

    const tournament = createTournament({
      name,
      date,
      location,
      level,
      gender,
      password,
      creator: session,
    });

    setName("");
    setDate(todayDate);
    setLocation("");
    setLevel("Intermedio");
    setGender("mixto");
    setPassword("");
    setShowCreate(false);
    setNoticeTone("success");
    setNotice(`Torneo creado: ${tournament.name}. Aun no estas anotado.`);
    refreshData();
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
    general: "ultimos torneos",
    created: "torneos creados por ti",
    joined: "torneos donde estas anotado",
  }[filter];

  return (
    <main className="page-shell">
      <AppNav session={session} onLogout={() => setSession(null)} />

      <section className="mobile-hero">
        <p className="eyebrow">Home del jugador</p>
        <h1>Torneos disponibles</h1>
        <p>
          Explora torneos, entra con el password si aun no estas anotado o crea uno
          nuevo para invitar jugadores.
        </p>
        <button
          className="primary-button submit-button"
          onClick={() => setShowCreate((current) => !current)}
          type="button"
        >
          {showCreate ? "Ocultar formulario" : "Crear torneo"}
        </button>
      </section>

      {showCreate ? (
        <section className="panel create-panel">
          <div className="panel-header">
            <p className="section-kicker">Nuevo torneo</p>
            <h2>Crear torneo mock</h2>
          </div>
          <form className="auth-form tournament-form" onSubmit={handleCreateTournament}>
            <label>
              Nombre
              <input
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej: Club Open Abril"
                type="text"
                value={name}
              />
            </label>
            <label>
              Fecha del torneo
              <input
                min={todayDate}
                onChange={(event) => setDate(event.target.value)}
                required
                type="date"
                value={date}
              />
              <span className="field-help">
                Por defecto usa hoy. No se pueden elegir fechas pasadas.
              </span>
            </label>
            <label>
              Sede
              <input
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Ej: Canchas del club"
                type="text"
                value={location}
              />
            </label>
            <label>
              Nivel
              <input
                onChange={(event) => setLevel(event.target.value)}
                placeholder="Ej: Intermedio"
                type="text"
                value={level}
              />
            </label>
            <label>
              Tipo de torneo
              <select
                onChange={(event) => setGender(event.target.value as TournamentGender)}
                value={gender}
              >
                <option value="mixto">Mixto</option>
                <option value="femenino">Solo femenino</option>
                <option value="masculino">Solo masculino</option>
              </select>
            </label>
            <label>
              Password del torneo
              <input
                autoComplete="off"
                className="masked-input"
                name="tournament-access-code"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password para anotarse"
                type="text"
                value={password}
              />
            </label>
            <button className="primary-button submit-button" type="submit">
              Guardar torneo
            </button>
          </form>
        </section>
      ) : null}

      {notice ? <p className={`notice notice-${noticeTone}`}>{notice}</p> : null}

      <section className="panel tournament-filter-panel">
        <div className="panel-header">
          <p className="section-kicker">Explorar</p>
          <h2>{filteredTournaments.length} {filterLabel}</h2>
        </div>
        <div className="filter-bar" aria-label="Filtros de torneos">
          <button
            className={filter === "general" ? "filter-button active" : "filter-button"}
            onClick={() => setFilter("general")}
            type="button"
          >
            Todos
          </button>
          <button
            className={filter === "created" ? "filter-button active" : "filter-button"}
            onClick={() => setFilter("created")}
            type="button"
          >
            Creados por mi
          </button>
          <button
            className={filter === "joined" ? "filter-button active" : "filter-button"}
            onClick={() => setFilter("joined")}
            type="button"
          >
            Estoy anotado
          </button>
        </div>
      </section>

      <section className="tournament-list" aria-label="Lista de torneos">
        {filteredTournaments.map((tournament) => {
          const isJoined = tournament.playerEmails.includes(session.email);
          const matchCount = matches.filter((match) => tournament.matchIds.includes(match.id)).length;

          return (
            <Link className="tournament-card" href={`/torneos/${tournament.id}`} key={tournament.id}>
              <div>
                <p className="section-kicker">{tournament.level}</p>
                <h2>{tournament.name}</h2>
                <p>{tournament.location}</p>
              </div>
              <div className="card-meta">
                <span>{tournament.date || "Fecha por confirmar"}</span>
                <span>{formatGender(tournament.gender)}</span>
                <span>{formatTournamentStatus(tournament.status)}</span>
                <span>{matchCount} partidos</span>
                <strong>
                  {isJoined
                    ? "Anotado"
                    : tournament.status === "abierto"
                      ? "Pide password"
                      : "Inscripcion cerrada"}
                </strong>
              </div>
            </Link>
          );
        })}
      </section>
      {!filteredTournaments.length ? (
        <p className="notice">No hay torneos para este filtro.</p>
      ) : null}
    </main>
  );
}
