import * as localTennisStore from "./local-tennis-store";
import { requireSupabaseEnv, supabase } from "./supabase-client";
import type {
  CreateTournamentInput,
  MatchSet,
  MatchStatus,
  PlayerGender,
  PlayerRole,
  RegisteredPlayer,
  SessionPlayer,
  TennisMatch,
  Tournament,
  TournamentGender,
  TournamentStandingRow,
  TournamentStatus,
} from "./local-tennis-store";

export * from "./local-tennis-store";

const SESSION_CACHE_KEY = "tennis-app.supabase-session-profile";
const TOURNAMENT_PASSWORD_PATTERN = /^\d{4}$/;

function hasStorage() {
  return typeof window !== "undefined";
}

function readCachedSession(): SessionPlayer | null {
  if (!hasStorage()) {
    return null;
  }

  const rawSession = window.localStorage.getItem(SESSION_CACHE_KEY);
  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as SessionPlayer;
  } catch {
    window.localStorage.removeItem(SESSION_CACHE_KEY);
    return null;
  }
}

function cacheSession(session: SessionPlayer | null) {
  if (!hasStorage()) {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(SESSION_CACHE_KEY);
    return;
  }

  window.localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(session));
}

function normalizeGender(gender: unknown): PlayerGender {
  return gender === "masculino" || gender === "femenino" ? gender : "femenino";
}

function normalizeRole(role: unknown): PlayerRole {
  return role === "super" || role === "organizer" ? role : "player";
}

function normalizeTournamentPassword(password: string) {
  return password.trim();
}

function isValidTournamentPassword(password: string) {
  return TOURNAMENT_PASSWORD_PATTERN.test(normalizeTournamentPassword(password));
}

function makeFallbackName(email: string) {
  return email.split("@")[0]?.replace(/[._-]+/g, " ") || "Jugador";
}

function toSessionPlayer(profile: {
  email: string;
  gender: PlayerGender;
  name: string;
  role: PlayerRole;
}): SessionPlayer {
  return {
    email: profile.email,
    verified: true,
    name: profile.name,
    gender: profile.gender,
    role: profile.role,
  };
}

function toRegisteredPlayer(profile: {
  email: string;
  gender: PlayerGender;
  name: string;
  role: PlayerRole;
}): RegisteredPlayer {
  return {
    email: profile.email,
    password: "",
    verified: true,
    verificationCode: "",
    name: profile.name,
    gender: profile.gender,
    role: profile.role,
  };
}

type ProfileRecord = {
  id: string;
  email: string;
  gender: PlayerGender;
  name: string;
  role: PlayerRole;
};

type TournamentRecord = {
  id: string;
  access_code: string;
  creator_id: string;
  gender: TournamentGender;
  level: string;
  location: string;
  name: string;
  status: TournamentStatus;
  tournament_date: string | null;
};

type MatchRecord = {
  id: string;
  court: string;
  pair_a_player_1_id: string;
  pair_a_player_2_id: string;
  pair_b_player_1_id: string;
  pair_b_player_2_id: string;
  round: string;
  starts_at: string | null;
  status: MatchStatus;
  tournament_id: string;
};

type MatchSetRecord = {
  id: string;
  match_id: string;
  pair_a_games: number;
  pair_b_games: number;
  set_number: number;
};

type MatchAcceptanceRecord = {
  match_id: string;
  player_id: string;
};

function formatScore(sets: MatchSet[]) {
  if (!sets.length) {
    return "Pending";
  }

  return sets.map((set) => `${set.pairAGames}-${set.pairBGames}`).join(", ");
}

function formatDate(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

function makeProfileMap(profiles: ProfileRecord[]) {
  return new Map(profiles.map((profile) => [profile.id, profile]));
}

function getProfileEmail(profileById: Map<string, ProfileRecord>, id: string) {
  return profileById.get(id)?.email ?? "";
}

function getProfileName(profileById: Map<string, ProfileRecord>, id: string) {
  return profileById.get(id)?.name ?? "Jugador";
}

function formatDoublesTeamFromIds(
  profileById: Map<string, ProfileRecord>,
  playerAId: string,
  playerBId: string,
) {
  return `${getProfileName(profileById, playerAId)} / ${getProfileName(profileById, playerBId)}`;
}

async function readProfileRecords() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, name, gender, role")
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }

  return data.map((profile) => ({
    id: profile.id,
    email: profile.email,
    name: profile.name,
    gender: normalizeGender(profile.gender),
    role: normalizeRole(profile.role),
  }));
}

async function readTournamentRecords() {
  const { data, error } = await supabase
    .from("tournaments")
    .select("id, name, tournament_date, location, level, gender, status, access_code, creator_id")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data.map((tournament) => ({
    id: tournament.id,
    name: tournament.name,
    tournament_date: tournament.tournament_date,
    location: tournament.location,
    level: tournament.level,
    gender: tournament.gender,
    status: tournament.status,
    access_code: tournament.access_code,
    creator_id: tournament.creator_id,
  })) as TournamentRecord[];
}

