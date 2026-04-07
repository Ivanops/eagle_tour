export type RegisteredPlayer = {
  email: string;
  password: string;
  verified: boolean;
  verificationCode: string;
  name: string;
  gender: PlayerGender;
};

export type SessionPlayer = {
  email: string;
  verified: boolean;
  name: string;
  gender: PlayerGender;
};

export type PlayerGender = "femenino" | "masculino";

export type TournamentGender = PlayerGender | "mixto";
export type TournamentStatus = "abierto" | "cerrado" | "finalizado";
export type MatchStatus = "por_jugar" | "finalizado";

export type MatchSet = {
  id: string;
  pairAGames: number;
  pairBGames: number;
};

export type Tournament = {
  id: string;
  name: string;
  date: string;
  location: string;
  level: string;
  gender: TournamentGender;
  status: TournamentStatus;
  password: string;
  creatorEmail: string;
  playerEmails: string[];
  matchIds: string[];
};

export type TennisMatch = {
  id: string;
  tournamentId: string;
  round: string;
  court: string;
  startsAt: string;
  playerA: string;
  playerB: string;
  playerEmails: string[];
  finalizationAcceptedBy: string[];
  status: MatchStatus;
  score: string;
  sets: MatchSet[];
};

export type TournamentStandingRow = {
  email: string;
  name: string;
  points: number;
  setsFor: number;
  setsAgainst: number;
  setsDifference: number;
  gamesFor: number;
  gamesAgainst: number;
  gamesDifference: number;
};

export type CreateTournamentInput = {
  name: string;
  date: string;
  location: string;
  level: string;
  gender: TournamentGender;
  password: string;
  creator: SessionPlayer;
};

const KEYS = {
  demoVersion: "tennis-app.demo-version",
  players: "tennis-app.players",
  session: "tennis-app.session",
  tournaments: "tennis-app.tournaments",
  matches: "tennis-app.matches",
} as const;

export const MAX_TOURNAMENTS_PER_CREATOR = 3;
const DEMO_DATA_VERSION = "standings-demo-v1";

const defaultPlayers: RegisteredPlayer[] = [
  {
    email: "lucia@tennisapp.com",
    password: "demo1234",
    verified: true,
    verificationCode: "482913",
    name: "Lucia Navarro",
    gender: "femenino",
  },
  {
    email: "sofia@tennisapp.com",
    password: "demo1234",
    verified: true,
    verificationCode: "718204",
    name: "Sofia Vega",
    gender: "femenino",
  },
  {
    email: "emma@tennisapp.com",
    password: "demo1234",
    verified: true,
    verificationCode: "319845",
    name: "Emma Castillo",
    gender: "femenino",
  },
  {
    email: "valentina@tennisapp.com",
    password: "demo1234",
    verified: true,
    verificationCode: "904112",
    name: "Valentina Ruiz",
    gender: "femenino",
  },
  {
    email: "mateo@tennisapp.com",
    password: "demo1234",
    verified: true,
    verificationCode: "562901",
    name: "Mateo Rios",
    gender: "masculino",
  },
  {
    email: "diego@tennisapp.com",
    password: "demo1234",
    verified: true,
    verificationCode: "119362",
    name: "Diego Torres",
    gender: "masculino",
  },
  {
    email: "tomas@tennisapp.com",
    password: "demo1234",
    verified: true,
    verificationCode: "680455",
    name: "Tomas Herrera",
    gender: "masculino",
  },
  {
    email: "bruno@tennisapp.com",
    password: "demo1234",
    verified: true,
    verificationCode: "451708",
    name: "Bruno Silva",
    gender: "masculino",
  },
];

const defaultTournaments: Tournament[] = [
  {
    id: "madrid-clay-masters",
    name: "Madrid Clay Masters",
    date: "12 Apr 2026",
    location: "Madrid Tennis Club",
    level: "Avanzado",
    gender: "femenino",
    status: "abierto",
    password: "clay2026",
    creatorEmail: "lucia@tennisapp.com",
    playerEmails: [
      "lucia@tennisapp.com",
      "sofia@tennisapp.com",
      "emma@tennisapp.com",
      "valentina@tennisapp.com",
    ],
    matchIds: [],
  },
  {
    id: "barcelona-open-series",
    name: "Barcelona Open Series",
    date: "21 Apr 2026",
    location: "Barcelona Racket Center",
    level: "Intermedio",
    gender: "mixto",
    status: "cerrado",
    password: "barca",
    creatorEmail: "lucia@tennisapp.com",
    playerEmails: [
      "lucia@tennisapp.com",
      "sofia@tennisapp.com",
      "mateo@tennisapp.com",
      "diego@tennisapp.com",
    ],
    matchIds: ["barcelona-open-series-match-1"],
  },
  {
    id: "roma-mixed-finals",
    name: "Roma Mixed Finals",
    date: "04 May 2026",
    location: "Foro Tennis Park",
    level: "Open",
    gender: "mixto",
    status: "finalizado",
    password: "roma",
    creatorEmail: "mateo@tennisapp.com",
    playerEmails: [
      "lucia@tennisapp.com",
      "sofia@tennisapp.com",
      "mateo@tennisapp.com",
      "diego@tennisapp.com",
    ],
    matchIds: ["roma-mixed-finals-match-1"],
  },
];

