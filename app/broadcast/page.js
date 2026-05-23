"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export default function BroadcastPage() {
  const videoRef = useRef(null);
  const peerRef = useRef(null);
  const streamRef = useRef(null);
  const connectionsRef = useRef([]);

  const [roomCode, setRoomCode] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [facingMode, setFacingMode] = useState("environment");

  // Generate a random room code
  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  };

  const startBroadcast = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });

      streamRef.current = stream;

      // Create PeerJS peer
      const { Peer } = await import("peerjs");
      const code = generateCode();
      const peerId = `streampulse-${code}`;

      const peer = new Peer(peerId, {
        debug: 0,
      });

      peerRef.current = peer;

      peer.on("open", () => {
        setRoomCode(code);
        setIsLive(true);
        setIsLoading(false);
      });

      peer.on("call", (call) => {
        // Answer with our media stream
        call.answer(stream);
        connectionsRef.current.push(call);
        setViewerCount((prev) => prev + 1);

        call.on("close", () => {
          connectionsRef.current = connectionsRef.current.filter(
            (c) => c !== call
          );
          setViewerCount((prev) => Math.max(0, prev - 1));
        });

        call.on("error", () => {
          connectionsRef.current = connectionsRef.current.filter(
            (c) => c !== call
          );
          setViewerCount((prev) => Math.max(0, prev - 1));
        });
      });

      peer.on("error", (err) => {
        console.error("Peer error:", err);
        if (err.type === "unavailable-id") {
          setError("Room code already taken. Please try again.");
        } else {
          setError("Connection error. Please try again.");
        }
        setIsLoading(false);
      });
    } catch (err) {
      console.error("Failed to start broadcast:", err);
      if (err.name === "NotAllowedError") {
        setError("Camera access denied. Please allow camera permissions.");
      } else if (err.name === "NotFoundError") {
        setError("No camera found on this device.");
      } else {
        setError("Failed to start camera. Please try again.");
      }
      setIsLoading(false);
    }
  }, [facingMode]);

  const stopBroadcast = useCallback(() => {
    // Close all connections
    connectionsRef.current.forEach((conn) => conn.close());
    connectionsRef.current = [];

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Destroy peer
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsLive(false);
    setRoomCode("");
    setViewerCount(0);
  }, []);

  const switchCamera = useCallback(async () => {
    const newMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newMode);

    if (streamRef.current) {
      // Stop current video tracks
      streamRef.current.getVideoTracks().forEach((track) => track.stop());

      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: newMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: true,
        });

        // Replace tracks
        const newVideoTrack = newStream.getVideoTracks()[0];
        const oldAudioTrack = streamRef.current.getAudioTracks()[0];

        // Create new stream with old audio + new video
        const combinedStream = new MediaStream();
        combinedStream.addTrack(newVideoTrack);
        if (oldAudioTrack) combinedStream.addTrack(oldAudioTrack);

        streamRef.current = combinedStream;
        if (videoRef.current) {
          videoRef.current.srcObject = combinedStream;
        }

        // Replace track on all existing connections
        connectionsRef.current.forEach((call) => {
          const sender = call.peerConnection
            ?.getSenders()
            .find((s) => s.track?.kind === "video");
          if (sender) {
            sender.replaceTrack(newVideoTrack);
          }
        });
      } catch (err) {
        console.error("Failed to switch camera:", err);
      }
    }
  }, [facingMode]);

  const copyCode = useCallback(() => {
    const shareUrl = `${window.location.origin}/watch/${roomCode}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [roomCode]);

  // Assign stream to video element once it mounts
  useEffect(() => {
    if (isLive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isLive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h2>{isLive ? "You're Live!" : "Start Broadcasting"}</h2>
        <p>
          {isLive
            ? "Share the room code with your viewers"
            : "Open your camera and go live"}
        </p>
      </div>

      {error && (
        <div
          className="glass-card"
          style={{
            borderColor: "var(--danger)",
            color: "var(--danger)",
            textAlign: "center",
            padding: "1rem 2rem",
            fontSize: "0.9rem",
          }}
        >
          {error}
        </div>
      )}

      {isLive ? (
        <>
          {/* Video */}
          <div className="video-wrapper">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
            />
            <div className="video-overlay">
              <div className="live-badge">
                <span className="live-dot" />
                LIVE
              </div>
              <div className="viewer-count">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                </svg>
                {viewerCount}
              </div>
            </div>
          </div>

          {/* Room Code */}
          <div className="room-code-display">
            <span className="room-code-label">Room Code</span>
            <div className="room-code-value">
              <span className="room-code-text">{roomCode}</span>
              <button
                className={`copy-btn ${copied ? "copied" : ""}`}
                onClick={copyCode}
                title="Copy share link"
                id="copy-room-code"
              >
                {copied ? "✓" : "📋"}
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="controls-bar">
            <button
              className="btn btn-ghost btn-icon"
              onClick={switchCamera}
              title="Switch camera"
              id="switch-camera-btn"
            >
              🔄
            </button>
            <button
              className="btn btn-danger btn-lg"
              onClick={stopBroadcast}
              id="stop-broadcast-btn"
            >
              ⏹ Stop Broadcasting
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Placeholder */}
          <div className="video-placeholder">
            {isLoading ? (
              <>
                <div className="spinner" />
                <span className="placeholder-text">Starting camera...</span>
              </>
            ) : (
              <>
                <span className="placeholder-icon">📹</span>
                <span className="placeholder-text">
                  Your camera preview will appear here
                </span>
              </>
            )}
          </div>

          <button
            className="btn btn-primary btn-lg"
            onClick={startBroadcast}
            disabled={isLoading}
            id="start-broadcast-btn"
          >
            {isLoading ? "Starting..." : "🔴 Go Live"}
          </button>
        </>
      )}
    </div>
  );
}