async function readMembershipRecords() {
  const { data, error } = await supabase
    .from("tournament_players")
    .select("tournament_id, player_id, joined_at")
    .order("joined_at", { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }

  return data as Array<{ tournament_id: string; player_id: string }>;
}

async function readMatchRecords() {
  const { data, error } = await supabase
    .from("matches")
    .select(
      "id, tournament_id, round, court, starts_at, pair_a_player_1_id, pair_a_player_2_id, pair_b_player_1_id, pair_b_player_2_id, status",
    )
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }

  return data as MatchRecord[];
}

async function readSetRecords() {
  const { data, error } = await supabase
    .from("match_sets")
    .select("id, match_id, set_number, pair_a_games, pair_b_games")
    .order("set_number", { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }

  return data as MatchSetRecord[];
}

async function readAcceptanceRecords() {
  const { data, error } = await supabase
    .from("match_acceptances")
    .select("match_id, player_id");

  if (error) {
    console.error(error);
    return [];
  }

  return data as MatchAcceptanceRecord[];
}

function toTournament(
  tournament: TournamentRecord,
  profileById: Map<string, ProfileRecord>,
  memberships: Array<{ tournament_id: string; player_id: string }>,
  matches: MatchRecord[],
): Tournament {
  return {
    id: tournament.id,
    name: tournament.name,
    date: formatDate(tournament.tournament_date),
    location: tournament.location,
    level: tournament.level,
    gender: tournament.gender,
    status: tournament.status,
    password: tournament.access_code,
    creatorEmail: getProfileEmail(profileById, tournament.creator_id),
    playerEmails: memberships
      .filter((membership) => membership.tournament_id === tournament.id)
      .map((membership) => getProfileEmail(profileById, membership.player_id))
      .filter(Boolean),
    matchIds: matches
      .filter((match) => match.tournament_id === tournament.id)
      .map((match) => match.id),
  };
}

function toMatch(
  match: MatchRecord,
  profileById: Map<string, ProfileRecord>,
  sets: MatchSetRecord[],
  acceptances: MatchAcceptanceRecord[],
): TennisMatch {
  const matchSets = sets
    .filter((set) => set.match_id === match.id)
    .sort((setA, setB) => setA.set_number - setB.set_number)
    .map((set) => ({
      id: set.id,
      pairAGames: set.pair_a_games,
      pairBGames: set.pair_b_games,
    }));

  return {
    id: match.id,
    tournamentId: match.tournament_id,
    round: match.round,
    court: match.court,
    startsAt: formatDate(match.starts_at),
    playerA: formatDoublesTeamFromIds(
      profileById,
      match.pair_a_player_1_id,
      match.pair_a_player_2_id,
    ),
    playerB: formatDoublesTeamFromIds(
      profileById,
      match.pair_b_player_1_id,
      match.pair_b_player_2_id,
    ),
    playerEmails: [
      getProfileEmail(profileById, match.pair_a_player_1_id),
      getProfileEmail(profileById, match.pair_a_player_2_id),
      getProfileEmail(profileById, match.pair_b_player_1_id),
      getProfileEmail(profileById, match.pair_b_player_2_id),
    ].filter(Boolean),
    finalizationAcceptedBy: acceptances
      .filter((acceptance) => acceptance.match_id === match.id)
      .map((acceptance) => getProfileEmail(profileById, acceptance.player_id))
      .filter(Boolean),
    status: match.status,
    score: formatScore(matchSets),
    sets: matchSets.length ? matchSets : [{ id: "set-1", pairAGames: 0, pairBGames: 0 }],
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

function getCloseRestrictionFromPlayers(tournament: Tournament, players: RegisteredPlayer[]) {
  const counts = players.reduce(
    (totals, player) => ({
      ...totals,
      [player.gender]: totals[player.gender] + 1,
    }),
    { femenino: 0, masculino: 0 } satisfies Record<PlayerGender, number>,
  );
  const totalPlayers = counts.femenino + counts.masculino;

  if (totalPlayers === 0) {
    return "You cannot close a tournament with no registered players.";
  }

  if (tournament.gender === "mixto") {
    const hasBalancedGenders = counts.femenino === counts.masculino;
    const hasEvenPairs = counts.femenino % 2 === 0 && counts.masculino % 2 === 0;

    if (hasBalancedGenders && hasEvenPairs) {
      return "";
    }

    return `To close a mixed tournament you need the same number of women and men, and both counts must be multiples of 2. Right now there are ${counts.femenino} women and ${counts.masculino} men.`;
  }

  const playerCount = counts[tournament.gender];

  if (playerCount % 4 === 0) {
    return "";
  }

  return `To close a ${localTennisStore.formatGender(tournament.gender).toLowerCase()} tournament, the player count must be a multiple of 4. Right now there are ${playerCount}.`;
}

function buildSingleGenderMatchInputs(tournament: Tournament, players: ProfileRecord[]) {
  const matches: Array<{
    pairA: [ProfileRecord, ProfileRecord];
    pairB: [ProfileRecord, ProfileRecord];
  }> = [];

  for (let groupStart = 0; groupStart < players.length; groupStart += 4) {
    const group = players.slice(groupStart, groupStart + 4);

    if (group.length < 4) {
      continue;
    }

    const [player1, player2, player3, player4] = group as [
      ProfileRecord,
      ProfileRecord,
      ProfileRecord,
      ProfileRecord,
    ];
    matches.push(
      { pairA: [player1, player2], pairB: [player3, player4] },
      { pairA: [player1, player3], pairB: [player2, player4] },
      { pairA: [player1, player4], pairB: [player2, player3] },
    );
  }

  return matches;
}

function buildMixedMatchInputs(players: ProfileRecord[]) {
  const men = players.filter((player) => player.gender === "masculino");
  const women = players.filter((player) => player.gender === "femenino");
  const matches: Array<{
    pairA: [ProfileRecord, ProfileRecord];
    pairB: [ProfileRecord, ProfileRecord];
  }> = [];

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

      matches.push({
        pairA: [pairA.man, pairA.woman],
        pairB: [pairB.man, pairB.woman],
      });
    }
  }

  return matches;
}

async function readProfileById(id: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("email, name, gender, role")
    .eq("id", id)
    .single();

  if (error) {
    return null;
  }

  return {
    email: data.email,
    name: data.name,
    gender: normalizeGender(data.gender),
    role: normalizeRole(data.role),
  };
}

async function upsertProfile(input: {
  id: string;
  email: string;
  name: string;
  gender: PlayerGender;
}) {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: input.id,
        email: input.email,
        name: input.name,
        gender: input.gender,
      },
      { onConflict: "id" },
    )
    .select("email, name, gender, role")
    .single();

  if (error) {
    return { ok: false as const, message: error.message };
  }

  return {
    ok: true as const,
    profile: {
      email: data.email,
      name: data.name,
      gender: normalizeGender(data.gender),
      role: normalizeRole(data.role),
    },
  };
}

