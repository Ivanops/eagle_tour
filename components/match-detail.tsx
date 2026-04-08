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
} from "../lib/tennis-store";

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

  async function refreshMatch() {
    const [tournaments, matches, players] = await Promise.all([
      readTournaments(),
      readMatches(),
      readPlayers(),
    ]);
    const currentTournament = tournaments.find((entry) => entry.matchIds.includes(matchId)) ?? null;
    const currentMatch = currentTournament
      ? matches.find((entry) => entry.id === matchId) ?? null
      : null;
    setMatch(currentMatch);

    if (currentMatch && currentTournament) {
      setTournament(currentTournament);
      setMatchPlayers(players.filter((player) => currentMatch.playerEmails.includes(player.email)));
    } else {
      setTournament(null);
      setMatchPlayers([]);
    }
  }

  useEffect(() => {
    setSession(readSession());
    void refreshMatch();
  }, [matchId]);

  async function handleAcceptResult() {
    if (!session) {
      return;
    }

    const result = await updateMatchStatus(matchId, session, "finalizado");
    setNoticeTone(result.ok ? "success" : "error");
    setNotice(result.message);

    if (result.ok) {
      await refreshMatch();
    }
  }

  async function handleUpdateSetGames(setId: string, pair: "pairA" | "pairB", games: number) {
    if (!session) {
      return;
    }

    const result = await updateMatchSetGames(matchId, session, setId, pair, games);
    setNoticeTone(result.ok ? "success" : "error");
    setNotice(result.message);

    if (result.ok) {
      await refreshMatch();
    }
  }

  function handleAdjustSetGames(
    setId: string,
    pair: "pairA" | "pairB",
    currentGames: number,
    direction: -1 | 1,
  ) {
    const nextGames = Math.min(99, Math.max(0, currentGames + direction));

    if (nextGames === currentGames) {
      return;
    }

    void handleUpdateSetGames(setId, pair, nextGames);
  }

  async function handleAddSet() {
    if (!session) {
      return;
    }

    const result = await addMatchSet(matchId, session);
    setNoticeTone(result.ok ? "success" : "error");
    setNotice(result.message);

    if (result.ok) {
      await refreshMatch();
    }
  }

  async function handleDeleteSet(setId: string) {
    if (!session) {
      return;
    }

    const result = await deleteMatchSet(matchId, session, setId);
    setNoticeTone(result.ok ? "success" : "error");
    setNotice(result.message);

    if (result.ok) {
      await refreshMatch();
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

  const isMatchPlayer = match.playerEmails.includes(session.email);
  const hasAcceptedResult = match.finalizationAcceptedBy.includes(session.email);
  const canAcceptResult =
    isMatchPlayer && !hasAcceptedResult && match.status !== "finalizado" && tournament.status !== "finalizado";
  const canEditSets = isMatchPlayer && match.status !== "finalizado" && tournament.status !== "finalizado";

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
                  <div className="set-score-control" aria-label={`${match.playerA}, set ${index + 1}`}>
                    <span>{match.playerA}</span>
                    <div className="score-stepper">
                      <button
                        aria-label={`Restar game a ${match.playerA} en el set ${index + 1}`}
                        disabled={!canEditSets || set.pairAGames <= 0}
                        onClick={() => handleAdjustSetGames(set.id, "pairA", set.pairAGames, -1)}
                        type="button"
                      >
                        -
                      </button>
                      <strong>{set.pairAGames}</strong>
                      <button
                        aria-label={`Sumar game a ${match.playerA} en el set ${index + 1}`}
                        disabled={!canEditSets || set.pairAGames >= 99}
                        onClick={() => handleAdjustSetGames(set.id, "pairA", set.pairAGames, 1)}
                        type="button"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="set-score-control" aria-label={`${match.playerB}, set ${index + 1}`}>
                    <span>{match.playerB}</span>
                    <div className="score-stepper">
                      <button
                        aria-label={`Restar game a ${match.playerB} en el set ${index + 1}`}
                        disabled={!canEditSets || set.pairBGames <= 0}
                        onClick={() => handleAdjustSetGames(set.id, "pairB", set.pairBGames, -1)}
                        type="button"
                      >
                        -
                      </button>
                      <strong>{set.pairBGames}</strong>
                      <button
                        aria-label={`Sumar game a ${match.playerB} en el set ${index + 1}`}
                        disabled={!canEditSets || set.pairBGames >= 99}
                        onClick={() => handleAdjustSetGames(set.id, "pairB", set.pairBGames, 1)}
                        type="button"
                      >
                        +
                      </button>
                    </div>
                  </div>
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