const defaultMatches: TennisMatch[] = [
  {
    id: "barcelona-open-series-match-1",
    tournamentId: "barcelona-open-series",
    round: "Partido 1",
    court: "Cancha central",
    startsAt: "21 Apr 2026",
    playerA: "Lucia Navarro / Mateo Rios",
    playerB: "Sofia Vega / Diego Torres",
    playerEmails: [
      "lucia@tennisapp.com",
      "mateo@tennisapp.com",
      "sofia@tennisapp.com",
      "diego@tennisapp.com",
    ],
    finalizationAcceptedBy: [
      "lucia@tennisapp.com",
      "mateo@tennisapp.com",
      "sofia@tennisapp.com",
    ],
    status: "por_jugar",
    score: "6-4, 6-3",
    sets: [
      { id: "set-1", pairAGames: 6, pairBGames: 4 },
      { id: "set-2", pairAGames: 6, pairBGames: 3 },
    ],
  },
  {
    id: "roma-mixed-finals-match-1",
    tournamentId: "roma-mixed-finals",
    round: "Partido 1",
    court: "Cancha 2",
    startsAt: "04 May 2026",
    playerA: "Lucia Navarro / Mateo Rios",
    playerB: "Sofia Vega / Diego Torres",
    playerEmails: [
      "lucia@tennisapp.com",
      "mateo@tennisapp.com",
      "sofia@tennisapp.com",
      "diego@tennisapp.com",
    ],
    finalizationAcceptedBy: [
      "lucia@tennisapp.com",
      "mateo@tennisapp.com",
      "sofia@tennisapp.com",
      "diego@tennisapp.com",
    ],
    status: "finalizado",
    score: "4-6, 6-4, 10-8",
    sets: [
      { id: "set-1", pairAGames: 4, pairBGames: 6 },
      { id: "set-2", pairAGames: 6, pairBGames: 4 },
      { id: "set-3", pairAGames: 10, pairBGames: 8 },
    ],
  },
];

function hasStorage() {
  return typeof window !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!hasStorage()) {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    window.localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    window.localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (hasStorage()) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
}

function ensureDemoData() {
  if (!hasStorage() || window.localStorage.getItem(KEYS.demoVersion) === DEMO_DATA_VERSION) {
    return;
  }

  writeJson(KEYS.players, defaultPlayers);
  writeJson(KEYS.tournaments, defaultTournaments);
  writeJson(KEYS.matches, defaultMatches);
  writeJson(KEYS.session, {
    email: "lucia@tennisapp.com",
    verified: true,
    name: "Lucia Navarro",
    gender: "femenino",
  } satisfies SessionPlayer);
  window.localStorage.setItem(KEYS.demoVersion, DEMO_DATA_VERSION);
}

