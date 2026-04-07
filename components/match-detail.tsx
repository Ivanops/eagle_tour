"use client";

import { Link } from "../lib/router";
import { useEffect, useState } from "react";
import { AppNav } from "./app-nav";
import { AuthPanel } from "./auth-panel";
import {
  addMatchSet,
  deleteMatchSet,
  formatMatchStatus,
  readMatches,
  readPlayers,
  readSession,
  readTournaments,
  RegisteredPlayer,
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
  const [matchPlayers, setMatchPlayers] = useState<RegisteredPlayer[]>([]);
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
      setTournament(currentTournament);
      setMatchPlayers(readPlayers().filter((player) => currentMatch.playerEmails.includes(player.email)));
    } else {
      setTournament(null);
      setMatchPlayers([]);
    }
  }

  useEffect(() => {
    setSession(readSession());
    refreshMatch();
  }, [matchId]);

  function handleAcceptResult() {
    if (!session) {
      return;
    }

    const result = updateMatchStatus(matchId, session, "finalizado");
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
  const isMatchPlayer = match.playerEmails.includes(session.email);
  const hasAcceptedResult = match.finalizationAcceptedBy.includes(session.email);
  const canAcceptResult =
    isMatchPlayer && !hasAcceptedResult && match.status !== "finalizado" && tournament.status !== "finalizado";
  const canEditSets = isCreator && match.status !== "finalizado" && tournament.status !== "finalizado";

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
            <p className="field-help">
              {match.finalizationAcceptedBy.length} de 4 jugadores aceptaron el resultado.
            </p>
          </div>
          <div className="info-card">
            <h3>Jugadores del partido</h3>
            <div className="match-player-list">
              {matchPlayers.map((player) => {
                const accepted = match.finalizationAcceptedBy.includes(player.email);

                return (
                  <div className="match-player-row" key={player.email}>
                    <span
                      aria-label={accepted ? "Acepto el resultado" : "Pendiente de aceptar"}
                      className={accepted ? "status-icon accepted" : "status-icon pending"}
                      role="img"
                    >
                      {accepted ? "OK" : "--"}
                    </span>
                    <div>
                      <strong>{player.name}</strong>
                      <p>{player.email}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {isMatchPlayer ? (
              <button
                className="primary-button submit-button inline-action"
                disabled={!canAcceptResult}
                onClick={handleAcceptResult}
                type="button"
              >
                {hasAcceptedResult ? "Resultado aceptado" : "Aceptar resultado y finalizar"}
              </button>
            ) : (
              <p className="field-help">Solo los jugadores de este partido pueden finalizarlo.</p>
            )}
          </div>
          {matchPlayers.length < 4 ? (
            <p className="notice notice-error">
              Este partido necesita 4 jugadores para poder finalizarse.
            </p>
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
