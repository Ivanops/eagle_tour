"use client";

import { FormEvent, useEffect, useState } from "react";

type AuthMode = "login" | "register";

type RegisteredPlayer = {
  email: string;
  password: string;
  verified: boolean;
  verificationCode: string;
  name: string;
};

type SessionPlayer = {
  email: string;
  verified: boolean;
  name: string;
};

const STORAGE_KEYS = {
  players: "tennis-app.players",
  session: "tennis-app.session",
} as const;

const defaultPlayers: RegisteredPlayer[] = [
  {
    email: "lucia@tennisapp.com",
    password: "demo1234",
    verified: true,
    verificationCode: "482913",
    name: "Lucia Navarro",
  },
];

const upcomingTournaments = [
  { name: "Madrid Clay Masters", date: "12 Apr 2026", status: "Semifinales" },
  { name: "Barcelona Open Series", date: "21 Apr 2026", status: "Inscripta" },
  { name: "Roma Spring Cup", date: "04 May 2026", status: "Pendiente" },
];

const upcomingMatches = [
  { rival: "Maya Brooks", time: "Hoy 18:30", court: "Center Court" },
  { rival: "Naomi Sato", time: "Manana 16:00", court: "Court 2" },
];

function readPlayers(): RegisteredPlayer[] {
  if (typeof window === "undefined") {
    return defaultPlayers;
  }

  const raw = window.localStorage.getItem(STORAGE_KEYS.players);

  if (!raw) {
    window.localStorage.setItem(STORAGE_KEYS.players, JSON.stringify(defaultPlayers));
    return defaultPlayers;
  }

  try {
    return JSON.parse(raw) as RegisteredPlayer[];
  } catch {
    window.localStorage.setItem(STORAGE_KEYS.players, JSON.stringify(defaultPlayers));
    return defaultPlayers;
  }
}

function savePlayers(players: RegisteredPlayer[]) {
  window.localStorage.setItem(STORAGE_KEYS.players, JSON.stringify(players));
}

function readSession(): SessionPlayer | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEYS.session);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as SessionPlayer;
  } catch {
    return null;
  }
}

function saveSession(player: SessionPlayer | null) {
  if (!player) {
    window.localStorage.removeItem(STORAGE_KEYS.session);
    return;
  }

  window.localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(player));
}

function makeCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function AuthExperience() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [session, setSession] = useState<SessionPlayer | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [verificationInput, setVerificationInput] = useState("");
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("");
  const [notice, setNotice] = useState("Usa lucia@tennisapp.com / demo1234 para entrar rapido.");

  useEffect(() => {
    const currentSession = readSession();
    if (currentSession) {
      setSession(currentSession);
    }
  }, []);

  function resetForm(keepEmail = false) {
    setPassword("");
    setName("");
    setVerificationInput("");
    if (!keepEmail) {
      setEmail("");
    }
  }

  function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const players = readPlayers();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password.trim() || !name.trim()) {
      setNotice("Completa nombre, email y password para registrarte.");
      return;
    }

    if (players.some((player) => player.email === normalizedEmail)) {
      setNotice("Ese email ya existe. Prueba iniciar sesion.");
      setMode("login");
      return;
    }

    const verificationCode = makeCode();
    const player: RegisteredPlayer = {
      email: normalizedEmail,
      password,
      verified: false,
      verificationCode,
      name: name.trim(),
    };

    const nextPlayers = [...players, player];
    savePlayers(nextPlayers);
    setPendingVerificationEmail(normalizedEmail);
    setNotice(`Cuenta creada. Codigo mock enviado: ${verificationCode}`);
    setMode("login");
    resetForm(true);
  }

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const players = readPlayers();
    const normalizedEmail = email.trim().toLowerCase();
    const player = players.find((entry) => entry.email === normalizedEmail);

    if (!player || player.password !== password) {
      setNotice("Credenciales invalidas. Revisa email y password.");
      return;
    }

    if (!player.verified) {
      setPendingVerificationEmail(player.email);
      setNotice(
        `Tu email aun no fue verificado. Ingresa el codigo mock ${player.verificationCode} abajo.`,
      );
      return;
    }

    const nextSession: SessionPlayer = {
      email: player.email,
      verified: player.verified,
      name: player.name,
    };

    saveSession(nextSession);
    setSession(nextSession);
    setNotice(`Sesion iniciada. Bienvenido, ${player.name}.`);
    resetForm();
  }

  function handleVerifyEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const players = readPlayers();
    const playerIndex = players.findIndex(
      (entry) => entry.email === pendingVerificationEmail.toLowerCase(),
    );

    if (playerIndex === -1) {
      setNotice("No encontramos un jugador pendiente de verificacion.");
      return;
    }

    if (players[playerIndex].verificationCode !== verificationInput.trim()) {
      setNotice("Codigo incorrecto. Usa el codigo mock mostrado en la app.");
      return;
    }

    const updatedPlayer: RegisteredPlayer = {
      ...players[playerIndex],
      verified: true,
    };

    const nextPlayers = [...players];
    nextPlayers[playerIndex] = updatedPlayer;
    savePlayers(nextPlayers);

    const nextSession: SessionPlayer = {
      email: updatedPlayer.email,
      verified: true,
      name: updatedPlayer.name,
    };

    saveSession(nextSession);
    setSession(nextSession);
    setPendingVerificationEmail("");
    setVerificationInput("");
    setNotice("Email verificado y sesion iniciada correctamente.");
  }

  function handleLogout() {
    saveSession(null);
    setSession(null);
    setNotice("Sesion cerrada.");
  }

  return (
    <main className="page-shell">
      <section className="auth-hero">
        <div className="hero-copy auth-copy">
          <p className="eyebrow">TennisApp player access</p>
          <h1>Login, registro y verificacion mock para tus torneos.</h1>
          <p className="hero-text">
            Esta historia ya permite registrar jugadores, validar email con codigo
            simulado y mantener la sesion abierta para volver a la app sin loguearte
            en cada visita.
          </p>
          <div className="hero-badges">
            <span>Mock auth</span>
            <span>Email verification</span>
            <span>Persistent session</span>
          </div>
        </div>

        <div className="auth-card">
          {!session ? (
            <>
              <div className="auth-switch">
                <button
                  className={mode === "login" ? "switch-button active" : "switch-button"}
                  onClick={() => setMode("login")}
                  type="button"
                >
                  Login
                </button>
                <button
                  className={mode === "register" ? "switch-button active" : "switch-button"}
                  onClick={() => setMode("register")}
                  type="button"
                >
                  Register
                </button>
              </div>

              {mode === "login" ? (
                <form className="auth-form" onSubmit={handleLogin}>
                  <label>
                    Email
                    <input
                      autoComplete="email"
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="player@email.com"
                      type="email"
                      value={email}
                    />
                  </label>
                  <label>
                    Password
                    <input
                      autoComplete="current-password"
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Tu password"
                      type="password"
                      value={password}
                    />
                  </label>
                  <button className="primary-button submit-button" type="submit">
                    Entrar a mi cuenta
                  </button>
                </form>
              ) : (
                <form className="auth-form" onSubmit={handleRegister}>
                  <label>
                    Nombre
                    <input
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Nombre del jugador"
                      type="text"
                      value={name}
                    />
                  </label>
                  <label>
                    Email
                    <input
                      autoComplete="email"
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="player@email.com"
                      type="email"
                      value={email}
                    />
                  </label>
                  <label>
                    Password
                    <input
                      autoComplete="new-password"
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Crea tu password"
                      type="password"
                      value={password}
                    />
                  </label>
                  <button className="primary-button submit-button" type="submit">
                    Crear cuenta
                  </button>
                </form>
              )}

              <p className="notice">{notice}</p>

              {pendingVerificationEmail ? (
                <form className="verification-box" onSubmit={handleVerifyEmail}>
                  <div>
                    <p className="section-kicker">Verificacion</p>
                    <h2>{pendingVerificationEmail}</h2>
                    <p>
                      En esta historia el email es mockeado, asi que puedes usar el
                      codigo mostrado en el mensaje de arriba.
                    </p>
                  </div>
                  <input
                    inputMode="numeric"
                    onChange={(event) => setVerificationInput(event.target.value)}
                    placeholder="Codigo de 6 digitos"
                    type="text"
                    value={verificationInput}
                  />
                  <button className="secondary-button submit-button" type="submit">
                    Verificar email
                  </button>
                </form>
              ) : null}
            </>
          ) : (
            <div className="dashboard-card">
              <p className="eyebrow">Jugador autenticado</p>
              <h2>{session.name}</h2>
              <p className="dashboard-meta">
                {session.email} · {session.verified ? "Email verificado" : "Pendiente"}
              </p>
              <div className="dashboard-actions">
                <button className="secondary-button" onClick={handleLogout} type="button">
                  Cerrar sesion
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="content-grid auth-grid">
        <article className="panel">
          <div className="panel-header">
            <p className="section-kicker">Torneos</p>
            <h2>Mis proximos torneos</h2>
          </div>
          <div className="stack-list">
            {upcomingTournaments.map((tournament) => (
              <div className="info-card" key={tournament.name}>
                <h3>{tournament.name}</h3>
                <p>{tournament.date}</p>
                <span className="form-pill">{tournament.status}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel panel-accent">
          <div className="panel-header">
            <p className="section-kicker">Partidos</p>
            <h2>Mis siguientes cruces</h2>
          </div>
          <div className="stack-list">
            {upcomingMatches.map((match) => (
              <div className="info-card" key={`${match.rival}-${match.time}`}>
                <h3>{match.rival}</h3>
                <p>{match.time}</p>
                <p>{match.court}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <p className="section-kicker">Historia cubierta</p>
            <h2>Acceptance criteria</h2>
          </div>
          <div className="criteria-list">
            <div className="criteria-item">Login y register con email y password</div>
            <div className="criteria-item">Verificacion de email simulada</div>
            <div className="criteria-item">Sesion persistida entre recargas</div>
          </div>
        </article>
      </section>
    </main>
  );
}
