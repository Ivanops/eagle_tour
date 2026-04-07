"use client";

import { Link } from "../lib/router";
import { FormEvent, useEffect, useState } from "react";
import { AppNav } from "./app-nav";
import { AuthPanel } from "./auth-panel";
import {
  addMatchSet,
  deleteMatchSet,
  formatMatchStatus,
  MatchStatus,
  readMatches,
  readSession,
  readTournaments,
  SessionPlayer,
  TennisMatch,
  Tournament,
  updateMatchSetGames,
  updateMatchStatus,
} from "../lib/mock-tennis-store";

type MatchDetailProps = {
  matchId: string;
};

type NoticeTone = "success" | "error";

export function MatchDetail({ matchId }: MatchDetailProps) {
  const [session, setSession] = useState<SessionPlayer | null>(null);
  const [match, setMatch] = useState<TennisMatch | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [status, setStatus] = useState<MatchStatus>("por_jugar");
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<NoticeTone>("success");

  function refreshMatch() {
    const tournaments = readTournaments();
    const currentTournament = tournaments.find((entry) => entry.matchIds.includes(matchId)) ?? null;
    const currentMatch = currentTournament
      ? readMatches().find((entry) => entry.id === matchId) ?? null
      : null;
    setMatch(currentMatch);

    if (currentMatch && currentTournament) {
      setStatus(currentMatch.status);
      setTournament(currentTournament);
    } else {
      setTournament(null);
    }
  }

  useEffect(() => {
    setSession(readSession());
    refreshMatch();
  }, [matchId]);

  function handleUpdateStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session) {
      return;
    }

    const result = updateMatchStatus(matchId, session, status);
    setNoticeTone(result.ok ? "success" : "error");
    setNotice(result.message);

    if (result.ok) {
      refreshMatch();
    }
  }

  function handleUpdateSetGames(setId: string, pair: "pairA" | "pairB", games: number) {
    if (!session) {
      return;
    }

    const result = updateMatchSetGames(matchId, session, setId, pair, games);
    setNoticeTone(result.ok ? "success" : "error");
    setNotice(result.message);

    if (result.ok) {
      refreshMatch();
    }
  }

  function handleAddSet() {
    if (!session) {
      return;
    }

    const result = addMatchSet(matchId, session);
    setNoticeTone(result.ok ? "success" : "error");
    setNotice(result.message);

    if (result.ok) {
      refreshMatch();
    }
  }

  function handleDeleteSet(setId: string) {
    if (!session) {
      return;
    }

    const result = deleteMatchSet(matchId, session, setId);
    setNoticeTone(result.ok ? "success" : "error");
    setNotice(result.message);

    if (result.ok) {
      refreshMatch();
    }
  }

  if (!session) {
    return (
      <main className="page-shell">
        <AuthPanel onAuthenticated={setSession} />
      </main>
    );
  }

  if (!match || !tournament) {
    return (
      <main className="page-shell">
        <AppNav session={session} onLogout={() => setSession(null)} />
        <section className="panel">
          <p className="section-kicker">Partido</p>
          <h1>No encontramos este partido</h1>
          <Link className="secondary-button inline-action" href="/">
            Volver al home
          </Link>
        </section>
      </main>
    );
  }

  const isCreator = tournament.creatorEmail === session.email;
  const canEditStatus = isCreator && tournament.status !== "finalizado";
  const canEditSets = canEditStatus;

  return (
    <main className="page-shell">
      <AppNav session={session} onLogout={() => setSession(null)} />
      <section className="entity-hero">
        <div>
          <p className="eyebrow">Partido</p>
          <h1>
            {match.playerA} vs {match.playerB}
          </h1>
          <p>{tournament.name}</p>
        </div>
        <div className="entity-meta">
          <span>{match.round}</span>
          <span>{match.court}</span>
          <strong>{match.startsAt}</strong>
          <span>{formatMatchStatus(match.status)}</span>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <p className="section-kicker">Detalle</p>
          <h2>Estado del partido</h2>
        </div>
        <div className="stack-list">
          <div className="info-card">
            <h3>Score</h3>
            <p>{match.score}</p>
          </div>
          <div className="info-card">
            <h3>Sets</h3>
            <div className="set-list">
              {match.sets.map((set, index) => (
                <div className="set-row" key={set.id}>
                  <strong>Set {index + 1}</strong>
                  <label>
                    {match.playerA}
                    <input
                      disabled={!canEditSets}
                      max={99}
                      min={0}
                      onChange={(event) =>
                        handleUpdateSetGames(set.id, "pairA", event.target.valueAsNumber)
                      }
                      type="number"
                      value={set.pairAGames}
                    />
                  </label>
                  <label>
                    {match.playerB}
                    <input
                      disabled={!canEditSets}
                      max={99}
                      min={0}
                      onChange={(event) =>
                        handleUpdateSetGames(set.id, "pairB", event.target.valueAsNumber)
                      }
                      type="number"
                      value={set.pairBGames}
                    />
                  </label>
                  {canEditSets ? (
                    <button
                      className="secondary-button inline-action"
                      disabled={match.sets.length <= 1}
                      onClick={() => handleDeleteSet(set.id)}
                      type="button"
                    >
                      Borrar
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
            {canEditSets ? (
              <button
                className="secondary-button inline-action"
                disabled={match.sets.length >= 5}
                onClick={handleAddSet}
                type="button"
              >
                Agregar set
              </button>
            ) : null}
            <p className="field-help">Minimo 1 set, maximo 5. Games de 0 a 99.</p>
          </div>
          <div className="info-card">
            <h3>Estado</h3>
            <p>{formatMatchStatus(match.status)}</p>
          </div>
          {canEditStatus ? (
            <form className="auth-form" onSubmit={handleUpdateStatus}>
              <label>
                Estado del partido
                <select
                  onChange={(event) => setStatus(event.target.value as MatchStatus)}
                  value={status}
                >
                  <option value="por_jugar">Por jugar</option>
                  <option value="finalizado">Finalizado</option>
                </select>
              </label>
              <button className="primary-button submit-button" type="submit">
                Guardar estado
              </button>
            </form>
          ) : null}
          {notice ? <p className={`notice notice-${noticeTone}`}>{notice}</p> : null}
          <Link className="secondary-button inline-action" href={`/torneos/${tournament.id}`}>
            Volver al torneo
          </Link>
        </div>
      </section>
    </main>
  );
}
