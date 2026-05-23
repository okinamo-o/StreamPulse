"use client";

import { useEffect, useRef, useState, useCallback, use } from "react";

export default function WatchStreamPage({ params }) {
  const { roomId } = use(params);
  const videoRef = useRef(null);
  const peerRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const remoteStreamRef = useRef(null);

  const [status, setStatus] = useState("connecting"); // connecting | connected | error | ended
  const [errorMsg, setErrorMsg] = useState("");
  const [isMuted, setIsMuted] = useState(true);

  const connectToStream = useCallback(() => {
    setStatus("connecting");
    setErrorMsg("");

    const initPeer = async () => {
      try {
        const { Peer } = await import("peerjs");

        const peer = new Peer(undefined, {
          debug: 0,
        });

        peerRef.current = peer;

        peer.on("open", () => {
          const broadcasterId = `streampulse-${roomId.toUpperCase()}`;

          // Call the broadcaster
          const call = peer.call(broadcasterId, createEmptyStream());

          if (!call) {
            setStatus("error");
            setErrorMsg("Could not connect to the broadcaster. The stream may have ended.");
            return;
          }

          call.on("stream", (remoteStream) => {
            remoteStreamRef.current = remoteStream;
            setStatus("connected");
          });

          call.on("close", () => {
            setStatus("ended");
          });

          call.on("error", (err) => {
            console.error("Call error:", err);
            setStatus("error");
            setErrorMsg("Connection lost. The stream may have ended.");
          });
        });

        peer.on("error", (err) => {
          console.error("Peer error:", err);
          if (err.type === "peer-unavailable") {
            setStatus("error");
            setErrorMsg(
              "Stream not found. The broadcaster may not be live yet or the code is incorrect."
            );
          } else {
            setStatus("error");
            setErrorMsg("Connection error. Please try again.");
          }
        });

        peer.on("disconnected", () => {
          // Attempt reconnect
          if (peer && !peer.destroyed) {
            peer.reconnect();
          }
        });
      } catch (err) {
        console.error("Failed to connect:", err);
        setStatus("error");
        setErrorMsg("Failed to initialize connection.");
      }
    };

    initPeer();
  }, [roomId]);

  // Create an empty media stream for the call (PeerJS requires a stream to call)
  function createEmptyStream() {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d");
    ctx.fillRect(0, 0, 1, 1);
    const stream = canvas.captureStream(0);
    return stream;
  }

  const retryConnection = useCallback(() => {
    // Cleanup previous peer
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    connectToStream();
  }, [connectToStream]);

  // Assign remote stream to video element once it mounts, then try to unmute
  useEffect(() => {
    if (status === "connected" && videoRef.current && remoteStreamRef.current) {
      videoRef.current.srcObject = remoteStreamRef.current;
      // Start muted for autoplay, then try to unmute after a short delay
      videoRef.current.muted = true;
      setIsMuted(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.muted = false;
          videoRef.current.play().then(() => {
            setIsMuted(false);
          }).catch(() => {
            // Browser blocked unmuted autoplay — keep muted
            videoRef.current.muted = true;
            setIsMuted(true);
          });
        }
      }, 300);
    }
  }, [status]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      const newMuted = !videoRef.current.muted;
      videoRef.current.muted = newMuted;
      if (!newMuted) {
        videoRef.current.play().catch(() => {
          videoRef.current.muted = true;
          setIsMuted(true);
        });
      }
      setIsMuted(newMuted);
    }
  }, []);

  useEffect(() => {
    connectToStream();

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
    };
  }, [connectToStream]);

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h2>
          {status === "connected"
            ? "Watching Live"
            : status === "connecting"
            ? "Connecting..."
            : status === "ended"
            ? "Stream Ended"
            : "Stream Unavailable"}
        </h2>
        <p>
          Room: <strong>{roomId.toUpperCase()}</strong>
        </p>
      </div>

      {status === "connected" ? (
        <div className="video-wrapper">
          <video ref={videoRef} autoPlay playsInline muted={isMuted} />
          <div className="video-overlay">
            <div className="live-badge">
              <span className="live-dot" />
              LIVE
            </div>
          </div>
        </div>
      ) : status === "connecting" ? (
        <div className="video-placeholder">
          <div className="spinner" />
          <span className="placeholder-text">Connecting to stream...</span>
        </div>
      ) : (
        <div className="video-placeholder">
          <span className="placeholder-icon">
            {status === "ended" ? "👋" : "❌"}
          </span>
          <span className="placeholder-text">{errorMsg}</span>
          <button
            className="btn btn-primary"
            onClick={retryConnection}
            id="retry-connection-btn"
            style={{ marginTop: "1rem" }}
          >
            🔄 Retry
          </button>
        </div>
      )}

      {status === "connected" && (
        <div className="controls-bar">
          <button
            className="btn btn-ghost btn-icon"
            onClick={toggleMute}
            title={isMuted ? "Unmute" : "Mute"}
            id="toggle-mute-btn"
          >
            {isMuted ? "🔇" : "🔊"}
          </button>
          <div className="status">
            <span className="status-dot connected" />
            <span>Connected</span>
          </div>
        </div>
      )}
    </div>
  );
}
