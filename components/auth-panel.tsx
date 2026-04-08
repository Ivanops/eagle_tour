"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  createPlayer,
  loginPlayer,
  PlayerGender,
  readSession,
  SessionPlayer,
  verifyPlayerEmail,
} from "../lib/tennis-store";

type AuthMode = "login" | "register";
type NoticeTone = "success" | "error" | "info";

type AuthPanelProps = {
  onAuthenticated: (session: SessionPlayer) => void;
};

function hasSessionResult(result: unknown): result is { session: SessionPlayer; message: string } {
  return (
    typeof result === "object" &&
    result !== null &&
    "session" in result &&
    typeof (result as { session?: unknown }).session === "object" &&
    (result as { session?: unknown }).session !== null
  );
}

export function AuthPanel({ onAuthenticated }: AuthPanelProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [gender, setGender] = useState<PlayerGender | "">("");
  const [verificationInput, setVerificationInput] = useState("");
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("");
  const [notice, setNotice] = useState("Sign in with your account or create a new one to access your tournaments.");
  const [noticeTone, setNoticeTone] = useState<NoticeTone>("info");

  useEffect(() => {
    const currentSession = readSession();
    if (currentSession) {
      onAuthenticated(currentSession);
    }
  }, [onAuthenticated]);

  function resetForm(keepEmail = false) {
    setPassword("");
    setShowPassword(false);
    setName("");
    setGender("");
    setVerificationInput("");
    if (!keepEmail) {
      setEmail("");
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password.trim() || !name.trim() || !gender) {
      setNoticeTone("error");
      setNotice("Complete name, gender, email, and password to sign up.");
      return;
    }

    const result = await createPlayer(name, normalizedEmail, password, gender);

    if (!result.ok) {
      setNoticeTone("error");
      setNotice(result.message);
      setMode("login");
      return;
    }

    if (hasSessionResult(result)) {
      setPendingVerificationEmail("");
      setNoticeTone("success");
      setNotice(result.message);
      resetForm();
      onAuthenticated(result.session);
      return;
    }

    if (!("requiresEmailVerification" in result) || result.requiresEmailVerification !== false) {
      setPendingVerificationEmail(result.player.email);
    } else {
      setPendingVerificationEmail("");
    }

    setNoticeTone("success");
    setNotice(result.message);
    setMode("login");
    resetForm(true);
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await loginPlayer(email, password);

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

  async function handleVerifyEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await verifyPlayerEmail(pendingVerificationEmail, verificationInput);

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
        <p className="eyebrow">Player access</p>
        <h1>Sign in and registration for your tournaments.</h1>
        <p className="hero-text">
          Sign in as a player, create your profile, and keep your session active
          so you can jump back into your tournaments.
        </p>
        <div className="hero-badges">
          <span>Player account</span>
          <span>Editable profile</span>
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
              <span className="password-field">
                <input
                  autoComplete="current-password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Your password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                />
                <button
                  className="password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  type="button"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </span>
            </label>
            <button className="primary-button submit-button" type="submit">
              Sign in
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegister}>
            <label>
              Name
              <input
                onChange={(event) => setName(event.target.value)}
                placeholder="Player name"
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
              <span className="password-field">
                <input
                  autoComplete="new-password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Create your password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                />
                <button
                  className="password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  type="button"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </span>
            </label>
            <label>
              Gender
              <select
                onChange={(event) => setGender(event.target.value as PlayerGender | "")}
                value={gender}
              >
                <option value="">Select your gender</option>
                <option value="femenino">Female</option>
                <option value="masculino">Male</option>
              </select>
            </label>
            <button className="primary-button submit-button" type="submit">
              Create account
            </button>
          </form>
        )}

        <p className={`notice notice-${noticeTone}`}>{notice}</p>

        {pendingVerificationEmail ? (
          <form className="verification-box" onSubmit={handleVerifyEmail}>
            <div>
              <p className="section-kicker">Verification</p>
              <h2>{pendingVerificationEmail}</h2>
              <p>
                Check the confirmation email or enter the code you received to
                finish setting up your account.
              </p>
            </div>
            <input
              inputMode="numeric"
              onChange={(event) => setVerificationInput(event.target.value)}
              placeholder="6-digit code"
              type="text"
              value={verificationInput}
            />
            <button className="secondary-button submit-button" type="submit">
              Verify email
            </button>
          </form>
        ) : null}
      </div>
    </section>
  );
}
