import * as localTennisStore from "./local-tennis-store";
import * as supabaseTennisStore from "./supabase-tennis-store";

export type {
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

export type TennisStore = {
  MAX_TOURNAMENTS_PER_CREATOR: typeof localTennisStore.MAX_TOURNAMENTS_PER_CREATOR;
  getTournamentCloseRestriction: typeof localTennisStore.getTournamentCloseRestriction;
  formatGender: typeof localTennisStore.formatGender;
  formatPlayerRole: typeof localTennisStore.formatPlayerRole;
  formatTournamentStatus: typeof localTennisStore.formatTournamentStatus;
  formatMatchStatus: typeof localTennisStore.formatMatchStatus;
  readPlayers: typeof localTennisStore.readPlayers;
  canCreateTournaments: typeof localTennisStore.canCreateTournaments;
  savePlayers: typeof localTennisStore.savePlayers;
  readTournamentPlayers: typeof localTennisStore.readTournamentPlayers;
  readSession: typeof localTennisStore.readSession;
  saveSession: typeof localTennisStore.saveSession;
  readTournaments: typeof localTennisStore.readTournaments;
  saveTournaments: typeof localTennisStore.saveTournaments;
  readMatches: typeof localTennisStore.readMatches;
  saveMatches: typeof localTennisStore.saveMatches;
  calculateTournamentStandings: typeof localTennisStore.calculateTournamentStandings;
  createPlayer: typeof localTennisStore.createPlayer;
  verifyPlayerEmail: typeof localTennisStore.verifyPlayerEmail;
  loginPlayer: typeof localTennisStore.loginPlayer;
  createTournament: typeof localTennisStore.createTournament;
  deleteTournament: typeof localTennisStore.deleteTournament;
  joinTournament: typeof localTennisStore.joinTournament;
  assignTournamentPlayer: typeof localTennisStore.assignTournamentPlayer;
  updateTournamentStatus: typeof localTennisStore.updateTournamentStatus;
  updateMatchStatus: typeof localTennisStore.updateMatchStatus;
  updateMatchSetGames: typeof localTennisStore.updateMatchSetGames;
  addMatchSet: typeof localTennisStore.addMatchSet;
  deleteMatchSet: typeof localTennisStore.deleteMatchSet;
  updatePlayerProfile: typeof localTennisStore.updatePlayerProfile;
  updateTournamentCreationPermission: typeof localTennisStore.updateTournamentCreationPermission;
};

export type TennisStoreProvider = "local" | "supabase";

const tennisStoreProviders = {
  local: localTennisStore,
  supabase: supabaseTennisStore as unknown as TennisStore,
} satisfies Record<TennisStoreProvider, TennisStore>;

function getActiveTennisStoreProvider(): TennisStoreProvider {
  return import.meta.env.VITE_TENNIS_STORE_PROVIDER === "supabase" ? "supabase" : "local";
}

export const activeTennisStoreProvider = getActiveTennisStoreProvider();
export const tennisStore = tennisStoreProviders[activeTennisStoreProvider];

export const {
  MAX_TOURNAMENTS_PER_CREATOR,
  addMatchSet,
  calculateTournamentStandings,
  createPlayer,
  createTournament,
  deleteMatchSet,
  deleteTournament,
  assignTournamentPlayer,
  canCreateTournaments,
  formatGender,
  formatMatchStatus,
  formatPlayerRole,
  formatTournamentStatus,
  getTournamentCloseRestriction,
  joinTournament,
  loginPlayer,
  readMatches,
  readPlayers,
  readSession,
  readTournamentPlayers,
  readTournaments,
  saveMatches,
  savePlayers,
  saveSession,
  saveTournaments,
  updateMatchSetGames,
  updateMatchStatus,
  updatePlayerProfile,
  updateTournamentCreationPermission,
  updateTournamentStatus,
  verifyPlayerEmail,
} = tennisStore;