function makeId(name: string) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `${slug || "torneo"}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizeGender(gender: unknown): PlayerGender {
  return gender === "masculino" || gender === "femenino" ? gender : "femenino";
}

function normalizeTournamentGender(gender: unknown): TournamentGender {
  return gender === "masculino" || gender === "femenino" || gender === "mixto"
    ? gender
    : "mixto";
}

function normalizeTournamentStatus(status: unknown): TournamentStatus {
  return status === "cerrado" || status === "finalizado" ? status : "abierto";
}

function normalizeMatchStatus(status: unknown): MatchStatus {
  return status === "finalizado" || status === "finished" ? "finalizado" : "por_jugar";
}

function getUniqueEmails(emails: unknown[]) {
  return Array.from(
    new Set(
      emails
        .filter((email): email is string => typeof email === "string")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

function clampGames(games: unknown) {
  const numericGames = Number(games);

  if (!Number.isFinite(numericGames)) {
    return 0;
  }

  return Math.min(99, Math.max(0, Math.trunc(numericGames)));
}

function makeDefaultSet(index = 1): MatchSet {
  return {
    id: `set-${index}`,
    pairAGames: 0,
    pairBGames: 0,
  };
}

function normalizeMatchSets(sets: unknown): MatchSet[] {
  if (!Array.isArray(sets) || sets.length === 0) {
    return [makeDefaultSet()];
  }

  return sets.slice(0, 5).map((set, index) => {
    const maybeSet = set as Partial<MatchSet>;

    return {
      id: maybeSet.id || `set-${index + 1}`,
      pairAGames: clampGames(maybeSet.pairAGames),
      pairBGames: clampGames(maybeSet.pairBGames),
    };
  });
}

function formatMatchScore(sets: MatchSet[]) {
  return sets
    .map((set) => `${set.pairAGames}-${set.pairBGames}`)
    .join(", ");
}

function getMatchSides(match: TennisMatch) {
  return {
    pairA: match.playerEmails.slice(0, 2),
    pairB: match.playerEmails.slice(2, 4),
  };
}

function getMatchTotals(match: TennisMatch) {
  return match.sets.reduce(
    (totals, set) => {
      const pairAWonSet = set.pairAGames > set.pairBGames;
      const pairBWonSet = set.pairBGames > set.pairAGames;

      return {
        pairASets: totals.pairASets + (pairAWonSet ? 1 : 0),
        pairBSets: totals.pairBSets + (pairBWonSet ? 1 : 0),
        pairAGames: totals.pairAGames + set.pairAGames,
        pairBGames: totals.pairBGames + set.pairBGames,
      };
    },
    { pairASets: 0, pairBSets: 0, pairAGames: 0, pairBGames: 0 },
  );
}

function getWinningSide(match: TennisMatch) {
  const totals = getMatchTotals(match);

  if (totals.pairASets !== totals.pairBSets) {
    return totals.pairASets > totals.pairBSets ? "pairA" : "pairB";
  }

  if (totals.pairAGames !== totals.pairBGames) {
    return totals.pairAGames > totals.pairBGames ? "pairA" : "pairB";
  }

  return null;
}

function getMatchPlayerEmailsFromNames(match: Partial<TennisMatch>) {
  const names = `${match.playerA ?? ""} / ${match.playerB ?? ""}`
    .split(" / ")
    .map((name) => name.trim())
    .filter(Boolean);
  const players = readPlayers();

  return getUniqueEmails(
    names
      .map((name) => players.find((player) => player.name === name)?.email)
      .filter(Boolean),
  );
}

function normalizeMatchPlayerEmails(match: Partial<TennisMatch>) {
  if (Array.isArray(match.playerEmails) && match.playerEmails.length > 0) {
    return getUniqueEmails(match.playerEmails);
  }

  return getMatchPlayerEmailsFromNames(match);
}

function areTournamentMatchesFinished(tournament: Tournament, matches: TennisMatch[]) {
  const tournamentMatches = matches.filter((match) => tournament.matchIds.includes(match.id));
  return tournamentMatches.length > 0 && tournamentMatches.every((match) => match.status === "finalizado");
}

function getTournamentMatchCount(tournament: Tournament, matches: TennisMatch[]) {
  return matches.filter((match) => tournament.matchIds.includes(match.id)).length;
}

function createTournamentMatch(
  tournament: Tournament,
  index: number,
  playerA: string,
  playerB: string,
  playerEmails: string[],
): TennisMatch {
  return {
    id: `${tournament.id}-match-${index}`,
    tournamentId: tournament.id,
    round: `Partido ${index}`,
    court: "Cancha por confirmar",
    startsAt: tournament.date,
    playerA,
    playerB,
    playerEmails,
    finalizationAcceptedBy: [],
    status: "por_jugar",
    score: "Por jugarse",
    sets: [makeDefaultSet()],
  };
}

function formatDoublesTeam(playerA: RegisteredPlayer, playerB: RegisteredPlayer) {
  return `${playerA.name} / ${playerB.name}`;
}

function buildMixedTournamentMatches(tournament: Tournament, players: RegisteredPlayer[]) {
  const men = players.filter((player) => player.gender === "masculino");
  const women = players.filter((player) => player.gender === "femenino");
  const matches: TennisMatch[] = [];

  for (let round = 0; round < men.length; round += 1) {
    const pairs = men.map((man, index) => ({
      man,
      woman: women[(index + round) % women.length],
    }));

    for (let pairIndex = 0; pairIndex < pairs.length; pairIndex += 2) {
      const pairA = pairs[pairIndex];
      const pairB = pairs[pairIndex + 1];

      if (!pairA || !pairB) {
        continue;
      }

      matches.push(
        createTournamentMatch(
          tournament,
          matches.length + 1,
          formatDoublesTeam(pairA.man, pairA.woman),
          formatDoublesTeam(pairB.man, pairB.woman),
          [pairA.man.email, pairA.woman.email, pairB.man.email, pairB.woman.email],
        ),
      );
    }
  }

  return matches;
}

function buildSingleGenderTournamentMatches(tournament: Tournament, players: RegisteredPlayer[]) {
  const matches: TennisMatch[] = [];

  for (let groupStart = 0; groupStart < players.length; groupStart += 4) {
    const group = players.slice(groupStart, groupStart + 4);

    if (group.length < 4) {
      continue;
    }

    const [player1, player2, player3, player4] = group as [
      RegisteredPlayer,
      RegisteredPlayer,
      RegisteredPlayer,
      RegisteredPlayer,
    ];
    const groupMatches = [
      [formatDoublesTeam(player1, player2), formatDoublesTeam(player3, player4)],
      [formatDoublesTeam(player1, player3), formatDoublesTeam(player2, player4)],
      [formatDoublesTeam(player1, player4), formatDoublesTeam(player2, player3)],
    ];

    groupMatches.forEach(([playerA, playerB]) => {
      matches.push(
        createTournamentMatch(
          tournament,
          matches.length + 1,
          playerA,
          playerB,
          [player1.email, player2.email, player3.email, player4.email],
        ),
      );
    });
  }

  return matches;
}

function buildTournamentMatches(tournament: Tournament) {
  const players = readTournamentPlayers(tournament);

  if (tournament.gender === "mixto") {
    return buildMixedTournamentMatches(tournament, players);
  }

  return buildSingleGenderTournamentMatches(tournament, players);
}

function countTournamentPlayersByGender(tournament: Tournament) {
  const playerEmails = new Set(tournament.playerEmails);
  return readPlayers()
    .filter((player) => playerEmails.has(player.email))
    .reduce(
      (counts, player) => ({
        ...counts,
        [player.gender]: counts[player.gender] + 1,
      }),
      { femenino: 0, masculino: 0 } satisfies Record<PlayerGender, number>,
    );
}

export function getTournamentCloseRestriction(tournament: Tournament) {
  const counts = countTournamentPlayersByGender(tournament);
  const totalPlayers = counts.femenino + counts.masculino;

  if (totalPlayers === 0) {
    return "No puedes cerrar un torneo sin jugadores inscritos.";
  }

  if (tournament.gender === "mixto") {
    const hasBalancedGenders = counts.femenino === counts.masculino;
    const hasEvenPairs = counts.femenino % 2 === 0 && counts.masculino % 2 === 0;

    if (hasBalancedGenders && hasEvenPairs) {
      return "";
    }

    return `Para cerrar un torneo mixto necesitas la misma cantidad de mujeres y hombres, y que ambas cantidades sean multiplos de 2. Ahora hay ${counts.femenino} mujeres y ${counts.masculino} hombres.`;
  }

  const playerCount = counts[tournament.gender];

  if (playerCount % 4 === 0) {
    return "";
  }

  return `Para cerrar un torneo ${formatGender(tournament.gender).toLowerCase()} la cantidad de jugadores debe ser multiplo de 4. Ahora hay ${playerCount}.`;
}

function getTournamentStatusTransitionRestriction(
  tournament: Tournament,
  matches: TennisMatch[],
  nextStatus: TournamentStatus,
) {
  if (tournament.status === "finalizado") {
    return "Este torneo ya esta finalizado y no se puede modificar.";
  }

  if (tournament.status === "abierto" && nextStatus !== "cerrado") {
    return "Un torneo abierto solo puede cerrarse.";
  }

  if (tournament.status === "cerrado" && nextStatus !== "abierto" && nextStatus !== "finalizado") {
    return "Un torneo cerrado solo puede reabrirse o finalizarse.";
  }

  if (tournament.status === nextStatus) {
    return `El torneo ya esta ${formatTournamentStatus(nextStatus).toLowerCase()}.`;
  }

  if (nextStatus === "cerrado") {
    return getTournamentCloseRestriction(tournament);
  }

  if (nextStatus === "finalizado") {
    const matchCount = getTournamentMatchCount(tournament, matches);
    if (matchCount === 0 || !areTournamentMatchesFinished(tournament, matches)) {
      return "Para finalizar el torneo, todos sus partidos deben estar finalizados.";
    }
  }

  return "";
}

export function formatGender(gender: TournamentGender) {
  const labels: Record<TournamentGender, string> = {
    femenino: "Femenino",
    masculino: "Masculino",
    mixto: "Mixto",
  };

  return labels[gender];
}

export function formatTournamentStatus(status: TournamentStatus) {
  const labels: Record<TournamentStatus, string> = {
    abierto: "Abierto",
    cerrado: "Cerrado",
    finalizado: "Finalizado",
  };

  return labels[status];
}

export function formatMatchStatus(status: MatchStatus) {
  const labels: Record<MatchStatus, string> = {
    por_jugar: "Por jugar",
    finalizado: "Finalizado",
  };

  return labels[status];
}

export function readPlayers(): RegisteredPlayer[] {
  ensureDemoData();
  const players = readJson<RegisteredPlayer[]>(KEYS.players, defaultPlayers);
  const normalizedPlayers = players.map((player) => ({
    ...player,
    gender: normalizeGender(player.gender),
  }));

  if (hasStorage()) {
    savePlayers(normalizedPlayers);
  }

  return normalizedPlayers;
}

export function savePlayers(players: RegisteredPlayer[]) {
  writeJson(KEYS.players, players);
}

export function readTournamentPlayers(tournament: Tournament) {
  const playerEmails = new Set(tournament.playerEmails);
  return readPlayers().filter((player) => playerEmails.has(player.email));
}

export function readSession(): SessionPlayer | null {
  ensureDemoData();
  const session = readJson<SessionPlayer | null>(KEYS.session, null);

  if (!session) {
    return null;
  }

  const normalizedSession = {
    ...session,
    gender: normalizeGender(session.gender),
  };

  if (hasStorage()) {
    saveSession(normalizedSession);
  }

  return normalizedSession;
}

export function saveSession(player: SessionPlayer | null) {
  if (!hasStorage()) {
    return;
  }

  if (!player) {
    window.localStorage.removeItem(KEYS.session);
    return;
  }

  writeJson(KEYS.session, player);
}

export function readTournaments(): Tournament[] {
  ensureDemoData();
  const tournaments = readJson<Tournament[]>(KEYS.tournaments, defaultTournaments);
  const matches = readMatches();
  const normalizedTournaments = tournaments.map((tournament) => {
    const normalizedTournament = {
      ...tournament,
      gender: normalizeTournamentGender(tournament.gender),
      status: normalizeTournamentStatus(tournament.status),
      creatorEmail:
        tournament.creatorEmail === "admin@tennisapp.com"
          ? "lucia@tennisapp.com"
          : tournament.creatorEmail,
    };
    const status: TournamentStatus = areTournamentMatchesFinished(normalizedTournament, matches)
      ? "finalizado"
      : normalizedTournament.status === "finalizado"
        ? "cerrado"
        : normalizedTournament.status;

    return {
      ...normalizedTournament,
      status,
      matchIds: status === "abierto" ? [] : normalizedTournament.matchIds,
    };
  });

  if (hasStorage()) {
    saveTournaments(normalizedTournaments);
    const openTournamentIds = new Set(
      normalizedTournaments
        .filter((tournament) => tournament.status === "abierto")
        .map((tournament) => tournament.id),
    );
    saveMatches(matches.filter((match) => !openTournamentIds.has(match.tournamentId)));
  }

  return normalizedTournaments;
}

export function saveTournaments(tournaments: Tournament[]) {
  writeJson(KEYS.tournaments, tournaments);
}

export function readMatches() {
  ensureDemoData();
  const matches = readJson<TennisMatch[]>(KEYS.matches, defaultMatches);
  const normalizedMatches = matches.map((match) => {
    const sets = normalizeMatchSets((match as Partial<TennisMatch>).sets);
    const score = match.score && match.score !== "Por jugarse" ? match.score : formatMatchScore(sets);
    const playerEmails = normalizeMatchPlayerEmails(match);
    const finalizationAcceptedBy = getUniqueEmails(
      Array.isArray((match as Partial<TennisMatch>).finalizationAcceptedBy)
        ? (match as Partial<TennisMatch>).finalizationAcceptedBy ?? []
        : [],
    ).filter((email) => playerEmails.includes(email));
    const status: MatchStatus =
      playerEmails.length >= 4 && finalizationAcceptedBy.length >= 4
        ? "finalizado"
        : "por_jugar";

    return {
      ...match,
      playerEmails,
      finalizationAcceptedBy,
      status,
      score,
      sets,
    };
  });

  if (hasStorage()) {
    saveMatches(normalizedMatches);
  }

  return normalizedMatches;
}

export function saveMatches(matches: TennisMatch[]) {
  writeJson(KEYS.matches, matches);
}

export function calculateTournamentStandings(
  tournament: Tournament,
  matches = readMatches(),
): TournamentStandingRow[] {
  const rowsByEmail = new Map<string, TournamentStandingRow>();

  readTournamentPlayers(tournament).forEach((player) => {
    rowsByEmail.set(player.email, {
      email: player.email,
      name: player.name,
      points: 0,
      setsFor: 0,
      setsAgainst: 0,
      setsDifference: 0,
      gamesFor: 0,
      gamesAgainst: 0,
      gamesDifference: 0,
    });
  });

  matches
    .filter((match) => tournament.matchIds.includes(match.id) && match.status === "finalizado")
    .forEach((match) => {
      const sides = getMatchSides(match);
      const totals = getMatchTotals(match);
      const winningSide = getWinningSide(match);

      [
        {
          emails: sides.pairA,
          setsFor: totals.pairASets,
          setsAgainst: totals.pairBSets,
          gamesFor: totals.pairAGames,
          gamesAgainst: totals.pairBGames,
          won: winningSide === "pairA",
        },
        {
          emails: sides.pairB,
          setsFor: totals.pairBSets,
          setsAgainst: totals.pairASets,
          gamesFor: totals.pairBGames,
          gamesAgainst: totals.pairAGames,
          won: winningSide === "pairB",
        },
      ].forEach((side) => {
        side.emails.forEach((email) => {
          const row = rowsByEmail.get(email);

          if (!row) {
            return;
          }

          row.points += side.won ? 1 : 0;
          row.setsFor += side.setsFor;
          row.setsAgainst += side.setsAgainst;
          row.gamesFor += side.gamesFor;
          row.gamesAgainst += side.gamesAgainst;
          row.setsDifference = row.setsFor - row.setsAgainst;
          row.gamesDifference = row.gamesFor - row.gamesAgainst;
        });
      });
    });

  return Array.from(rowsByEmail.values()).sort((playerA, playerB) => {
    if (playerB.points !== playerA.points) {
      return playerB.points - playerA.points;
    }

    if (playerB.setsFor !== playerA.setsFor) {
      return playerB.setsFor - playerA.setsFor;
    }

    if (playerB.gamesFor !== playerA.gamesFor) {
      return playerB.gamesFor - playerA.gamesFor;
    }

    if (playerB.setsDifference !== playerA.setsDifference) {
      return playerB.setsDifference - playerA.setsDifference;
    }

    if (playerB.gamesDifference !== playerA.gamesDifference) {
      return playerB.gamesDifference - playerA.gamesDifference;
    }

    return playerA.name.localeCompare(playerB.name);
  });
}

export function createPlayer(name: string, email: string, password: string, gender: PlayerGender) {
  const players = readPlayers();
  const normalizedEmail = email.trim().toLowerCase();

  if (players.some((player) => player.email === normalizedEmail)) {
    return { ok: false as const, message: "Ese email ya existe. Prueba iniciar sesion." };
  }

  const verificationCode = makeVerificationCode();
  const player: RegisteredPlayer = {
    email: normalizedEmail,
    password,
    verified: false,
    verificationCode,
    name: name.trim(),
    gender,
  };

  savePlayers([...players, player]);

  return {
    ok: true as const,
    player,
    message: `Cuenta creada. Codigo mock enviado: ${verificationCode}`,
  };
}

export function verifyPlayerEmail(email: string, code: string) {
  const players = readPlayers();
  const index = players.findIndex((entry) => entry.email === email.trim().toLowerCase());

  if (index === -1) {
    return { ok: false as const, message: "No encontramos un jugador pendiente." };
  }

  if (players[index].verificationCode !== code.trim()) {
    return { ok: false as const, message: "Codigo incorrecto." };
  }

  const updatedPlayer: RegisteredPlayer = { ...players[index], verified: true };
  const nextPlayers = [...players];
  nextPlayers[index] = updatedPlayer;
  savePlayers(nextPlayers);

  const session: SessionPlayer = {
    email: updatedPlayer.email,
    verified: true,
    name: updatedPlayer.name,
    gender: updatedPlayer.gender,
  };
  saveSession(session);

  return { ok: true as const, session, message: "Email verificado y sesion iniciada." };
}

export function loginPlayer(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const player = readPlayers().find((entry) => entry.email === normalizedEmail);

  if (!player || player.password !== password) {
    return { ok: false as const, message: "Credenciales invalidas." };
  }

  if (!player.verified) {
    return {
      ok: false as const,
      pendingVerificationEmail: player.email,
      message: `Tu email aun no fue verificado. Codigo mock: ${player.verificationCode}`,
    };
  }

  const session: SessionPlayer = {
    email: player.email,
    verified: player.verified,
    name: player.name,
    gender: player.gender,
  };
  saveSession(session);

  return { ok: true as const, session, message: `Sesion iniciada. Bienvenido, ${player.name}.` };
}

export function createTournament(input: CreateTournamentInput) {
  const tournaments = readTournaments();
  const creatorTournamentCount = tournaments.filter(
    (tournament) => tournament.creatorEmail === input.creator.email,
  ).length;

  if (creatorTournamentCount >= MAX_TOURNAMENTS_PER_CREATOR) {
    return {
      ok: false as const,
      message: `Puedes crear hasta ${MAX_TOURNAMENTS_PER_CREATOR} torneos como maximo.`,
    };
  }

  const tournamentId = makeId(input.name);
  const tournamentDate = input.date.trim() || "Fecha por confirmar";

  const tournament: Tournament = {
    id: tournamentId,
    name: input.name.trim(),
    date: tournamentDate,
    location: input.location.trim(),
    level: input.level.trim(),
    gender: input.gender,
    status: "abierto",
    password: input.password,
    creatorEmail: input.creator.email,
    playerEmails: [],
    matchIds: [],
  };

  saveTournaments([tournament, ...tournaments]);

  return {
    ok: true as const,
    tournament,
    message: `Torneo creado: ${tournament.name}. Aun no estas anotado.`,
  };
}

export function deleteTournament(tournamentId: string, player: SessionPlayer) {
  const tournaments = readTournaments();
  const tournament = tournaments.find((entry) => entry.id === tournamentId);

  if (!tournament) {
    return { ok: false as const, message: "No encontramos este torneo." };
  }

  if (tournament.creatorEmail !== player.email) {
    return { ok: false as const, message: "Solo el creador puede borrar el torneo." };
  }

  saveTournaments(tournaments.filter((entry) => entry.id !== tournamentId));
  saveMatches(readMatches().filter((match) => match.tournamentId !== tournamentId));

  return { ok: true as const, message: "Torneo borrado." };
}

export function joinTournament(tournamentId: string, player: SessionPlayer, password: string) {
  const tournaments = readTournaments();
  const index = tournaments.findIndex((entry) => entry.id === tournamentId);

  if (index === -1) {
    return { ok: false as const, message: "No encontramos este torneo." };
  }

  const tournament = tournaments[index];

  if (tournament.playerEmails.includes(player.email)) {
    return { ok: true as const, tournament, message: "Ya estabas anotado." };
  }

  if (tournament.status !== "abierto") {
    return {
      ok: false as const,
      message: `Este torneo esta ${formatTournamentStatus(tournament.status).toLowerCase()}. Ya no acepta inscripciones.`,
    };
  }

  if (tournament.gender !== "mixto" && tournament.gender !== player.gender) {
    return {
      ok: false as const,
      message: `Este torneo es ${formatGender(tournament.gender)}. Tu genero actual es ${formatGender(player.gender)}.`,
    };
  }

  if (tournament.password !== password) {
    return { ok: false as const, message: "Password de torneo incorrecto." };
  }

  const updatedTournament: Tournament = {
    ...tournament,
    playerEmails: [...tournament.playerEmails, player.email],
  };
  const nextTournaments = [...tournaments];
  nextTournaments[index] = updatedTournament;
  saveTournaments(nextTournaments);

  return { ok: true as const, tournament: updatedTournament, message: "Ya estas anotado." };
}

export function updateTournamentStatus(
  tournamentId: string,
  player: SessionPlayer,
  status: TournamentStatus,
) {
  const tournaments = readTournaments();
  const matches = readMatches();
  const index = tournaments.findIndex((entry) => entry.id === tournamentId);

  if (index === -1) {
    return { ok: false as const, message: "No encontramos este torneo." };
  }

  const tournament = tournaments[index];

  if (tournament.creatorEmail !== player.email) {
    return { ok: false as const, message: "Solo el creador puede editar el estado del torneo." };
  }

  const transitionRestriction = getTournamentStatusTransitionRestriction(tournament, matches, status);

  if (transitionRestriction) {
    return { ok: false as const, message: transitionRestriction };
  }

  const nextTournaments = [...tournaments];
  let nextMatches = matches;
  let matchIds = tournament.matchIds;

  if (status === "cerrado") {
    const generatedMatches = buildTournamentMatches(tournament);
    nextMatches = [
      ...matches.filter((match) => match.tournamentId !== tournament.id),
      ...generatedMatches,
    ];
    matchIds = generatedMatches.map((match) => match.id);
    saveMatches(nextMatches);
  }

  if (status === "abierto") {
    nextMatches = matches.filter((match) => match.tournamentId !== tournament.id);
    matchIds = [];
    saveMatches(nextMatches);
  }

  nextTournaments[index] = {
    ...tournament,
    status,
    matchIds,
  };
  saveTournaments(nextTournaments);

  return { ok: true as const, tournament: nextTournaments[index], message: "Estado del torneo actualizado." };
}

export function updateMatchStatus(matchId: string, player: SessionPlayer, status: MatchStatus) {
  const matches = readMatches();
  const tournaments = readTournaments();
  const matchIndex = matches.findIndex((match) => match.id === matchId);

  if (matchIndex === -1) {
    return { ok: false as const, message: "No encontramos este partido." };
  }

  const match = matches[matchIndex];
  const tournamentIndex = tournaments.findIndex((entry) => entry.id === match.tournamentId);

  if (tournamentIndex === -1) {
    return { ok: false as const, message: "No encontramos el torneo de este partido." };
  }

  const tournament = tournaments[tournamentIndex];

  if (status !== "finalizado") {
    return { ok: false as const, message: "El partido solo puede finalizarse con la aceptacion de los 4 jugadores." };
  }

  if (!match.playerEmails.includes(player.email)) {
    return { ok: false as const, message: "Solo los jugadores de este partido pueden aceptar el resultado." };
  }

  if (tournament.status === "finalizado") {
    return { ok: false as const, message: "Este torneo ya esta finalizado y no se puede modificar." };
  }

  if (match.status === "finalizado") {
    return { ok: true as const, match, message: "Este partido ya esta finalizado." };
  }

  if (match.playerEmails.length < 4) {
    return { ok: false as const, message: "Este partido necesita 4 jugadores para poder finalizarse." };
  }

  if (match.finalizationAcceptedBy.includes(player.email)) {
    return { ok: true as const, match, message: "Ya habias aceptado este resultado." };
  }

  const finalizationAcceptedBy = [...match.finalizationAcceptedBy, player.email];
  const isFinalized = finalizationAcceptedBy.length >= 4;
  const nextStatus: MatchStatus = isFinalized ? "finalizado" : "por_jugar";
  const updatedMatch = {
    ...match,
    finalizationAcceptedBy,
    status: nextStatus,
  };
  const nextMatches = [...matches];
  nextMatches[matchIndex] = updatedMatch;
  saveMatches(nextMatches);

  const nextTournaments = [...tournaments];
  nextTournaments[tournamentIndex] = {
    ...tournament,
    status: areTournamentMatchesFinished(tournament, nextMatches)
      ? "finalizado"
      : tournament.status,
  };
  saveTournaments(nextTournaments);

  return {
    ok: true as const,
    match: updatedMatch,
    message: isFinalized
      ? "Los 4 jugadores aceptaron el resultado. Partido finalizado."
      : `Resultado aceptado. Faltan ${4 - finalizationAcceptedBy.length} jugadores.`,
  };
}

export function updateMatchSetGames(
  matchId: string,
  player: SessionPlayer,
  setId: string,
  pair: "pairA" | "pairB",
  games: number,
) {
  const matches = readMatches();
  const tournaments = readTournaments();
  const matchIndex = matches.findIndex((match) => match.id === matchId);

  if (matchIndex === -1) {
    return { ok: false as const, message: "No encontramos este partido." };
  }

  const match = matches[matchIndex];
  const tournament = tournaments.find((entry) => entry.matchIds.includes(match.id));

  if (!tournament) {
    return { ok: false as const, message: "No encontramos el torneo de este partido." };
  }

  if (tournament.creatorEmail !== player.email) {
    return { ok: false as const, message: "Solo el creador puede editar los sets del partido." };
  }

  if (tournament.status === "finalizado") {
    return { ok: false as const, message: "Este torneo ya esta finalizado y no se puede modificar." };
  }

  if (match.status === "finalizado") {
    return { ok: false as const, message: "Este partido ya esta finalizado y no se puede modificar." };
  }

  const nextSets = match.sets.map((set) =>
    set.id === setId
      ? {
          ...set,
          [pair === "pairA" ? "pairAGames" : "pairBGames"]: clampGames(games),
        }
      : set,
  );
  const updatedMatch = {
    ...match,
    sets: nextSets,
    finalizationAcceptedBy: [],
    status: "por_jugar" as const,
    score: formatMatchScore(nextSets),
  };
  const nextMatches = [...matches];
  nextMatches[matchIndex] = updatedMatch;
  saveMatches(nextMatches);

  return { ok: true as const, match: updatedMatch, message: "Set actualizado." };
}

export function addMatchSet(matchId: string, player: SessionPlayer) {
  const matches = readMatches();
  const tournaments = readTournaments();
  const matchIndex = matches.findIndex((match) => match.id === matchId);

  if (matchIndex === -1) {
    return { ok: false as const, message: "No encontramos este partido." };
  }

  const match = matches[matchIndex];
  const tournament = tournaments.find((entry) => entry.matchIds.includes(match.id));

  if (!tournament) {
    return { ok: false as const, message: "No encontramos el torneo de este partido." };
  }

  if (tournament.creatorEmail !== player.email) {
    return { ok: false as const, message: "Solo el creador puede agregar sets al partido." };
  }

  if (tournament.status === "finalizado") {
    return { ok: false as const, message: "Este torneo ya esta finalizado y no se puede modificar." };
  }

  if (match.status === "finalizado") {
    return { ok: false as const, message: "Este partido ya esta finalizado y no se puede modificar." };
  }

  if (match.sets.length >= 5) {
    return { ok: false as const, message: "Un partido puede tener hasta 5 sets." };
  }

  const nextSets = [...match.sets, makeDefaultSet(match.sets.length + 1)];
  const updatedMatch = {
    ...match,
    sets: nextSets,
    finalizationAcceptedBy: [],
    status: "por_jugar" as const,
    score: formatMatchScore(nextSets),
  };
  const nextMatches = [...matches];
  nextMatches[matchIndex] = updatedMatch;
  saveMatches(nextMatches);

  return { ok: true as const, match: updatedMatch, message: "Set agregado." };
}

export function deleteMatchSet(matchId: string, player: SessionPlayer, setId: string) {
  const matches = readMatches();
  const tournaments = readTournaments();
  const matchIndex = matches.findIndex((match) => match.id === matchId);

  if (matchIndex === -1) {
    return { ok: false as const, message: "No encontramos este partido." };
  }

  const match = matches[matchIndex];
  const tournament = tournaments.find((entry) => entry.matchIds.includes(match.id));

  if (!tournament) {
    return { ok: false as const, message: "No encontramos el torneo de este partido." };
  }

  if (tournament.creatorEmail !== player.email) {
    return { ok: false as const, message: "Solo el creador puede borrar sets del partido." };
  }

  if (tournament.status === "finalizado") {
    return { ok: false as const, message: "Este torneo ya esta finalizado y no se puede modificar." };
  }

  if (match.status === "finalizado") {
    return { ok: false as const, message: "Este partido ya esta finalizado y no se puede modificar." };
  }

  if (match.sets.length <= 1) {
    return { ok: false as const, message: "El partido debe tener al menos 1 set." };
  }

  const nextSets = match.sets
    .filter((set) => set.id !== setId)
    .map((set, index) => ({
      ...set,
      id: `set-${index + 1}`,
    }));

  if (nextSets.length === match.sets.length) {
    return { ok: false as const, message: "No encontramos ese set." };
  }

  const updatedMatch = {
    ...match,
    sets: nextSets,
    finalizationAcceptedBy: [],
    status: "por_jugar" as const,
    score: formatMatchScore(nextSets),
  };
  const nextMatches = [...matches];
  nextMatches[matchIndex] = updatedMatch;
  saveMatches(nextMatches);

  return { ok: true as const, match: updatedMatch, message: "Set borrado." };
}

export function updatePlayerProfile(email: string, input: { name: string; gender: PlayerGender }) {
  const players = readPlayers();
  const index = players.findIndex((player) => player.email === email.trim().toLowerCase());
  const nextName = input.name.trim();

  if (index === -1) {
    return { ok: false as const, message: "No encontramos este jugador." };
  }

  if (!nextName) {
    return { ok: false as const, message: "El nombre no puede quedar vacio." };
  }

  const updatedPlayer: RegisteredPlayer = {
    ...players[index],
    name: nextName,
    gender: input.gender,
  };
  const nextPlayers = [...players];
  nextPlayers[index] = updatedPlayer;
  savePlayers(nextPlayers);

  const session = readSession();
  if (session?.email === updatedPlayer.email) {
    saveSession({
      ...session,
      name: nextName,
      gender: input.gender,
    });
  }

  return { ok: true as const, player: updatedPlayer, message: "Perfil actualizado." };
}
