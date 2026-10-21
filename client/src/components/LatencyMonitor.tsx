import { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";

export default function LatencyMonitor({ socket }: { socket: Socket | null }) {
  const [latency, setLatency] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!socket) {
      setConnected(false);
      setLatency(null);
      return;
    }

    let active = true;
    let pendingPingId: number | null = null;
    let nextPingId = 0;
    let responseTimeout: number | undefined;

    const sendPing = () => {
      if (!active || !socket.connected || pendingPingId !== null) return;

      const pingId = ++nextPingId;
      pendingPingId = pingId;
      const startedAt = performance.now();
      responseTimeout = window.setTimeout(() => {
        if (pendingPingId !== pingId) return;
        pendingPingId = null;
        responseTimeout = undefined;
        if (active) setLatency(null);
      }, 1500);

      socket.emit("ping_latency", () => {
        if (!active || pendingPingId !== pingId) return;
        pendingPingId = null;
        if (responseTimeout !== undefined) window.clearTimeout(responseTimeout);
        responseTimeout = undefined;
        setLatency(Math.round(performance.now() - startedAt));
      });
    };

    const onConnect = () => {
      setConnected(true);
      sendPing();
    };
    const onDisconnect = () => {
      setConnected(false);
      setLatency(null);
      pendingPingId = null;
      if (responseTimeout !== undefined) window.clearTimeout(responseTimeout);
    };

    setConnected(socket.connected);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    if (socket.connected) sendPing();
    const interval = window.setInterval(sendPing, 2000);

    return () => {
      active = false;
      window.clearInterval(interval);
      if (responseTimeout !== undefined) window.clearTimeout(responseTimeout);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [socket]);

  const value = !connected ? "Offline" : latency === null ? "..." : `${latency} ms`;

  return (
    <span
      aria-live="polite"
      title="Socket.IO round-trip time"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        color: connected ? "#a1a1aa" : "#71717a",
        fontFamily: "monospace",
        fontSize: "11px",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ color: connected ? "#4ade80" : "#71717a" }}>●</span>
      RTT {value}
    </span>
  );
}