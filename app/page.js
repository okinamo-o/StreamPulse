import Link from "next/link";

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-badge">
          <span>⚡</span>
          <span>Peer-to-Peer • No Sign-Up • Free</span>
        </div>
        <h1>
          Go Live <span className="gradient-text">Instantly</span>
          <br />
          From Your Phone
        </h1>
        <p>
          Open your camera, share a code, and let anyone watch your stream in
          real-time. Zero setup, zero downloads.
        </p>
      </section>

      <div className="choice-grid">
        <Link href="/broadcast" className="glass-card choice-card" id="broadcast-card">
          <div className="choice-icon">📹</div>
          <h3>Start Broadcasting</h3>
          <p>Open your camera and go live. Share the room code with your viewers.</p>
        </Link>

        <Link href="/watch" className="glass-card choice-card" id="watch-card">
          <div className="choice-icon">👁️</div>
          <h3>Watch a Stream</h3>
          <p>Enter a room code to watch a live stream in real-time.</p>
        </Link>
      </div>
    </>
  );
}
