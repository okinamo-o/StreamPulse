import "./globals.css";

export const metadata = {
  title: "StreamPulse — Live Camera Streaming",
  description:
    "Stream live from your phone camera to anyone in the world. No downloads, no sign-up — just share a code and go live instantly.",
  keywords: ["live stream", "camera", "webrtc", "peer-to-peer", "broadcast"],
  openGraph: {
    title: "StreamPulse — Go Live Instantly",
    description: "Share your camera feed in real-time with a simple room code.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="app-container">
          <nav className="navbar">
            <a href="/" className="navbar-brand">
              <div className="brand-icon">📡</div>
              <div className="brand-text">
                Stream<span>Pulse</span>
              </div>
            </a>
            <div className="navbar-links">
              <a href="/broadcast" className="nav-link">
                Broadcast
              </a>
              <a href="/watch" className="nav-link">
                Watch
              </a>
            </div>
          </nav>
          <main className="main-content">{children}</main>
        </div>
      </body>
    </html>
  );
}