export function readSession() {
  return readCachedSession();
}

export function saveSession(player: SessionPlayer | null) {
  cacheSession(player);

  if (!player) {
    void supabase.auth.signOut();
  }
}

export async function createPlayer(
  name: string,
  email: string,
  password: string,
  gender: PlayerGender,
) {
  requireSupabaseEnv();

  const normalizedEmail = email.trim().toLowerCase();
  const nextName = name.trim();

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        name: nextName,
        gender,
      },
    },
  });

  if (error) {
    return { ok: false as const, message: error.message };
  }

  if (!data.user) {
    return { ok: false as const, message: "Supabase did not return the created user." };
  }

  const player: RegisteredPlayer = {
    email: normalizedEmail,
    password: "",
    verified: Boolean(data.session),
    verificationCode: "",
    name: nextName,
    gender,
    role: "player",
  };

  if (!data.session) {
    return {
      ok: true as const,
      player,
      requiresEmailVerification: false,
      message: "Account created. Check your email to confirm the account before signing in.",
    };
  }

  const profileResult = await upsertProfile({
    id: data.user.id,
    email: normalizedEmail,
    name: nextName,
    gender,
  });

  if (!profileResult.ok) {
    return { ok: false as const, message: profileResult.message };
  }

  const session = toSessionPlayer(profileResult.profile);
  cacheSession(session);

  return {
    ok: true as const,
    player: toRegisteredPlayer(profileResult.profile),
    session,
    requiresEmailVerification: false,
    message: `Account created. Welcome, ${session.name}.`,
  };
}

export function verifyPlayerEmail() {
  requireSupabaseEnv();

  return {
    ok: false as const,
    message: "With Supabase, verification happens through the confirmation email.",
  };
}

export async function loginPlayer(email: string, password: string) {
  requireSupabaseEnv();

  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error || !data.user) {
    return { ok: false as const, message: error?.message ?? "Invalid credentials." };
  }

  let profile = await readProfileById(data.user.id);

  if (!profile) {
    const profileResult = await upsertProfile({
      id: data.user.id,
      email: data.user.email ?? normalizedEmail,
      name: typeof data.user.user_metadata.name === "string"
        ? data.user.user_metadata.name
        : makeFallbackName(normalizedEmail),
      gender: normalizeGender(data.user.user_metadata.gender),
    });

    if (!profileResult.ok) {
      return { ok: false as const, message: profileResult.message };
    }

    profile = profileResult.profile;
  }

  const session = toSessionPlayer(profile);
  cacheSession(session);

  return { ok: true as const, session, message: `Signed in. Welcome, ${session.name}.` };
}

