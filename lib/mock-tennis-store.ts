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
  status: MatchStatus;
  score: string;
  sets: MatchSet[];
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
  players: "tennis-app.players",
  session: "tennis-app.session",
  tournaments: "tennis-app.tournaments",
  matches: "tennis-app.matches",
} as const;

const defaultPlayers: RegisteredPlayer[] = [
  {
    email: "lucia@tennisapp.com",
    password: "demo1234",
    verified: true,
    verificationCode: "482913",
    name: "Lucia Navarro",
    gender: "femenino",
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
    playerEmails: ["lucia@tennisapp.com"],
    matchIds: [],
  },
  {
    id: "barcelona-open-series",
    name: "Barcelona Open Series",
    date: "21 Apr 2026",
    location: "Barcelona Racket Center",
    level: "Intermedio",
    gender: "mixto",
    status: "abierto",
    password: "barca",
    creatorEmail: "lucia@tennisapp.com",
    playerEmails: [],
    matchIds: [],
  },
  {
    id: "roma-spring-cup",
    name: "Roma Spring Cup",
    date: "04 May 2026",
    location: "Foro Tennis Park",
    level: "Open",
    gender: "masculino",
    status: "abierto",
    password: "roma",
    creatorEmail: "lucia@tennisapp.com",
    playerEmails: [],
    matchIds: [],
  },
];

const defaultMatches: TennisMatch[] = [];

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
): TennisMatch {
  return {
    id: `${tournament.id}-match-${index}`,
    tournamentId: tournament.id,
    round: `Partido ${index}`,
    court: "Cancha por confirmar",
    startsAt: tournament.date,
    playerA,
    playerB,
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
      matches.push(createTournamentMatch(tournament, matches.length + 1, playerA, playerB));
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
  const matches = readJson<TennisMatch[]>(KEYS.matches, defaultMatches);
  const normalizedMatches = matches.map((match) => {
    const sets = normalizeMatchSets((match as Partial<TennisMatch>).sets);
    const score = match.score && match.score !== "Por jugarse" ? match.score : formatMatchScore(sets);

    return {
      ...match,
      status: normalizeMatchStatus(match.status),
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

  return tournament;
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

  if (tournament.creatorEmail !== player.email) {
    return { ok: false as const, message: "Solo el creador puede editar el estado del partido." };
  }

  if (tournament.status === "finalizado") {
    return { ok: false as const, message: "Este torneo ya esta finalizado y no se puede modificar." };
  }

  const updatedMatch = {
    ...match,
    status,
    score: status === "finalizado" && match.score === "Por jugarse" ? "Finalizado" : match.score,
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

  return { ok: true as const, match: updatedMatch, message: "Estado del partido actualizado." };
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

  if (match.sets.length >= 5) {
    return { ok: false as const, message: "Un partido puede tener hasta 5 sets." };
  }

  const nextSets = [...match.sets, makeDefaultSet(match.sets.length + 1)];
  const updatedMatch = {
    ...match,
    sets: nextSets,
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
