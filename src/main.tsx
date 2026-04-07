import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { MatchDetail } from "../components/match-detail";
import { PlayerPage } from "../components/player-page";
import { TournamentDetail } from "../components/tournament-detail";
import { TournamentsHome } from "../components/tournaments-home";
import "../app/globals.css";

function usePathname() {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    function handleNavigation() {
      setPathname(window.location.pathname);
    }

    window.addEventListener("popstate", handleNavigation);
    window.addEventListener("app:navigate", handleNavigation);

    return () => {
      window.removeEventListener("popstate", handleNavigation);
      window.removeEventListener("app:navigate", handleNavigation);
    };
  }, []);

  return pathname;
}

function App() {
  const pathname = usePathname();
  const tournamentMatch = pathname.match(/^\/torneos\/([^/]+)$/);
  const matchMatch = pathname.match(/^\/partidos\/([^/]+)$/);

  if (pathname === "/jugador") {
    return <PlayerPage />;
  }

  if (tournamentMatch) {
    return <TournamentDetail tournamentId={decodeURIComponent(tournamentMatch[1])} />;
  }

  if (matchMatch) {
    return <MatchDetail matchId={decodeURIComponent(matchMatch[1])} />;
  }

  return <TournamentsHome />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