export async function updatePlayerProfile(
  email: string,
  input: { name: string; gender: PlayerGender },
) {
  requireSupabaseEnv();

  const currentSession = readCachedSession();
  const nextName = input.name.trim();

  if (!currentSession || currentSession.email !== email.trim().toLowerCase()) {
    return { ok: false as const, message: "Sign in to edit your profile." };
  }

  if (!nextName) {
    return { ok: false as const, message: "Name cannot be empty." };
  }

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    cacheSession(null);
    return { ok: false as const, message: "Your Supabase session expired. Sign in again." };
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      name: nextName,
      gender: input.gender,
    })
    .eq("id", authData.user.id)
    .select("email, name, gender, role")
    .single();

  if (error) {
    return { ok: false as const, message: error.message };
  }

  const player = toRegisteredPlayer({
    email: data.email,
    name: data.name,
    gender: normalizeGender(data.gender),
    role: normalizeRole(data.role),
  });
  cacheSession(toSessionPlayer(player));

  return { ok: true as const, player, message: "Profile updated." };
}

export async function readPlayers() {
  requireSupabaseEnv();

  const profiles = await readProfileRecords();

  return profiles.map(toRegisteredPlayer);
}

export async function readTournaments() {
  requireSupabaseEnv();

  const [profiles, tournaments, memberships, matches] = await Promise.all([
    readProfileRecords(),
    readTournamentRecords(),
    readMembershipRecords(),
    readMatchRecords(),
  ]);
  const profileById = makeProfileMap(profiles);

  return tournaments.map((tournament) =>
    toTournament(tournament, profileById, memberships, matches),
  );
}

export async function readMatches() {
  requireSupabaseEnv();

  const [profiles, matches, sets, acceptances] = await Promise.all([
    readProfileRecords(),
    readMatchRecords(),
    readSetRecords(),
    readAcceptanceRecords(),
  ]);
  const profileById = makeProfileMap(profiles);

  return matches.map((match) => toMatch(match, profileById, sets, acceptances));
}

export async function readTournamentPlayers(tournament: Tournament) {
  const players = await readPlayers();
  const playerEmails = new Set(tournament.playerEmails);
  return players.filter((player) => playerEmails.has(player.email));
}

