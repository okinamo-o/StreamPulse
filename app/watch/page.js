"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WatchPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleJoin = (e) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) {
      setError("Please enter a valid room code");
      return;
    }
    setError("");
    router.push(`/watch/${trimmed}`);
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h2>Watch a Stream</h2>
        <p>Enter the room code shared by the broadcaster</p>
      </div>

      <form className="watch-form" onSubmit={handleJoin}>
        <div className="glass-card" style={{ width: "100%", textAlign: "center" }}>
          <div className="input-group" style={{ marginBottom: "1.5rem" }}>
            <label className="input-label" htmlFor="room-code-input">
              Room Code
            </label>
            <input
              id="room-code-input"
              type="text"
              className="input input-code"
              placeholder="ABC123"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError("");
              }}
              maxLength={8}
              autoFocus
              autoComplete="off"
            />
          </div>

          {error && (
            <p
              style={{
                color: "var(--danger)",
                fontSize: "0.85rem",
                marginBottom: "1rem",
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: "100%" }}
            id="join-stream-btn"
          >
            👁️ Join Stream
          </button>
        </div>
      </form>
    </div>
  );
}
