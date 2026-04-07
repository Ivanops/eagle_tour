"use client";

import { Link } from "../lib/router";
import { FormEvent, useEffect, useState } from "react";
import { AppNav } from "./app-nav";
import { AuthPanel } from "./auth-panel";
import {
  formatGender,
  formatMatchStatus,
  formatTournamentStatus,
  getTournamentCloseRestriction,
  joinTournament,
  readMatches,
  readSession,
  readTournamentPlayers,
  readTournaments,
  RegisteredPlayer,
  SessionPlayer,
  TennisMatch,
  Tournament,
  TournamentStatus,
  updateTournamentStatus,
} from "../lib/mock-tennis-store";

type TournamentDetailProps = {
  tournamentId: string;
};

type NoticeTone = "success" | "error";

export function TournamentDetail({ tournamentId }: TournamentDetailProps) {
  const [session, setSession] = useState<SessionPlayer | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<TennisMatch[]>([]);
  const [players, setPlayers] = useState<RegisteredPlayer[]>([]);
  const [password, setPassword] = useState("");
  const [joinNotice, setJoinNotice] = useState("");
  const [managementNotice, setManagementNotice] = useState("");
  const [joinNoticeTone, setJoinNoticeTone] = useState<NoticeTone>("success");
  const [managementNoticeTone, setManagementNoticeTone] = useState<NoticeTone>("success");

  useEffect(() => {
    setSession(readSession());
    const currentTournament = readTournaments().find((entry) => entry.id === tournamentId) ?? null;
    setTournament(currentTournament);
    if (currentTournament) {
      setPlayers(readTournamentPlayers(currentTournament));
    } else {
      setPlayers([]);
    }
    setMatches(
      currentTournament
        ? readMatches().filter((match) => currentTournament.matchIds.includes(match.id))
        : [],
    );
  }, [tournamentId]);

  function refreshTournament() {
    const currentTournament = readTournaments().find((entry) => entry.id === tournamentId) ?? null;
    setTournament(currentTournament);
    if (currentTournament) {
      setPlayers(readTournamentPlayers(currentTournament));
    } else {
      setPlayers([]);
    }
    setMatches(
      currentTournament
        ? readMatches().filter((match) => currentTournament.matchIds.includes(match.id))
        : [],
    );
  }

  function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session) {
      setJoinNoticeTone("error");
      setJoinNotice("Inicia sesion para anotarte.");
      setManagementNotice("");
      return;
    }

    const result = joinTournament(tournamentId, session, password);
    setJoinNoticeTone(result.ok ? "success" : "error");
    setJoinNotice(result.message);
    setManagementNotice("");

    if (result.ok) {
      setPassword("");
      refreshTournament();
    }
  }

  function handleUpdateStatus(nextStatus: TournamentStatus) {
    if (!session) {
      return;
    }

    const result = updateTournamentStatus(tournamentId, session, nextStatus);
    setManagementNoticeTone(result.ok ? "success" : "error");
    setManagementNotice(result.message);
    setJoinNotice("");

    if (result.ok) {
      refreshTournament();
    }
  }

  if (!session) {
    return (
      <main className="page-shell">
        <AuthPanel onAuthenticated={setSession} />
      </main>
    );
  }

  if (!tournament) {
    return (
      <main className="page-shell">
        <AppNav session={session} onLogout={() => setSession(null)} />
        <section className="panel">
          <p className="section-kicker">Torneo</p>
          <h1>No encontramos este torneo</h1>
          <Link className="secondary-button inline-action" href="/">
            Volver al home
          </Link>
        </section>
      </main>
    );
  }

  const isJoined = tournament.playerEmails.includes(session.email);
  const isCreator = tournament.creatorEmail === session.email;
  const acceptsPlayers = tournament.status === "abierto";
  const canSeeMatches = isJoined || isCreator;
  const closeRestriction =
    tournament.status === "abierto" ? getTournamentCloseRestriction(tournament) : "";
  const canClose = tournament.status === "abierto";
  const canReopen = tournament.status === "cerrado";
  const canFinish = tournament.status === "cerrado";

  return (
    <main className="page-shell">
      <AppNav session={session} onLogout={() => setSession(null)} />

      <section className="entity-hero">
        <div>
          <p className="eyebrow">Torneo</p>
          <h1>{tournament.name}</h1>
          <p>{tournament.location}</p>
        </div>
        <div className="entity-meta">
          <span>{tournament.date}</span>
          <span>{tournament.level}</span>
          <span>{formatGender(tournament.gender)}</span>
          <span>{formatTournamentStatus(tournament.status)}</span>
          <strong>{isJoined ? "Estas anotado" : acceptsPlayers ? "Requiere password" : "Inscripcion cerrada"}</strong>
        </div>
      </section>

      {isCreator ? (
        <section className="panel join-panel">
          <div className="panel-header">
            <p className="section-kicker">Gestion</p>
            <h2>Estado del torneo</h2>
            <p>Solo el creador puede editar estas opciones.</p>
            {closeRestriction ? <p className="field-help">{closeRestriction}</p> : null}
          </div>
          <div className="state-actions" aria-label="Gestion de estado del torneo">
            <button
              className="primary-button submit-button"
              disabled={!canClose}
              onClick={() => handleUpdateStatus("cerrado")}
              type="button"
            >
              Cerrar torneo
            </button>
            <button
              className="secondary-button submit-button"
              disabled={!canReopen}
              onClick={() => handleUpdateStatus("abierto")}
              type="button"
            >
              Reabrir torneo
            </button>
            <button
              className="primary-button submit-button"
              disabled={!canFinish}
              onClick={() => handleUpdateStatus("finalizado")}
              type="button"
            >
              Finalizar torneo
            </button>
          </div>
          {managementNotice ? (
            <p className={`notice notice-${managementNoticeTone}`} role="alert">
              {managementNotice}
            </p>
          ) : null}
        </section>
      ) : null}

      {!isJoined && acceptsPlayers ? (
        <section className="panel join-panel">
          <div className="panel-header">
            <p className="section-kicker">Inscripcion</p>
            <h2>Ingresa el password del torneo</h2>
            <p>
              Tu genero: {formatGender(session.gender)}. Torneo:{" "}
              {formatGender(tournament.gender)}.
            </p>
            <p>Password mock para probar: {tournament.password}</p>
          </div>
          <form className="auth-form" onSubmit={handleJoin}>
            <label>
              Password
              <input
                autoComplete="off"
                className="masked-input"
                name="tournament-access-code"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password del torneo"
                type="text"
                value={password}
              />
            </label>
            <button className="primary-button submit-button" type="submit">
              Anotarme
            </button>
          </form>
          {joinNotice ? (
            <p className={`notice notice-${joinNoticeTone}`} role="alert">
              {joinNotice}
            </p>
          ) : null}
        </section>
      ) : !isJoined && !acceptsPlayers ? (
        <section className="panel join-panel">
          <div className="panel-header">
            <p className="section-kicker">Inscripcion</p>
            <h2>Este torneo ya no acepta jugadores</h2>
            <p>Estado actual: {formatTournamentStatus(tournament.status)}.</p>
          </div>
          {joinNotice ? (
            <p className={`notice notice-${joinNoticeTone}`} role="alert">
              {joinNotice}
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="tournament-detail-grid">
        {canSeeMatches ? (
          <article className="panel">
            <div className="panel-header">
              <p className="section-kicker">Partidos</p>
              <h2>Lista de partidos del torneo</h2>
            </div>
            <div className="stack-list">
              {matches.map((match) => (
                <Link className="info-card link-card" href={`/partidos/${match.id}`} key={match.id}>
                  <h3>{match.round}</h3>
                  <p>
                    {match.playerA} vs {match.playerB}
                  </p>
                  <span>{match.startsAt}</span>
                  <span>{formatMatchStatus(match.status)}</span>
                </Link>
              ))}
            </div>
          </article>
        ) : null}

        <aside className="panel side-panel">
          <div className="panel-header">
            <p className="section-kicker">Jugadores</p>
            <h2>Inscritos</h2>
            <p>{players.length} jugadores anotados.</p>
          </div>
          <div className="stack-list">
            {players.length ? players.map((player) => (
              <div className="info-card" key={player.email}>
                <h3>{player.name}</h3>
                <p>{player.email}</p>
                <span>{formatGender(player.gender)}</span>
              </div>
            )) : <p className="notice">Todavia no hay jugadores inscritos.</p>}
          </div>
        </aside>
      </section>

    </main>
  );
}