export async function calculateTournamentStandings(
  tournament: Tournament,
  matches?: TennisMatch[],
) {
  const [players, allMatches] = await Promise.all([
    readTournamentPlayers(tournament),
    matches ? Promise.resolve(matches) : readMatches(),
  ]);
  const rowsByEmail = new Map<string, TournamentStandingRow>();

  players.forEach((player) => {
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

  allMatches
    .filter(
      (match) =>
        tournament.matchIds.includes(match.id) &&
        match.status === "finalizado" &&
        match.playerEmails.length >= 4,
    )
    .forEach((match) => {
      const totals = getMatchTotals(match);
      const winningSide = getWinningSide(match);
      const pairA = match.playerEmails.slice(0, 2);
      const pairB = match.playerEmails.slice(2, 4);

      [
        {
          emails: pairA,
          setsFor: totals.pairASets,
          setsAgainst: totals.pairBSets,
          gamesFor: totals.pairAGames,
          gamesAgainst: totals.pairBGames,
          won: winningSide === "pairA",
        },
        {
          emails: pairB,
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

export async function createTournament(input: CreateTournamentInput) {
  requireSupabaseEnv();

  if (!localTennisStore.canCreateTournaments(input.creator)) {
    return {
      ok: false as const,
      message: "You need permission from a super user to create tournaments.",
    };
  }

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return { ok: false as const, message: "Sign in to create tournaments." };
  }

  const { count, error: countError } = await supabase
    .from("tournaments")
    .select("id", { count: "exact", head: true })
    .eq("creator_id", authData.user.id);

  if (countError) {
    return { ok: false as const, message: countError.message };
  }

  if ((count ?? 0) >= localTennisStore.MAX_TOURNAMENTS_PER_CREATOR) {
    return {
      ok: false as const,
      message: `You can create up to ${localTennisStore.MAX_TOURNAMENTS_PER_CREATOR} tournaments.`,
    };
  }

  if (!isValidTournamentPassword(input.password)) {
    return {
      ok: false as const,
      message: "Tournament password must be exactly 4 digits.",
    };
  }

  const { data, error } = await supabase
    .from("tournaments")
    .insert({
      name: input.name.trim(),
      tournament_date: input.date.trim() || null,
      location: input.location.trim(),
      level: input.level.trim(),
      gender: input.gender,
      access_code: normalizeTournamentPassword(input.password),
      creator_id: authData.user.id,
    })
    .select("id, name, tournament_date, location, level, gender, status, access_code, creator_id")
    .single();

  if (error) {
    return { ok: false as const, message: error.message };
  }

  const tournament = toTournament(
    data as TournamentRecord,
    makeProfileMap([
      {
        id: authData.user.id,
        email: input.creator.email,
        name: input.creator.name,
        gender: input.creator.gender,
        role: input.creator.role,
      },
    ]),
    [],
    [],
  );

  return {
    ok: true as const,
    tournament,
    message: `Tournament created: ${tournament.name}. Share its 4-digit password with players so they can join.`,
  };
}

export async function deleteTournament(tournamentId: string, player: SessionPlayer) {
  requireSupabaseEnv();

  const tournament = (await readTournaments()).find((entry) => entry.id === tournamentId);
  if (!tournament) {
    return { ok: false as const, message: "We could not find this tournament." };
  }

  if (tournament.creatorEmail !== player.email) {
    return { ok: false as const, message: "Only the creator can delete the tournament." };
  }

  const { error } = await supabase.from("tournaments").delete().eq("id", tournamentId);

  if (error) {
    return { ok: false as const, message: error.message };
  }

  return { ok: true as const, message: "Tournament deleted." };
}

export async function joinTournament(
  tournamentId: string,
  player: SessionPlayer,
  password: string,
) {
  requireSupabaseEnv();

  const tournament = (await readTournaments()).find((entry) => entry.id === tournamentId);
  if (!tournament) {
    return { ok: false as const, message: "We could not find this tournament." };
  }

  if (tournament.status !== "abierto") {
    return { ok: false as const, message: "You can only join while the tournament is open." };
  }

  const normalizedPassword = normalizeTournamentPassword(password);
  if (!isValidTournamentPassword(normalizedPassword)) {
    return { ok: false as const, message: "Enter the 4-digit tournament password." };
  }

  if (tournament.playerEmails.includes(player.email)) {
    return { ok: true as const, tournament, message: "You are already registered in this tournament." };
  }

  if (tournament.gender !== "mixto" && tournament.gender !== player.gender) {
    return {
      ok: false as const,
      message: `This tournament is ${localTennisStore.formatGender(tournament.gender)}. Your profile is listed as ${localTennisStore.formatGender(player.gender)}.`,
    };
  }

  if (tournament.password !== normalizedPassword) {
    return { ok: false as const, message: "Incorrect tournament password." };
  }

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return { ok: false as const, message: "Sign in to join tournaments." };
  }

  const { error } = await supabase.from("tournament_players").insert({
    tournament_id: tournamentId,
    player_id: authData.user.id,
  });

  if (error) {
    return { ok: false as const, message: error.message };
  }

  return {
    ok: true as const,
    tournament: {
      ...tournament,
      playerEmails: [...tournament.playerEmails, player.email],
    },
    message: "You joined the tournament.",
  };
}

export async function assignTournamentPlayer(
  tournamentId: string,
  actor: SessionPlayer,
  targetEmail: string,
) {
  requireSupabaseEnv();

  const normalizedTargetEmail = targetEmail.trim().toLowerCase();
  const tournament = (await readTournaments()).find((entry) => entry.id === tournamentId);

  if (!tournament) {
    return { ok: false as const, message: "We could not find this tournament." };
  }

  if (tournament.creatorEmail !== actor.email) {
    return { ok: false as const, message: "Only the creator can add players." };
  }

  if (tournament.status !== "abierto") {
    return { ok: false as const, message: "You can only add players while the tournament is open." };
  }

  const profiles = await readProfileRecords();
  const targetProfile = profiles.find((profile) => profile.email === normalizedTargetEmail);

  if (!targetProfile) {
    return { ok: false as const, message: "We could not find that player." };
  }

  if (tournament.playerEmails.includes(targetProfile.email)) {
    return { ok: true as const, tournament, message: `${targetProfile.name} was already registered.` };
  }

  if (tournament.gender !== "mixto" && tournament.gender !== targetProfile.gender) {
    return {
      ok: false as const,
      message: `This tournament is ${localTennisStore.formatGender(tournament.gender)}. ${targetProfile.name} is listed as ${localTennisStore.formatGender(targetProfile.gender)}.`,
    };
  }

  const { error } = await supabase.from("tournament_players").insert({
    tournament_id: tournamentId,
    player_id: targetProfile.id,
  });

  if (error) {
    return { ok: false as const, message: error.message };
  }

  return {
    ok: true as const,
    tournament: {
      ...tournament,
      playerEmails: [...tournament.playerEmails, targetProfile.email],
    },
    message: `${targetProfile.name} was added to the tournament.`,
  };
}

export async function removeTournamentPlayer(
  tournamentId: string,
  actor: SessionPlayer,
  targetEmail: string,
) {
  requireSupabaseEnv();

  const normalizedTargetEmail = targetEmail.trim().toLowerCase();
  const tournament = (await readTournaments()).find((entry) => entry.id === tournamentId);

  if (!tournament) {
    return { ok: false as const, message: "We could not find this tournament." };
  }

  if (tournament.status !== "abierto") {
    return { ok: false as const, message: "You can only change registrations while the tournament is open." };
  }

  const profiles = await readProfileRecords();
  const targetProfile = profiles.find((profile) => profile.email === normalizedTargetEmail);

  if (!targetProfile) {
    return { ok: false as const, message: "We could not find that player." };
  }

  const isCreator = tournament.creatorEmail === actor.email;
  const isLeavingSelf = actor.email === targetProfile.email;

  if (!isCreator && !isLeavingSelf) {
    return { ok: false as const, message: "Only the creator can remove other players." };
  }

  if (!tournament.playerEmails.includes(targetProfile.email)) {
    return {
      ok: true as const,
      tournament,
      message: isLeavingSelf
        ? "You were not registered in this tournament."
        : `${targetProfile.name} was not registered.`,
    };
  }

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return { ok: false as const, message: "Sign in to change tournament registrations." };
  }

  const { error } = await supabase
    .from("tournament_players")
    .delete()
    .eq("tournament_id", tournamentId)
    .eq("player_id", isLeavingSelf ? authData.user.id : targetProfile.id);

  if (error) {
    return { ok: false as const, message: error.message };
  }

  return {
    ok: true as const,
    tournament: {
      ...tournament,
      playerEmails: tournament.playerEmails.filter((email) => email !== targetProfile.email),
    },
    message: isLeavingSelf
      ? "You left the tournament."
      : `${targetProfile.name} was removed from the tournament.`,
  };
}

async function getTournamentProfiles(tournament: Tournament) {
  const memberships = await readMembershipRecords();
  const profiles = await readProfileRecords();
  const profileById = makeProfileMap(profiles);
  const tournamentMemberships = memberships.filter(
    (membership) => membership.tournament_id === tournament.id,
  );

  return tournamentMemberships
    .map((membership) => profileById.get(membership.player_id))
    .filter((profile): profile is ProfileRecord => Boolean(profile));
}

async function createMatchesForTournament(tournament: Tournament) {
  const profiles = await getTournamentProfiles(tournament);
  const matchInputs =
    tournament.gender === "mixto"
      ? buildMixedMatchInputs(profiles)
      : buildSingleGenderMatchInputs(
          tournament,
          profiles.filter((profile) => profile.gender === tournament.gender),
        );

  if (!matchInputs.length) {
    return { ok: true as const, matchIds: [] };
  }

  const startsAt = tournament.date ? `${tournament.date}T12:00:00Z` : null;
  const { data, error } = await supabase
    .from("matches")
    .insert(
      matchInputs.map((match, index) => ({
        tournament_id: tournament.id,
        round: `Match ${index + 1}`,
        court: "Court to be confirmed",
        starts_at: startsAt,
        pair_a_player_1_id: match.pairA[0].id,
        pair_a_player_2_id: match.pairA[1].id,
        pair_b_player_1_id: match.pairB[0].id,
        pair_b_player_2_id: match.pairB[1].id,
      })),
    )
    .select("id");

  if (error) {
    return { ok: false as const, message: error.message };
  }

  const matchIds = data.map((match) => match.id);
  const { error: setsError } = await supabase.from("match_sets").insert(
    matchIds.map((matchId) => ({
      match_id: matchId,
      set_number: 1,
    })),
  );

  if (setsError) {
    return { ok: false as const, message: setsError.message };
  }

  return { ok: true as const, matchIds };
}

export async function updateTournamentStatus(
  tournamentId: string,
  player: SessionPlayer,
  status: TournamentStatus,
) {
  requireSupabaseEnv();

  const tournaments = await readTournaments();
  const tournament = tournaments.find((entry) => entry.id === tournamentId);

  if (!tournament) {
    return { ok: false as const, message: "We could not find this tournament." };
  }

  if (tournament.creatorEmail !== player.email) {
    return { ok: false as const, message: "Only the creator can edit the tournament status." };
  }

  if (tournament.status === "finalizado") {
    return { ok: false as const, message: "This tournament is already finished and cannot be changed." };
  }

  if (tournament.status === "cerrado" && status !== "finalizado") {
    return {
      ok: false as const,
      message: "A closed tournament can only be finished when all its matches are completed.",
    };
  }

  if (tournament.status === status) {
    return {
      ok: false as const,
      message: `The tournament is already ${localTennisStore.formatTournamentStatus(status).toLowerCase()}.`,
    };
  }

  if (status === "cerrado") {
    const tournamentPlayers = await readTournamentPlayers(tournament);
    const restriction = getCloseRestrictionFromPlayers(tournament, tournamentPlayers);
    if (restriction) {
      return { ok: false as const, message: restriction };
    }

    await supabase.from("matches").delete().eq("tournament_id", tournament.id);
    const matchResult = await createMatchesForTournament(tournament);
    if (!matchResult.ok) {
      return { ok: false as const, message: matchResult.message };
    }
  }

  if (status === "finalizado") {
    const matches = (await readMatches()).filter((match) => match.tournamentId === tournament.id);
    if (!matches.length || matches.some((match) => match.status !== "finalizado")) {
      return {
        ok: false as const,
        message: "To finish the tournament, all its matches must be completed.",
      };
    }
  }

  const { error } = await supabase
    .from("tournaments")
    .update({ status })
    .eq("id", tournamentId);

  if (error) {
    return { ok: false as const, message: error.message };
  }

  const nextTournament = {
    ...tournament,
    status,
    matchIds: tournament.matchIds,
  };

  return { ok: true as const, tournament: nextTournament, message: "Tournament status updated." };
}

export async function updateMatchStatus(
  matchId: string,
  player: SessionPlayer,
  status: MatchStatus,
) {
  requireSupabaseEnv();

  if (status !== "finalizado") {
    return { ok: false as const, message: "This match can only be finished after all 4 players accept the result." };
  }

  const matches = await readMatches();
  const match = matches.find((entry) => entry.id === matchId);
  const tournament = (await readTournaments()).find((entry) => entry.id === match?.tournamentId);

  if (!match || !tournament) {
    return { ok: false as const, message: "We could not find this match." };
  }

  if (tournament.status === "finalizado") {
    return { ok: false as const, message: "This tournament is already finished and cannot be changed." };
  }

  if (!match.playerEmails.includes(player.email)) {
    return { ok: false as const, message: "Only players in this match can accept the result." };
  }

  if (match.status === "finalizado") {
    return { ok: true as const, match, message: "This match is already finished." };
  }

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return { ok: false as const, message: "Sign in to accept the result." };
  }

  const { error } = await supabase.from("match_acceptances").upsert({
    match_id: matchId,
    player_id: authData.user.id,
  });

  if (error) {
    return { ok: false as const, message: error.message };
  }

  const acceptances = (await readAcceptanceRecords()).filter(
    (acceptance) => acceptance.match_id === matchId,
  );
  const isFinalized = acceptances.length >= 4;

  if (isFinalized) {
    const { error: updateError } = await supabase
      .from("matches")
      .update({ status: "finalizado" })
      .eq("id", matchId);

    if (updateError) {
      return { ok: false as const, message: updateError.message };
    }
  }

  const updatedMatch = {
    ...match,
    finalizationAcceptedBy: [...new Set([...match.finalizationAcceptedBy, player.email])],
    status: isFinalized ? "finalizado" as const : "por_jugar" as const,
  };

  if (isFinalized) {
    const tournamentMatches = (await readMatches()).filter(
      (entry) => entry.tournamentId === tournament.id,
    );
    if (tournamentMatches.length && tournamentMatches.every((entry) => entry.status === "finalizado")) {
      await supabase.from("tournaments").update({ status: "finalizado" }).eq("id", tournament.id);
    }
  }

  return {
    ok: true as const,
    match: updatedMatch,
    message: isFinalized
      ? "All 4 players accepted the result. Match finished."
      : `Result accepted. ${4 - acceptances.length} players still missing.`,
  };
}

export async function updateMatchSetGames(
  matchId: string,
  player: SessionPlayer,
  setId: string,
  pair: "pairA" | "pairB",
  games: number,
) {
  requireSupabaseEnv();

  const match = (await readMatches()).find((entry) => entry.id === matchId);
  const tournament = (await readTournaments()).find((entry) => entry.id === match?.tournamentId);

  if (!match || !tournament) {
    return { ok: false as const, message: "We could not find this match." };
  }

  if (!match.playerEmails.includes(player.email)) {
    return { ok: false as const, message: "Only players in this match can edit sets." };
  }

  if (tournament.status === "finalizado") {
    return { ok: false as const, message: "This tournament is already finished and cannot be changed." };
  }

  if (match.status === "finalizado") {
    return { ok: false as const, message: "This match is already finished and cannot be changed." };
  }

  const hadAcceptedResults = match.finalizationAcceptedBy.length > 0;
  const column = pair === "pairA" ? "pair_a_games" : "pair_b_games";
  const nextGames = Math.min(99, Math.max(0, Math.trunc(Number(games) || 0)));
  const { error } = await supabase.from("match_sets").update({ [column]: nextGames }).eq("id", setId);

  if (error) {
    return { ok: false as const, message: error.message };
  }

  await supabase.from("match_acceptances").delete().eq("match_id", matchId);
  await supabase.from("matches").update({ status: "por_jugar" }).eq("id", matchId);

  return {
    ok: true as const,
    match: {
      ...match,
      finalizationAcceptedBy: [],
      status: "por_jugar" as const,
    },
    message: hadAcceptedResults
      ? `${player.name} changed the score. Acceptances were reset so players can confirm the new result.`
      : "Set updated.",
  };
}

export async function addMatchSet(matchId: string, player: SessionPlayer) {
  requireSupabaseEnv();

  const match = (await readMatches()).find((entry) => entry.id === matchId);
  const tournament = (await readTournaments()).find((entry) => entry.id === match?.tournamentId);

  if (!match || !tournament) {
    return { ok: false as const, message: "We could not find this match." };
  }

  if (!match.playerEmails.includes(player.email)) {
    return { ok: false as const, message: "Only players in this match can add sets." };
  }

  if (tournament.status === "finalizado") {
    return { ok: false as const, message: "This tournament is already finished and cannot be changed." };
  }

  if (match.status === "finalizado") {
    return { ok: false as const, message: "This match is already finished and cannot be changed." };
  }

  if (match.sets.length >= 5) {
    return { ok: false as const, message: "A match can have up to 5 sets." };
  }

  const { error } = await supabase.from("match_sets").insert({
    match_id: matchId,
    set_number: match.sets.length + 1,
  });

  if (error) {
    return { ok: false as const, message: error.message };
  }

  await supabase.from("match_acceptances").delete().eq("match_id", matchId);
  await supabase.from("matches").update({ status: "por_jugar" }).eq("id", matchId);

  return {
    ok: true as const,
    match,
    message: match.finalizationAcceptedBy.length > 0
      ? `${player.name} changed the score. Acceptances were reset so players can confirm the new result.`
      : "Set added.",
  };
}

export async function deleteMatchSet(matchId: string, player: SessionPlayer, setId: string) {
  requireSupabaseEnv();

  const match = (await readMatches()).find((entry) => entry.id === matchId);
  const tournament = (await readTournaments()).find((entry) => entry.id === match?.tournamentId);

  if (!match || !tournament) {
    return { ok: false as const, message: "We could not find this match." };
  }

  if (!match.playerEmails.includes(player.email)) {
    return { ok: false as const, message: "Only players in this match can delete sets." };
  }

  if (tournament.status === "finalizado") {
    return { ok: false as const, message: "This tournament is already finished and cannot be changed." };
  }

  if (match.status === "finalizado") {
    return { ok: false as const, message: "This match is already finished and cannot be changed." };
  }

  if (match.sets.length <= 1) {
    return { ok: false as const, message: "A match must have at least 1 set." };
  }

  const { error } = await supabase.from("match_sets").delete().eq("id", setId);

  if (error) {
    return { ok: false as const, message: error.message };
  }

  const remainingSets = (await readSetRecords())
    .filter((set) => set.match_id === matchId)
    .sort((setA, setB) => setA.set_number - setB.set_number);

  for (const [index, set] of remainingSets.entries()) {
    await supabase.from("match_sets").update({ set_number: index + 1 }).eq("id", set.id);
  }

  await supabase.from("match_acceptances").delete().eq("match_id", matchId);
  await supabase.from("matches").update({ status: "por_jugar" }).eq("id", matchId);

  return {
    ok: true as const,
    match,
    message: match.finalizationAcceptedBy.length > 0
      ? `${player.name} changed the score. Acceptances were reset so players can confirm the new result.`
      : "Set deleted.",
  };
}

export async function updateTournamentCreationPermission(
  targetEmail: string,
  actor: SessionPlayer,
  canCreate: boolean,
) {
  requireSupabaseEnv();

  if (actor.role !== "super") {
    return { ok: false as const, message: "Only a super user can change permissions." };
  }

  const nextRole: PlayerRole = canCreate ? "organizer" : "player";
  const { data, error } = await supabase
    .from("profiles")
    .update({ role: nextRole })
    .eq("email", targetEmail.trim().toLowerCase())
    .neq("role", "super")
    .select("email, name, gender, role")
    .single();

  if (error) {
    return { ok: false as const, message: error.message };
  }

  const player = toRegisteredPlayer({
    email: data.email,
    name: data.name,
    gender: normalizeGender(data.gender),
    role: normalizeRole(data.role),
  });

  return {
    ok: true as const,
    player,
    message: canCreate
      ? `${player.name} can now create tournaments.`
      : `${player.name} can no longer create tournaments.`,
  };
}

export const savePlayers = localTennisStore.savePlayers;
export const saveTournaments = localTennisStore.saveTournaments;
export const saveMatches = localTennisStore.saveMatches;
