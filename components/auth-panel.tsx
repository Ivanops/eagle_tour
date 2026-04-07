"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  createPlayer,
  loginPlayer,
  PlayerGender,
  readSession,
  SessionPlayer,
  verifyPlayerEmail,
} from "../lib/mock-tennis-store";

type AuthMode = "login" | "register";
type NoticeTone = "success" | "error" | "info";

type AuthPanelProps = {
  onAuthenticated: (session: SessionPlayer) => void;
};

export function AuthPanel({ onAuthenticated }: AuthPanelProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState<PlayerGender | "">("");
  const [verificationInput, setVerificationInput] = useState("");
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("");
  const [notice, setNotice] = useState("Usa lucia@tennisapp.com / demo1234 para entrar rapido.");
  const [noticeTone, setNoticeTone] = useState<NoticeTone>("info");

  useEffect(() => {
    const currentSession = readSession();
    if (currentSession) {
      onAuthenticated(currentSession);
    }
  }, [onAuthenticated]);

  function resetForm(keepEmail = false) {
    setPassword("");
    setName("");
    setGender("");
    setVerificationInput("");
    if (!keepEmail) {
      setEmail("");
    }
  }

  function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password.trim() || !name.trim() || !gender) {
      setNoticeTone("error");
      setNotice("Completa nombre, genero, email y password para registrarte.");
      return;
    }

    const result = createPlayer(name, normalizedEmail, password, gender);

    if (!result.ok) {
      setNoticeTone("error");
      setNotice(result.message);
      setMode("login");
      return;
    }

    setPendingVerificationEmail(result.player.email);
    setNoticeTone("success");
    setNotice(result.message);
    setMode("login");
    resetForm(true);
  }

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = loginPlayer(email, password);

    if (!result.ok) {
      if ("pendingVerificationEmail" in result && result.pendingVerificationEmail) {
        setPendingVerificationEmail(result.pendingVerificationEmail);
      }
      setNoticeTone("error");
      setNotice(result.message);
      return;
    }

    setNoticeTone("success");
    setNotice(result.message);
    resetForm();
    onAuthenticated(result.session);
  }

  function handleVerifyEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = verifyPlayerEmail(pendingVerificationEmail, verificationInput);

    if (!result.ok) {
      setNoticeTone("error");
      setNotice(result.message);
      return;
    }

    setPendingVerificationEmail("");
    setVerificationInput("");
    setNoticeTone("success");
    setNotice(result.message);
    onAuthenticated(result.session);
  }

  return (
    <section className="auth-hero">
      <div className="hero-copy auth-copy">
        <p className="eyebrow">TennisApp player access</p>
        <h1>Login, registro y verificacion mock para tus torneos.</h1>
        <p className="hero-text">
          Entra como jugador, verifica tu email con un codigo simulado y conserva
          tu sesion para volver directo a tus torneos.
        </p>
        <div className="hero-badges">
          <span>Mock auth</span>
          <span>Email verification</span>
          <span>Persistent session</span>
        </div>
      </div>

      <div className="auth-card">
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
            <label>
              Genero
              <select
                onChange={(event) => setGender(event.target.value as PlayerGender | "")}
                value={gender}
              >
                <option value="">Selecciona tu genero</option>
                <option value="femenino">Femenino</option>
                <option value="masculino">Masculino</option>
              </select>
            </label>
            <button className="primary-button submit-button" type="submit">
              Crear cuenta
            </button>
          </form>
        )}

        <p className={`notice notice-${noticeTone}`}>{notice}</p>

        {pendingVerificationEmail ? (
          <form className="verification-box" onSubmit={handleVerifyEmail}>
            <div>
              <p className="section-kicker">Verificacion</p>
              <h2>{pendingVerificationEmail}</h2>
              <p>
                El email esta mockeado, asi que puedes usar el codigo mostrado en el
                mensaje de arriba.
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
      </div>
    </section>
  );
}
