"use client";

import { Link } from "../lib/router";
import { useEffect, useMemo, useState } from "react";
import { AppNav } from "./app-nav";
import { AuthPanel } from "./auth-panel";
import {
  assignTournamentPlayer,
  calculateTournamentStandings,
  deleteTournament,
  formatGender,
  formatMatchStatus,
  formatTournamentStatus,
  getTournamentCloseRestriction,
  readMatches,
  readPlayers,
  readSession,
  readTournamentPlayers,
  readTournaments,
  RegisteredPlayer,
  removeTournamentPlayer,
  SessionPlayer,
  TennisMatch,
  Tournament,
  TournamentStandingRow,
  TournamentStatus,
  updateTournamentStatus,
} from "../lib/tennis-store";

type TournamentDetailProps = {
  tournamentId: string;
};

type NoticeTone = "success" | "error";
const PLAYER_PAGE_SIZE = 10;
const ALPHABET_FILTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function TournamentDetail({ tournamentId }: TournamentDetailProps) {
  const [session, setSession] = useState<SessionPlayer | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<TennisMatch[]>([]);
  const [players, setPlayers] = useState<RegisteredPlayer[]>([]);
  const [allPlayers, setAllPlayers] = useState<RegisteredPlayer[]>([]);
  const [standings, setStandings] = useState<TournamentStandingRow[]>([]);
  const [joinNotice, setJoinNotice] = useState("");
  const [managementNotice, setManagementNotice] = useState("");
  const [joinNoticeTone, setJoinNoticeTone] = useState<NoticeTone>("success");
  const [managementNoticeTone, setManagementNoticeTone] = useState<NoticeTone>("success");
  const [playerFilterLetter, setPlayerFilterLetter] = useState<string>("ALL");
  const [playerPage, setPlayerPage] = useState(1);

  useEffect(() => {
    let isMounted = true;

    async function loadTournament() {
      setSession(readSession());
      await refreshTournament(isMounted);
    }

    void loadTournament();

    return () => {
      isMounted = false;
    };
  }, [tournamentId]);

  async function refreshTournament(isMounted = true) {
    const [tournaments, allMatches, nextAllPlayers] = await Promise.all([
      readTournaments(),
      readMatches(),
      readPlayers(),
    ]);
    const currentTournament = tournaments.find((entry) => entry.id === tournamentId) ?? null;

    if (!isMounted) {
      return;
    }

    setAllPlayers(nextAllPlayers);
    setTournament(currentTournament);
    if (currentTournament) {
      const tournamentMatches = allMatches.filter((match) => currentTournament.matchIds.includes(match.id));
      const [tournamentPlayers, tournamentStandings] = await Promise.all([
        readTournamentPlayers(currentTournament),
        calculateTournamentStandings(currentTournament, tournamentMatches),
      ]);

      if (!isMounted) {
        return;
      }

      setPlayers(tournamentPlayers);
      setStandings(tournamentStandings);
      setMatches(tournamentMatches);
    } else {
      setPlayers([]);
      setStandings([]);
      setMatches([]);
    }
  }

  async function handleAssignPlayer(targetEmail: string) {
    if (!session) {
      return;
    }

    const result = await assignTournamentPlayer(tournamentId, session, targetEmail);
    setManagementNoticeTone(result.ok ? "success" : "error");
    setManagementNotice(result.message);
    setJoinNotice("");

    if (result.ok) {
      await refreshTournament();
    }
  }

  async function handleRemovePlayer(targetEmail: string) {
    if (!session) {
      return;
    }

    const result = await removeTournamentPlayer(tournamentId, session, targetEmail);
    setManagementNoticeTone(result.ok ? "success" : "error");
    setManagementNotice(result.message);
    setJoinNotice("");

    if (result.ok) {
      await refreshTournament();
    }
  }

  async function handleUpdateStatus(nextStatus: TournamentStatus) {
    if (!session) {
      return;
    }

    const result = await updateTournamentStatus(tournamentId, session, nextStatus);
    setManagementNoticeTone(result.ok ? "success" : "error");
    setManagementNotice(result.message);
    setJoinNotice("");

    if (result.ok) {
      await refreshTournament();
    }
  }

  async function handleDeleteTournament() {
    if (!session || !tournament) {
      return;
    }

    if (!window.confirm(`Delete ${tournament.name}? This will also delete its matches.`)) {
      return;
    }

    const result = await deleteTournament(tournament.id, session);
    setManagementNoticeTone(result.ok ? "success" : "error");
    setManagementNotice(result.message);
    setJoinNotice("");

    if (result.ok) {
      window.history.pushState(null, "", "/");
      window.dispatchEvent(new Event("app:navigate"));
    }
  }

  const isJoined = tournament ? tournament.playerEmails.includes(session?.email ?? "") : false;
  const isCreator = tournament ? tournament.creatorEmail === session?.email : false;
  const acceptsPlayers = tournament?.status === "abierto";
  const canSeeMatches = isJoined || isCreator;
  const closeRestriction =
    tournament && tournament.status === "abierto" ? getTournamentCloseRestriction(tournament) : "";
  const canClose = tournament?.status === "abierto";
  const canFinish = tournament?.status === "cerrado";
  const hasFinalizedMatches = matches.some((match) => match.status === "finalizado");
  const standingsAreFinal = tournament?.status === "finalizado";
  const displayedStandings = standingsAreFinal
    ? standings
    : standings.filter((row) => row.email === session?.email);
  const canSeeStandings =
    Boolean(standingsAreFinal) || (isJoined && hasFinalizedMatches && displayedStandings.length > 0);
  const availablePlayers = useMemo(() => {
    if (!tournament) {
      return [];
    }

    return allPlayers
      .filter((player) => !tournament.playerEmails.includes(player.email))
      .filter((player) => tournament.gender === "mixto" || player.gender === tournament.gender)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allPlayers, tournament]);
  const filteredAvailablePlayers = availablePlayers.filter((player) => (
    playerFilterLetter === "ALL" ||
    player.name.trim().toUpperCase().startsWith(playerFilterLetter)
  ));
  const totalPlayerPages = Math.max(1, Math.ceil(filteredAvailablePlayers.length / PLAYER_PAGE_SIZE));
  const paginatedAvailablePlayers = filteredAvailablePlayers.slice(
    (playerPage - 1) * PLAYER_PAGE_SIZE,
    playerPage * PLAYER_PAGE_SIZE,
  );

  useEffect(() => {
    setPlayerPage(1);
  }, [playerFilterLetter, tournamentId]);

  useEffect(() => {
    if (playerPage > totalPlayerPages) {
      setPlayerPage(totalPlayerPages);
    }
  }, [playerPage, totalPlayerPages]);

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
          <p className="section-kicker">Tournament</p>
          <h1>We could not find this tournament</h1>
          <Link className="secondary-button inline-action" href="/">
            Back home
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
          <p className="eyebrow">Tournament</p>
          <h1>{tournament.name}</h1>
          <p>{tournament.location}</p>
        </div>
        <div className="entity-meta">
          <span>{tournament.date}</span>
          <span>{tournament.level}</span>
          <span>{formatGender(tournament.gender)}</span>
          <span>{formatTournamentStatus(tournament.status)}</span>
          <strong>{isJoined ? "Joined" : acceptsPlayers ? "Organizer assignment" : "Registration closed"}</strong>
        </div>
      </section>

      {isCreator ? (
        <section className="panel join-panel">
          <div className="panel-header">
            <p className="section-kicker">Management</p>
            <h2>Tournament status</h2>
            <p>Only the creator can edit these options.</p>
            {closeRestriction ? <p className="field-help">{closeRestriction}</p> : null}
          </div>
          <div className="state-actions" aria-label="Tournament status management">
            <button
              className="primary-button submit-button"
              disabled={!canClose}
              onClick={() => handleUpdateStatus("cerrado")}
              type="button"
            >
              Close tournament
            </button>
            <button
              className="primary-button submit-button"
              disabled={!canFinish}
              onClick={() => handleUpdateStatus("finalizado")}
              type="button"
            >
              Finish tournament
            </button>
            <button
              className="danger-button submit-button"
              onClick={handleDeleteTournament}
              type="button"
            >
              Delete tournament
            </button>
          </div>
          {managementNotice ? (
            <p className={`notice notice-${managementNoticeTone}`} role="alert">
              {managementNotice}
            </p>
          ) : null}
        </section>
      ) : null}

      {isCreator ? (
        <section className="panel join-panel">
          <div className="panel-header">
            <p className="section-kicker">Players</p>
            <h2>Add players to the tournament</h2>
            <p>
              Only the creator can add players. Once you close the tournament,
              registrations are locked.
            </p>
          </div>
          {acceptsPlayers ? (
            <>
              <div className="filter-bar" aria-label="Player alphabet filter">
                <button
                  className={playerFilterLetter === "ALL" ? "filter-button active" : "filter-button"}
                  onClick={() => setPlayerFilterLetter("ALL")}
                  type="button"
                >
                  All
                </button>
                {ALPHABET_FILTERS.map((letter) => (
                  <button
                    className={playerFilterLetter === letter ? "filter-button active" : "filter-button"}
                    key={letter}
                    onClick={() => setPlayerFilterLetter(letter)}
                    type="button"
                  >
                    {letter}
                  </button>
                ))}
              </div>
              <div className="stack-list">
                {paginatedAvailablePlayers.map((player) => (
                  <div className="info-card admin-user-card" key={player.email}>
                    <div className="admin-user-main">
                      <h3>{player.name}</h3>
                      <p>{player.email}</p>
                      <span>{formatGender(player.gender)}</span>
                    </div>
                    <button
                      className="secondary-button inline-action"
                      onClick={() => handleAssignPlayer(player.email)}
                      type="button"
                    >
                      Add to tournament
                    </button>
                  </div>
                ))}
                {!filteredAvailablePlayers.length ? (
                  <p className="notice">No players available for this filter.</p>
                ) : null}
              </div>
              {filteredAvailablePlayers.length ? (
                <div className="filter-bar" aria-label="Player list pagination">
                  <button
                    className="secondary-button inline-action"
                    disabled={playerPage <= 1}
                    onClick={() => setPlayerPage((current) => Math.max(1, current - 1))}
                    type="button"
                  >
                    Previous
                  </button>
                  <span className="field-help">
                    Page {playerPage} of {totalPlayerPages}
                  </span>
                  <button
                    className="secondary-button inline-action"
                    disabled={playerPage >= totalPlayerPages}
                    onClick={() => setPlayerPage((current) => Math.min(totalPlayerPages, current + 1))}
                    type="button"
                  >
                    Next
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <p className="notice">This tournament is already closed. Players can no longer be added.</p>
          )}
        </section>
      ) : !isJoined && acceptsPlayers ? (
        <section className="panel join-panel">
          <div className="panel-header">
            <p className="section-kicker">Registration</p>
            <h2>Organizer assignment</h2>
            <p>The tournament creator needs to add you to the player list.</p>
          </div>
          {joinNotice ? (
            <p className={`notice notice-${joinNoticeTone}`} role="alert">
              {joinNotice}
            </p>
          ) : null}
        </section>
      ) : !isJoined && !acceptsPlayers ? (
        <section className="panel join-panel">
          <div className="panel-header">
            <p className="section-kicker">Registration</p>
            <h2>This tournament is no longer accepting players</h2>
            <p>Current status: {formatTournamentStatus(tournament.status)}.</p>
          </div>
          {joinNotice ? (
            <p className={`notice notice-${joinNoticeTone}`} role="alert">
              {joinNotice}
            </p>
          ) : null}
        </section>
      ) : null}

      {canSeeStandings ? (
        <section className="panel standings-panel">
          <div className="panel-header">
            <p className="section-kicker">Results</p>
            <h2>{standingsAreFinal ? "Tournament standings" : "Your partial standings"}</h2>
            <p>
              {standingsAreFinal
                ? "Sorted by points, sets won, and games won."
                : "Calculated only from your completed matches."}
            </p>
          </div>
          <div className="table-scroll">
            <table className="standings-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Points</th>
                  <th>Sets won</th>
                  <th>Sets lost</th>
                  <th>Set difference</th>
                  <th>Games won</th>
                  <th>Games lost</th>
                  <th>Game difference</th>
                </tr>
              </thead>
              <tbody>
                {displayedStandings.map((row) => (
                  <tr key={row.email}>
                    <td>{row.name}</td>
                    <td>{row.points}</td>
                    <td>{row.setsFor}</td>
                    <td>{row.setsAgainst}</td>
                    <td>{row.setsDifference}</td>
                    <td>{row.gamesFor}</td>
                    <td>{row.gamesAgainst}</td>
                    <td>{row.gamesDifference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="tournament-detail-grid">
        {canSeeMatches ? (
          <article className="panel">
            <div className="panel-header">
              <p className="section-kicker">Matches</p>
              <h2>Tournament match list</h2>
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
            <p className="section-kicker">Players</p>
            <h2>Registered</h2>
            <p>{players.length} registered players.</p>
          </div>
          <div className="stack-list">
            {players.length ? players.map((player) => (
              <div className="info-card admin-user-card" key={player.email}>
                <div className="admin-user-main">
                  <h3>{player.name}</h3>
                  <p>{player.email}</p>
                  <span>{formatGender(player.gender)}</span>
                </div>
                {isCreator && acceptsPlayers ? (
                  <button
                    className="danger-button inline-action"
                    onClick={() => handleRemovePlayer(player.email)}
                    type="button"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            )) : <p className="notice">There are no registered players yet.</p>}
          </div>
        </aside>
      </section>

    </main>
  );
}
