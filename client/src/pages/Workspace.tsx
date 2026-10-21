import React, { useState, useEffect, useRef, useContext } from "react";
import { isAxiosError } from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import api, { socketServerUrl } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import CodeEditor from "../components/CodeEditor";
import LatencyMonitor from "../components/LatencyMonitor";

const ExplorerIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
);
const ChatIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
);
const TasksIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
);
const TerminalIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
);
const PaperClipIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
);
const CheckCircleIcon = () => (
  <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
const PhoneIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
);
const MicOffIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth={2} strokeLinecap="round" /></svg>
);
const MicIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-14 0m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
);
const HangUpIcon = () => (
  <svg className="w-4 h-4 rotate-[135deg]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
);
const VideoIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /></svg>
);
const VideoOffIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth={2} strokeLinecap="round" /></svg>
);

type ActivityTab = "explorer" | "chat" | "tasks";

type CallMode = 'audio' | 'video';
type VoicePeer = { name: string; stream: MediaStream | null; muted: boolean; state: string; videoStream: MediaStream | null; videoOff: boolean };

// WebRTC ICE configuration (not exported, so React Fast Refresh keeps working for this file)
const iceServersConfig: RTCConfiguration = {
  iceServers: [
    // 1. STUN servers (direct P2P NAT traversal)
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302'
      ]
    },
    // 2. TURN fallback relay (for strict/symmetric NATs & firewalls)
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ],
  iceCandidatePoolSize: 10
};

const AVATAR_COLORS = ["#1a73e8", "#e8710a", "#188038", "#a142f4", "#d93025", "#12a4af", "#c26401", "#5f6368"];

const avatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

const formatDuration = (total: number) => {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

function useSpeaking(stream: MediaStream | null, ctx: AudioContext | null, disabled: boolean) {
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => {
    if (!stream || !ctx || disabled || stream.getAudioTracks().length === 0) {
      setSpeaking(false);
      return;
    }
    let source: MediaStreamAudioSourceNode | null = null;
    let timer: number | undefined;
    try {
      source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      timer = window.setInterval(() => {
        analyser.getByteTimeDomainData(data);
        let peak = 0;
        for (let i = 0; i < data.length; i++) {
          const v = Math.abs(data[i] - 128);
          if (v > peak) peak = v;
        }
        const next = peak > 10;
        setSpeaking((prev) => (prev === next ? prev : next));
      }, 120);
    } catch {
      setSpeaking(false);
    }
    return () => {
      if (timer) window.clearInterval(timer);
      try { source?.disconnect(); } catch { }
    };
  }, [stream, ctx, disabled]);
  return speaking;
}

function RemoteAudio({ stream }: { stream: MediaStream | null }) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.srcObject = stream;
    if (stream) el.play().catch(() => { });
  }, [stream]);
  return <audio ref={ref} autoPlay playsInline />;
}

function RemoteVideo({ stream }: { stream: MediaStream | null }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.srcObject = stream;
    if (stream) el.play().catch(() => { });
  }, [stream]);
  // muted: audio is already played by <RemoteAudio />, avoids double audio
  return <video ref={ref} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', background: '#000' }} />;
}

function VoiceTile({ name, stream, muted, self, connecting, audioCtx }: { name: string; stream: MediaStream | null; muted: boolean; self: boolean; connecting: boolean; audioCtx: AudioContext | null }) {
  const speaking = useSpeaking(stream, audioCtx, muted);
  const initial = (name.trim()[0] || "?").toUpperCase();
  return (
    <div className={`relative h-24 rounded-lg bg-[#3c4043] flex items-center justify-center transition-shadow ${speaking ? "ring-2 ring-blue-400 shadow-[0_0_14px_rgba(96,165,250,0.55)]" : ""}`}>
      <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold text-white" style={{ backgroundColor: avatarColor(name) }}>{initial}</div>
      <span className="absolute bottom-1 left-1.5 max-w-[85%] truncate text-[10px] text-white bg-black/50 px-1.5 py-0.5 rounded">{self ? `${name} (You)` : name}</span>
      {muted && <span className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1"><MicOffIcon /></span>}
      {connecting && <span className="absolute top-1 left-1.5 text-[9px] text-amber-300">Connecting...</span>}
      {!self && <RemoteAudio stream={stream} />}
    </div>
  );
}

function VideoTile({ name, stream, videoStream, muted, videoOff, self, connecting, audioCtx }: { name: string; stream: MediaStream | null; videoStream: MediaStream | null; muted: boolean; videoOff: boolean; self: boolean; connecting: boolean; audioCtx: AudioContext | null }) {
  const speaking = useSpeaking(stream, audioCtx, muted);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const initial = (name.trim()[0] || "?").toUpperCase();
  const hasVideo = self ? (!!stream && !videoOff) : (!!videoStream && !videoOff);

  // FIX: re-attach the local stream whenever the <video> element is re-created
  // (it unmounts when the camera is turned off, so `hasVideo` must be a dependency)
  useEffect(() => {
    if (!self || !hasVideo || !localVideoRef.current) return;
    localVideoRef.current.srcObject = stream;
    if (stream) localVideoRef.current.play().catch(() => { });
  }, [stream, self, hasVideo]);

  return (
    <div style={{ position: 'relative', height: '130px', borderRadius: '10px', background: '#1a1a1e', overflow: 'hidden', border: speaking ? '2px solid #60a5fa' : '2px solid transparent', transition: 'border-color 150ms', boxShadow: speaking ? '0 0 14px rgba(96,165,250,0.4)' : 'none' }}>
      {hasVideo ? (
        self ? (
          <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000', transform: 'scaleX(-1)' }} />
        ) : (
          <RemoteVideo stream={videoStream} />
        )
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#27272a' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: '#fff', backgroundColor: avatarColor(name) }}>{initial}</div>
        </div>
      )}
      <span style={{ position: 'absolute', bottom: '5px', left: '7px', fontSize: '10px', color: '#fff', background: 'rgba(0,0,0,0.6)', padding: '1px 6px', borderRadius: '4px', maxWidth: '80%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{self ? `${name} (You)` : name}</span>
      <div style={{ position: 'absolute', top: '5px', right: '5px', display: 'flex', gap: '3px' }}>
        {muted && <span style={{ background: 'rgba(239,68,68,0.85)', borderRadius: '50%', padding: '3px', display: 'flex' }}><MicOffIcon /></span>}
        {videoOff && <span style={{ background: 'rgba(239,68,68,0.85)', borderRadius: '50%', padding: '3px', display: 'flex' }}><VideoOffIcon /></span>}
      </div>
      {connecting && <span style={{ position: 'absolute', top: '5px', left: '6px', fontSize: '9px', color: '#fcd34d' }}>Connecting…</span>}
      {!self && <RemoteAudio stream={stream} />}
    </div>
  );
}

export default function Workspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const [project, setProject] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [activeFile, setActiveFile] = useState<any>(null);
  const activeFileRef = useRef<any>(null);
  const [code, setCode] = useState<string>("");
  const [newFileName, setNewFileName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [activeTab, setActiveTab] = useState<ActivityTab>("explorer");
  const [sidePanelOpen, setSidePanelOpen] = useState(true);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  const [socket, setSocket] = useState<Socket | null>(null);

  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatAttachment, setChatAttachment] = useState<File | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [completingMilestoneId, setCompletingMilestoneId] = useState<string | null>(null);
  const [completionNote, setCompletionNote] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; msg: any } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'conversation' | null }>({ type: null });

  const [inVoice, setInVoice] = useState(false);
  const [callMode, setCallMode] = useState<CallMode>('audio');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showCallDropdown, setShowCallDropdown] = useState(false);
  const [voicePeers, setVoicePeers] = useState<Record<string, VoicePeer>>({});
  const [voiceMinimized, setVoiceMinimized] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const localStream = useRef<MediaStream | null>(null);
  const localVideoStream = useRef<MediaStream | null>(null);
  const peers = useRef<{ [socketId: string]: RTCPeerConnection }>({});
  const pendingCandidates = useRef<{ [socketId: string]: RTCIceCandidateInit[] }>({});
  const offerers = useRef<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isMutedRef = useRef(false);
  const isVideoOffRef = useRef(false);
  const callModeRef = useRef<CallMode>('audio');
  const callMenuRef = useRef<HTMLDivElement>(null);
  const userNameRef = useRef("Participant");
  userNameRef.current = auth?.user?.name || "Participant";

  const [terminalOutput, setTerminalOutput] = useState("// Terminal output ready. Click ▶ Run to execute.");
  const [isRunning, setIsRunning] = useState(false);

  const upsertVoicePeer = (peerId: string, patch: Partial<VoicePeer>, fallbackName = "Participant") => {
    setVoicePeers((prev) => ({
      ...prev,
      [peerId]: {
        name: prev[peerId]?.name || fallbackName,
        stream: prev[peerId]?.stream ?? null,
        muted: prev[peerId]?.muted ?? false,
        state: prev[peerId]?.state || "connecting",
        videoStream: prev[peerId]?.videoStream ?? null,
        videoOff: prev[peerId]?.videoOff ?? false,
        ...patch
      }
    }));
  };

  const removeVoicePeer = (peerId: string) => {
    const pc = peers.current[peerId];
    if (pc) {
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      pc.close();
    }
    delete peers.current[peerId];
    delete pendingCandidates.current[peerId];
    offerers.current.delete(peerId);
    setVoicePeers((prev) => {
      const next = { ...prev };
      delete next[peerId];
      return next;
    });
  };

  const teardownVoice = () => {
    Object.keys(peers.current).forEach(removeVoicePeer);
    peers.current = {};
    pendingCandidates.current = {};
    offerers.current.clear();
    localStream.current?.getTracks().forEach((track) => track.stop());
    localStream.current = null;
    localVideoStream.current?.getTracks().forEach((track) => track.stop());
    localVideoStream.current = null;
    isMutedRef.current = false;
    isVideoOffRef.current = false;
    setVoicePeers({});
    setInVoice(false);
    setIsMuted(false);
    setIsVideoOff(false);
    setCallMode('audio');
    callModeRef.current = 'audio';
  };

  const sendSignal = (currentSocket: Socket, targetSocketId: string, signalData: any) => {
    currentSocket.emit("webrtc_signal", { targetSocketId, callerSocketId: currentSocket.id, callerName: userNameRef.current, signalData });
  };

  const createPeerConnection = (targetSocketId: string, currentSocket: Socket, name = "Participant", offerer = false) => {
    const pc = new RTCPeerConnection(iceServersConfig);
    peers.current[targetSocketId] = pc;
    if (offerer) offerers.current.add(targetSocketId);

    // Add every local track (audio, and video when in a video call)
    const local = localStream.current;
    if (local) local.getTracks().forEach((track) => pc.addTrack(track, local));

    pc.onicecandidate = (event) => {
      if (event.candidate) sendSignal(currentSocket, targetSocketId, { candidate: event.candidate.toJSON() });
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0] || new MediaStream([event.track]);
      // Always keep the stream for audio playback; also set videoStream for video tracks
      if (event.track.kind === 'video') {
        upsertVoicePeer(targetSocketId, { stream, videoStream: stream }, name);
      } else {
        upsertVoicePeer(targetSocketId, { stream }, name);
      }
    };

    pc.onconnectionstatechange = async () => {
      upsertVoicePeer(targetSocketId, { state: pc.connectionState }, name);
      if (pc.connectionState === "connected") {
        sendSignal(currentSocket, targetSocketId, { type: "mute", muted: isMutedRef.current });
        sendSignal(currentSocket, targetSocketId, { type: "videoOff", videoOff: isVideoOffRef.current });
      }
      if (pc.connectionState === "failed" && offerers.current.has(targetSocketId) && peers.current[targetSocketId] === pc) {
        try {
          const offer = await pc.createOffer({ iceRestart: true });
          await pc.setLocalDescription(offer);
          sendSignal(currentSocket, targetSocketId, { type: "offer", sdp: offer });
        } catch { }
      }
    };

    upsertVoicePeer(targetSocketId, { state: "connecting", videoStream: null, videoOff: false }, name);
    return pc;
  };

  const flushCandidates = async (peerId: string, pc: RTCPeerConnection) => {
    const queue = pendingCandidates.current[peerId] || [];
    delete pendingCandidates.current[peerId];
    for (const candidate of queue) {
      try { await pc.addIceCandidate(candidate); } catch { }
    }
  };

  useEffect(() => {
    const loadWorkspace = async () => {
      try {
        const projRes = await api.get(`/projects/${id}`);
        setProject(projRes.data);
        const filesRes = await api.get(`/projects/${id}/files`);
        if (filesRes.data.length === 0) {
          const defaultFileRes = await api.post(`/projects/${id}/files`, { name: "main.js", content: 'console.log("Hello from Unified Workspace!");\n' });
          setFiles([defaultFileRes.data]); selectFile(defaultFileRes.data);
        } else {
          setFiles(filesRes.data); selectFile(filesRes.data[0]);
        }
        const msgRes = await api.get(`/projects/${id}/messages`).catch(() => ({ data: [] })); setMessages(msgRes.data);
        const milestoneRes = await api.get(`/projects/${id}/milestones`).catch(() => ({ data: [] })); setMilestones(milestoneRes.data);
      } catch (error) { navigate("/dashboard"); }
    };
    loadWorkspace();
  }, [id, navigate]);

  useEffect(() => {
    if (!id || !auth?.user) return;
    console.info("[Socket.IO] Connecting to:", socketServerUrl);
    const newSocket = io(socketServerUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.info("[Socket.IO] Connected:", newSocket.id);
      newSocket.emit("join_project", id);
    });
    newSocket.on("connect_error", (error) => {
      console.error("[Socket.IO] connect_error:", error.message);
    });
    newSocket.on("disconnect", () => { teardownVoice(); });
    newSocket.on("receive_message", (m) => { setMessages(prev => (m.id !== undefined && prev.some(x => x.id === m.id)) ? prev : [...prev, m]); setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100); });
    newSocket.on("message_deleted", (data) => { if (data.deleteType === 'for_everyone') setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, is_deleted: true, content: '' } : m)); });
    newSocket.on("file_updated", (updatedFile) => {
      setFiles((prev) => prev.map((file) => file.id === updatedFile.id ? updatedFile : file));
      if (activeFileRef.current?.id === updatedFile.id) {
        activeFileRef.current = updatedFile;
        setActiveFile(updatedFile);
        setCode(updatedFile.content ?? "");
      }
    });
    newSocket.on("receive_new_milestone", (m) => setMilestones(prev => prev.some(x => x.id === m.id) ? prev : [...prev, m]));
    newSocket.on("receive_updated_milestone", (um) => setMilestones(prev => prev.map(m => m.id === um.id ? um : m)));

    newSocket.on("user_joined_voice", async (payload: any) => {
      if (!localStream.current) return;
      const targetSocketId: string = typeof payload === "string" ? payload : payload.socketId;
      const name: string = typeof payload === "string" ? "Participant" : payload.userName || "Participant";
      removeVoicePeer(targetSocketId);
      const pc = createPeerConnection(targetSocketId, newSocket, name, true);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendSignal(newSocket, targetSocketId, { type: "offer", sdp: offer });
      } catch (err) {
        console.error("Voice offer failed:", err);
      }
    });

    newSocket.on("user_left_voice", (targetSocketId: string) => {
      removeVoicePeer(targetSocketId);
    });

    newSocket.on("webrtc_signal", async (payload: any) => {
      if (!localStream.current || !payload?.signalData) return;
      const { callerSocketId, callerName, signalData } = payload;
      try {
        if (signalData.type === "mute") {
          upsertVoicePeer(callerSocketId, { muted: !!signalData.muted }, callerName || "Participant");
          return;
        }
        if (signalData.type === "videoOff") {
          upsertVoicePeer(callerSocketId, { videoOff: !!signalData.videoOff }, callerName || "Participant");
          return;
        }
        if (signalData.type === "offer") {
          let pc = peers.current[callerSocketId];
          if (!pc) pc = createPeerConnection(callerSocketId, newSocket, callerName || "Participant", false);
          await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
          await flushCandidates(callerSocketId, pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSignal(newSocket, callerSocketId, { type: "answer", sdp: answer });
        } else if (signalData.type === "answer") {
          const pc = peers.current[callerSocketId];
          if (!pc) return;
          await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
          await flushCandidates(callerSocketId, pc);
        } else if (signalData.candidate) {
          const pc = peers.current[callerSocketId];
          if (pc && pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
          } else {
            const queue = pendingCandidates.current[callerSocketId] || [];
            queue.push(signalData.candidate);
            pendingCandidates.current[callerSocketId] = queue;
          }
        }
      } catch (err) {
        console.error("Signal handling failed:", err);
      }
    });

    return () => {
      newSocket.emit("leave_voice", id);
      teardownVoice();
      newSocket.disconnect();
    };
  }, [id, auth?.user?.id]);

  useEffect(() => {
    if (!inVoice) return;
    setVoiceSeconds(0);
    const timer = window.setInterval(() => setVoiceSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, [inVoice]);

  // Close the call dropdown when clicking anywhere outside it
  useEffect(() => {
    if (!showCallDropdown) return;
    const onDown = (e: MouseEvent) => {
      if (callMenuRef.current && !callMenuRef.current.contains(e.target as Node)) setShowCallDropdown(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showCallDropdown]);

  const startCall = async (mode: CallMode) => {
    setShowCallDropdown(false);
    if (inVoice) {
      socket?.emit("leave_voice", id);
      teardownVoice();
      return;
    }
    if (!socket || !socket.connected) {
      alert("Not connected to the server yet. Please try again in a moment.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Calls need HTTPS (or localhost) and a browser that supports media devices.\n\nIf you opened the app via a LAN IP over http://, the browser blocks the camera/mic. Use localhost or enable HTTPS.");
      return;
    }
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current && AudioCtx) audioCtxRef.current = new AudioCtx();
      audioCtxRef.current?.resume().catch(() => { });

      if (mode === 'video') {
        // Request audio + video together so they share one MediaStream
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
        });
        localStream.current = stream;
        localVideoStream.current = stream;
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          video: false
        });
        localStream.current = stream;
      }

      callModeRef.current = mode;
      isMutedRef.current = false;
      isVideoOffRef.current = false;
      setCallMode(mode);
      setIsMuted(false);
      setIsVideoOff(false);
      setVoiceMinimized(false);
      setInVoice(true);
      socket.emit("join_voice", { projectId: id, userName: userNameRef.current });
    } catch (err: any) {
      if (mode === 'video') {
        alert("Camera or microphone access denied. Please allow permissions and try again.");
      } else {
        alert("Microphone access denied. Please allow microphone permissions to join the voice channel.");
      }
    }
  };

  const toggleVoice = () => startCall(callModeRef.current);

  const toggleCamera = () => {
    const stream = localStream.current;
    if (!stream || !socket) return;
    const nextOff = !isVideoOffRef.current;
    stream.getVideoTracks().forEach((track) => { track.enabled = !nextOff; });
    isVideoOffRef.current = nextOff;
    setIsVideoOff(nextOff);
    Object.keys(peers.current).forEach((peerId) => sendSignal(socket, peerId, { type: "videoOff", videoOff: nextOff }));
  };

  const toggleMute = () => {
    const stream = localStream.current;
    if (!stream || !socket) return;
    const nextMuted = !isMutedRef.current;
    stream.getAudioTracks().forEach((track) => { track.enabled = !nextMuted; });
    isMutedRef.current = nextMuted;
    setIsMuted(nextMuted);
    Object.keys(peers.current).forEach((peerId) => sendSignal(socket, peerId, { type: "mute", muted: nextMuted }));
  };

  const selectFile = async (file: any) => {
    activeFileRef.current = file;
    setActiveFile(file); setCode("// Loading file content...");
    try { const res = await api.get(`/projects/${id}/files/${file.id}`); setCode(res.data.content || ""); }
    catch (err: any) { setCode(`// Error loading file: ${err.message}`); }
  };

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault(); if (!newFileName.trim()) return;
    try {
      const res = await api.post(`/projects/${id}/files`, { name: newFileName.trim(), content: "// New file\n" });
      setFiles(prev => [...prev, res.data]); activeFileRef.current = res.data; setActiveFile(res.data); setCode(res.data.content); setNewFileName("");
    } catch (err) { console.error("Failed to create file:", err); }
  };

  const handleSaveFile = async () => {
    if (!activeFile) return;
    setIsSaving(true);
    try {
      const response = await api.put(`/projects/${id}/files/${activeFile.id}`, { content: code });
      const savedFile = response.data.file;
      activeFileRef.current = savedFile;
      setActiveFile(savedFile);
      setFiles((prev) => prev.map((file) => file.id === savedFile.id ? savedFile : file));
      socket?.emit("file_updated", { projectId: id, file: savedFile });
    } catch (error) {
      console.error("Failed to save file:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunCode = async () => {
    setTerminalOpen(true);
    if (!code || code === "// Loading file content...") { setTerminalOutput("⚠️ Cannot run: File is empty."); return; }
    setIsRunning(true); setTerminalOutput("⚡ Initializing container...");
    try {
      const res = await api.post("/execute", { code, language: activeFile?.name?.endsWith(".py") ? "python" : "javascript" });
      setTerminalOutput(res.data.output || "Process exited with code 0");
    } catch (err: any) { setTerminalOutput(err.response?.data?.error || "Execution engine error."); }
    finally { setIsRunning(false); }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!chatInput.trim() && !chatAttachment) || !socket || !auth?.user) return;
    let attachmentData = null;
    try {
      if (chatAttachment) {
        const base64Data = await new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(chatAttachment); });
        const uploadRes = await api.post(`/projects/${id}/upload`, { fileName: chatAttachment.name, fileData: base64Data, fileType: chatAttachment.type });
        attachmentData = { name: uploadRes.data.name, url: uploadRes.data.url, type: uploadRes.data.type };
      }
      socket.emit("send_message", { projectId: id, userId: auth.user.id, userName: auth.user.name, content: chatInput, attachment: attachmentData });
      setChatInput(""); setChatAttachment(null);
    } catch (error) {
      console.error("Failed to send chat message:", error);
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault(); if (!newMilestoneTitle.trim() || !socket) return;
    try {
      const res = await api.post(`/projects/${id}/milestones`, { title: newMilestoneTitle });
      socket.emit("send_new_milestone", res.data); setMilestones(prev => [...prev, res.data]); setNewMilestoneTitle("");
    } catch (err) { }
  };

  const handleCompleteMilestone = async (milestoneId: string) => {
    if (!socket || !auth?.user) return;
    try {
      const res = await api.put(`/projects/${id}/milestones/${milestoneId}/complete`, { note: completionNote, userId: auth.user.id, userName: auth.user.name });
      socket.emit("send_updated_milestone", res.data);
      setMilestones(prev => prev.map(m => m.id === res.data.id ? res.data : m)); setCompletingMilestoneId(null); setCompletionNote("");
    } catch (err) { }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteStatus("");
    setInviteLoading(true);
    try {
      const response = await api.post(`/projects/${id}/members`, { email: inviteEmail });
      setInviteStatus(response.data.message || 'Invitation email sent successfully.');
      setInviteEmail("");
    } catch (error: unknown) {
      const message = isAxiosError<{ error?: string }>(error)
        ? error.response?.data?.error
        : undefined;
      setInviteStatus(message || 'Could not send the project invitation. Please try again.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleDeleteMessage = async (msg: any, deleteType: 'for_me' | 'for_everyone') => {
    setContextMenu(null);
    try {
      await api.delete(`/projects/${id}/messages/${msg.id}`, { data: { deleteType } });
      if (deleteType === 'for_everyone') { socket?.emit('delete_message', { projectId: id, messageId: msg.id, deleteType }); setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, is_deleted: true, content: '' } : m)); }
      else { setMessages((prev) => prev.filter((m) => m.id !== msg.id)); }
    } catch (err) { }
  };

  const handleDeleteConversation = async () => { setDeleteConfirm({ type: null }); try { await api.delete(`/projects/${id}/messages`); setMessages([]); } catch (err) { } };

  const toggleTab = (tab: ActivityTab) => { if (activeTab === tab && sidePanelOpen) setSidePanelOpen(false); else { setActiveTab(tab); setSidePanelOpen(true); } };

  const voicePeerEntries = Object.entries(voicePeers);
  const voiceCount = voicePeerEntries.length + 1;
  const selfName = auth?.user?.name || "You";

  const UWLogoSmall = () => (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="wlg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#6366f1"/><stop offset="100%" stopColor="#8b5cf6"/></linearGradient>
      </defs>
      <path d="M16 2L28 9V23L16 30L4 23V9L16 2Z" fill="url(#wlg1)" opacity="0.9"/>
      <path d="M11 12V18.5C11 19.88 12.12 21 13.5 21C14.88 21 16 19.88 16 18.5V12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <path d="M16 12V18.5C16 19.88 17.12 21 18.5 21C19.88 21 21 19.88 21 18.5V12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );

  const menuItemStyle: React.CSSProperties = { width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: '12px', color: '#d4d4d8', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '6px', fontFamily: "'Inter',sans-serif", display: 'flex', alignItems: 'center', gap: '10px' };

  return (
    <div style={{ height: '100vh', width: '100vw', background: '#0d0d0f', color: '#e4e4e7', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>
      {/* Header — position/zIndex so the call dropdown always sits above the editor & side panels */}
      <header style={{
        height: '44px', flexShrink: 0,
        position: 'relative', zIndex: 30,
        background: 'rgba(13,13,15,0.97)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div onClick={() => navigate("/dashboard")}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 6px', borderRadius: '8px', transition: 'background 150ms' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <UWLogoSmall />
          </div>
          <span style={{ color: '#3f3f46', fontSize: '13px' }}>/</span>
          <span style={{ fontSize: '12px', color: '#71717a', fontWeight: 500, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {project?.name || 'Loading...'}
          </span>
          {activeFile && (
            <>
              <span style={{ color: '#3f3f46', fontSize: '13px' }}>›</span>
              <span style={{ fontSize: '12px', color: '#a1a1aa' }}>{activeFile.name}</span>
            </>
          )}
          <LatencyMonitor socket={socket} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {inVoice ? (
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)', borderRadius: '8px', overflow: 'hidden' }}>
              <button onClick={toggleMute} style={{ padding: '4px 9px', fontSize: '11px', fontWeight: 600, background: isMuted ? 'rgba(239,68,68,0.4)' : 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: isMuted ? '#fff' : '#f87171', fontFamily: "'Inter', sans-serif" }}>
                {isMuted ? <MicOffIcon /> : <MicIcon />} {isMuted ? 'Muted' : 'Live'}
              </button>
              {callMode === 'video' && (
                <>
                  <div style={{ width: '1px', height: '18px', background: 'rgba(239,68,68,0.2)' }}/>
                  <button onClick={toggleCamera} style={{ padding: '4px 9px', fontSize: '11px', fontWeight: 600, background: isVideoOff ? 'rgba(239,68,68,0.4)' : 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: isVideoOff ? '#fff' : '#f87171', fontFamily: "'Inter', sans-serif" }}>
                    {isVideoOff ? <VideoOffIcon /> : <VideoIcon />}
                  </button>
                </>
              )}
              <div style={{ width: '1px', height: '18px', background: 'rgba(239,68,68,0.2)' }}/>
              <button onClick={toggleVoice} style={{ padding: '4px 9px', fontSize: '11px', fontWeight: 600, border: 'none', background: 'transparent', cursor: 'pointer', color: '#f87171', fontFamily: "'Inter', sans-serif" }}>Leave</button>
            </div>
          ) : (
            // ── Call dropdown: one "Call ▾" button → Voice call / Video call ──
            <div ref={callMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowCallDropdown((v) => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: 500, color: showCallDropdown ? '#fafafa' : '#a1a1aa', cursor: 'pointer', fontFamily: "'Inter', sans-serif", background: showCallDropdown ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '8px', transition: 'all 150ms' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = '#fafafa'; }}
                onMouseLeave={(e) => { if (!showCallDropdown) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#a1a1aa'; } }}
              >
                <PhoneIcon /> Call <span style={{ fontSize: '10px' }}>▾</span>
              </button>
              {showCallDropdown && (
                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: '#1c1c1f', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '10px', boxShadow: '0 10px 40px rgba(0,0,0,0.7)', padding: '4px', minWidth: '170px', zIndex: 200 }}>
                  <button onClick={() => startCall('audio')} style={menuItemStyle}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                  ><PhoneIcon /> Voice call</button>
                  <button onClick={() => startCall('video')} style={menuItemStyle}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                  ><VideoIcon /> Video call</button>
                </div>
              )}
            </div>
          )}

          <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.07)' }}/>

          <button onClick={() => setShowInviteModal(true)} style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600, fontFamily: "'Inter', sans-serif", background: 'transparent', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '8px', color: '#818cf8', cursor: 'pointer', transition: 'all 150ms' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.10)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >+ Invite</button>

          <button onClick={handleSaveFile} style={{ padding: '5px 12px', fontSize: '11px', fontWeight: 500, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '8px', color: '#a1a1aa', cursor: 'pointer', fontFamily: "'Inter', sans-serif", transition: 'all 150ms', display: 'flex', alignItems: 'center', gap: '5px' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = '#fafafa'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#a1a1aa'; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
            </svg>
            {isSaving ? 'Saving...' : 'Save'}
          </button>

          <button onClick={handleRunCode} style={{ padding: '5px 14px', fontSize: '11px', fontWeight: 600, background: isRunning ? 'rgba(34,197,94,0.3)' : 'linear-gradient(135deg, #16a34a, #15803d)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontFamily: "'Inter', sans-serif", boxShadow: isRunning ? 'none' : '0 2px 8px rgba(22,163,74,0.3)', display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 150ms' }}>
            {isRunning ? (
              <><svg style={{ animation: 'ws-spin 1s linear infinite' }} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Running</>
            ) : (
              <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg> Run</>
            )}
          </button>
        </div>
      </header>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>

        {/* ── Activity Bar ─────────────────────────────────────── */}
        <aside style={{ width: '48px', flexShrink: 0, zIndex: 20, background: '#111113', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0', gap: '2px' }}>
          {([
            { tab: 'explorer' as const, icon: <ExplorerIcon />, tip: 'Explorer' },
            { tab: 'chat' as const, icon: <ChatIcon />, tip: 'Team Chat' },
            { tab: 'tasks' as const, icon: <TasksIcon />, tip: 'Milestones' },
          ] as const).map(({ tab, icon, tip }) => {
            const active = activeTab === tab && sidePanelOpen;
            return (
              <button key={tab} onClick={() => toggleTab(tab)} title={tip} style={{ width: '36px', height: '36px', borderRadius: '8px', border: 'none', background: active ? 'rgba(99,102,241,0.15)' : 'transparent', color: active ? '#818cf8' : '#52525b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms' }}
                onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#a1a1aa'; } }}
                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#52525b'; } }}
              >{icon}</button>
            );
          })}
          <div style={{ marginTop: 'auto' }}>
            <button onClick={() => setTerminalOpen(!terminalOpen)} title="Terminal" style={{ width: '36px', height: '36px', borderRadius: '8px', border: 'none', background: terminalOpen ? 'rgba(34,197,94,0.12)' : 'transparent', color: terminalOpen ? '#4ade80' : '#52525b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms' }}
              onMouseEnter={(e) => { if (!terminalOpen) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#a1a1aa'; } }}
              onMouseLeave={(e) => { if (!terminalOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#52525b'; } }}
            ><TerminalIcon /></button>
          </div>
        </aside>

        {/* ── Side Panel ───────────────────────────────────────── */}
        {sidePanelOpen && (
          <div style={{ width: '240px', flexShrink: 0, zIndex: 10, background: '#111113', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column' }}>

            {/* Explorer */}
            {activeTab === 'explorer' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <div style={{ padding: '8px 12px', fontSize: '10px', fontWeight: 700, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Files</div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
                  {files.map((f) => {
                    const isActive = activeFile?.id === f.id;
                    const ext = f.name.split('.').pop() || '';
                    const extColors: Record<string, string> = { js: '#f7df1e', ts: '#3178c6', tsx: '#61dafb', jsx: '#61dafb', py: '#3776ab', css: '#563d7c', json: '#cbcb41', md: '#083fa1' };
                    return (
                      <div key={f.id} onClick={() => selectFile(f)}
                        style={{ padding: '5px 8px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', marginBottom: '1px', background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent', color: isActive ? '#818cf8' : '#a1a1aa', border: isActive ? '1px solid rgba(99,102,241,0.15)' : '1px solid transparent', display: 'flex', alignItems: 'center', gap: '7px', transition: 'all 120ms' }}
                        onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#d4d4d8'; } }}
                        onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a1a1aa'; } }}
                      >
                        <span style={{ fontSize: '9px', color: extColors[ext] || '#71717a', fontWeight: 700, fontFamily: 'monospace', minWidth: '18px', textAlign: 'center' }}>.{ext}</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                      </div>
                    );
                  })}
                </div>
                <form onSubmit={handleCreateFile} style={{ padding: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <input type="text" placeholder="＋ New file..." value={newFileName} onChange={(e) => setNewFileName(e.target.value)}
                    style={{ width: '100%', padding: '5px 8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', fontSize: '11px', color: '#a1a1aa', fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box' }}
                    onFocus={(e) => { e.target.style.borderColor = '#6366f1'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                  />
                </form>
              </div>
            )}

            {/* Chat */}
            {activeTab === 'chat' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <div style={{ padding: '8px 12px', fontSize: '10px', fontWeight: 700, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Team Chat</span>
                  <button onClick={() => setDeleteConfirm({ type: 'conversation' })} title="Clear chat"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#52525b', padding: '2px', borderRadius: '4px', display: 'flex', alignItems: 'center', transition: 'color 150ms' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#52525b'; }}
                  >
                    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
                <div style={{ flex: 1, padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }} onClick={() => setContextMenu(null)}>
                  {messages.map((msg, idx) => {
                    const isSelf = msg.userId === auth?.user?.id;
                    return (
                      <div key={msg.id ?? idx} style={{ display: 'flex', flexDirection: 'column', alignItems: isSelf ? 'flex-end' : 'flex-start' }}
                        onContextMenu={(e) => { if (msg.is_deleted) return; e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, msg }); }}
                      >
                        <span style={{ fontSize: '10px', color: '#52525b', marginBottom: '3px', fontWeight: 500 }}>{msg.userName}</span>
                        {msg.is_deleted ? (
                          <div style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '11px', maxWidth: '85%', background: 'rgba(255,255,255,0.03)', color: '#52525b', fontStyle: 'italic', border: '1px solid rgba(255,255,255,0.05)' }}>Deleted</div>
                        ) : (
                          <div style={{ padding: '7px 10px', borderRadius: '10px', fontSize: '12px', maxWidth: '86%', lineHeight: 1.4, background: isSelf ? 'linear-gradient(135deg,#6366f1,#7c3aed)' : 'rgba(255,255,255,0.06)', color: isSelf ? '#fff' : '#d4d4d8', boxShadow: isSelf ? '0 2px 8px rgba(99,102,241,0.25)' : 'none' }}>
                            {msg.content}
                            {msg.attachment && (
                              <a href={msg.attachment.url} target="_blank" rel="noopener noreferrer" style={{ marginTop: '6px', padding: '5px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '5px', color: '#93c5fd', fontSize: '11px', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <PaperClipIcon /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '110px' }}>{msg.attachment.name}</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>
                {chatAttachment && (
                  <div style={{ padding: '6px 10px', background: 'rgba(99,102,241,0.08)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#818cf8' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📎 {chatAttachment.name}</span>
                    <button onClick={() => setChatAttachment(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717a' }}>✕</button>
                  </div>
                )}
                <form onSubmit={handleSendMessage} style={{ padding: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => setChatAttachment(e.target.files?.[0] || null)} />
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525b', padding: '2px', display: 'flex', transition: 'color 150ms' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#a1a1aa'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#52525b'; }}
                  ><PaperClipIcon /></button>
                  <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Message…"
                    style={{ flex: 1, padding: '6px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px', color: '#d4d4d8', fontFamily: "'Inter', sans-serif", outline: 'none' }}
                    onFocus={(e) => { e.target.style.borderColor = '#6366f1'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                  />
                </form>
              </div>
            )}

            {/* Milestones */}
            {activeTab === 'tasks' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <div style={{ padding: '8px 12px', fontSize: '10px', fontWeight: 700, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Milestones</div>
                <div style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
                  {milestones.length === 0 ? (
                    <p style={{ fontSize: '12px', color: '#52525b', textAlign: 'center', marginTop: '20px', fontStyle: 'italic' }}>No milestones yet.</p>
                  ) : (
                    <div style={{ position: 'relative', paddingLeft: '20px' }}>
                      <div style={{ position: 'absolute', left: '7px', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.08)' }}/>
                      {milestones.map((milestone) => (
                        <div key={milestone.id} style={{ position: 'relative', marginBottom: '18px' }}>
                          <div style={{ position: 'absolute', left: '-17px', top: '3px', width: '9px', height: '9px', borderRadius: '50%', background: milestone.status === 'completed' ? '#22c55e' : '#27272a', border: `2px solid ${milestone.status === 'completed' ? '#22c55e' : '#52525b'}` }}/>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: milestone.status === 'completed' ? '#52525b' : '#d4d4d8', textDecoration: milestone.status === 'completed' ? 'line-through' : 'none', display: 'block', marginBottom: '6px' }}>{milestone.title}</span>
                          {milestone.status === 'completed' ? (
                            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                              <div style={{ fontSize: '10px', color: '#4ade80', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircleIcon /> {milestone.completed_by_name}
                              </div>
                              {milestone.note && <p style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '4px', fontStyle: 'italic', borderLeft: '2px solid rgba(74,222,128,0.25)', paddingLeft: '6px', marginBottom: 0 }}>"{milestone.note}"</p>}
                            </div>
                          ) : (
                            completingMilestoneId === milestone.id ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <input type="text" placeholder="Completion note…" value={completionNote} onChange={(e) => setCompletionNote(e.target.value)}
                                  style={{ width: '100%', padding: '4px 8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', fontSize: '11px', color: '#d4d4d8', fontFamily: "'Inter',sans-serif", outline: 'none', boxSizing: 'border-box' as const }}
                                  onFocus={(e) => { e.target.style.borderColor = '#6366f1'; }} onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                                />
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                  <button onClick={() => setCompletingMilestoneId(null)} style={{ fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer', color: '#71717a', fontFamily: "'Inter',sans-serif" }}>Cancel</button>
                                  <button onClick={() => handleCompleteMilestone(milestone.id)} style={{ fontSize: '11px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', padding: '3px 10px', cursor: 'pointer', fontWeight: 600, fontFamily: "'Inter',sans-serif" }}>Confirm</button>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => setCompletingMilestoneId(milestone.id)}
                                style={{ fontSize: '11px', color: '#71717a', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '3px 10px', cursor: 'pointer', fontFamily: "'Inter',sans-serif", transition: 'all 150ms' }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = '#4ade80'; e.currentTarget.style.borderColor = 'rgba(34,197,94,0.3)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = '#71717a'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                              >Mark complete</button>
                            )
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {project?.owner_id === auth?.user?.id && (
                  <form onSubmit={handleAddMilestone} style={{ padding: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ fontSize: '10px', color: '#52525b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Add Milestone</p>
                    <input type="text" value={newMilestoneTitle} onChange={(e) => setNewMilestoneTitle(e.target.value)} placeholder="Milestone title…"
                      style={{ width: '100%', padding: '5px 8px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.20)', borderRadius: '6px', fontSize: '11px', color: '#d4d4d8', fontFamily: "'Inter',sans-serif", outline: 'none', boxSizing: 'border-box' as const }}
                      onFocus={(e) => { e.target.style.borderColor = '#6366f1'; }}
                      onBlur={(e) => { e.target.style.borderColor = 'rgba(99,102,241,0.20)'; }}
                    />
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Editor + Terminal ──────────────────────────────────── */}
        <main style={{ flex: 1, background: '#111113', display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
          {/* Tab bar */}
          {activeFile && (
            <div style={{ height: '35px', flexShrink: 0, background: '#0d0d0f', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'flex-end', padding: '0 8px', overflowX: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: '#111113', border: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid #111113', borderRadius: '6px 6px 0 0', fontSize: '11px', color: '#c4c4c8', height: '28px' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                {activeFile.name}
              </div>
            </div>
          )}

          {/* Editor */}
          <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
            {activeFile ? (
              <CodeEditor code={code} onChange={(c) => setCode(c || "")} language={activeFile.name.endsWith(".py") ? "python" : "javascript"} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', color: '#3f3f46' }}>
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                <p style={{ fontSize: '13px', color: '#52525b' }}>Select a file from the explorer to start editing</p>
              </div>
            )}
          </div>

          {/* Terminal */}
          {terminalOpen && (
            <div style={{ height: '180px', background: '#090909', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
              <div style={{ padding: '5px 12px', background: '#0d0d0f', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#52525b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <TerminalIcon /> Output
                </div>
                <button onClick={() => setTerminalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525b', fontSize: '16px', lineHeight: 1, display: 'flex' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#a1a1aa'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#52525b'; }}
                >✕</button>
              </div>
              <pre style={{ flex: 1, padding: '10px 14px', overflowY: 'auto', fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: '12px', color: '#4ade80', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{terminalOutput}</pre>
            </div>
          )}
        </main>
      </div>

      {/* ── Call Widget (Voice / Video) ──────────────────────────── */}
      {inVoice && (
        <div style={{ position: 'fixed', bottom: '16px', right: '16px', zIndex: 40, width: callMode === 'video' ? '340px' : '272px', borderRadius: '16px', background: 'rgba(13,13,15,0.96)', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 20px 60px rgba(0,0,0,0.7)', backdropFilter: 'blur(24px)', overflow: 'hidden', transition: 'width 250ms ease' }}>
          {/* Widget header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', flexShrink: 0, animation: 'ws-pulse 1.5s ease-in-out infinite' }}/>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#fafafa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project?.name || (callMode === 'video' ? 'Video call' : 'Voice call')}</span>
              <span style={{ fontSize: '10px', color: '#52525b', background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: '4px', flexShrink: 0 }}>{callMode === 'video' ? '🎥' : '🎙️'}</span>
              <span style={{ fontSize: '11px', color: '#71717a', flexShrink: 0 }}>{formatDuration(voiceSeconds)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <span style={{ fontSize: '11px', color: '#71717a' }}>{voiceCount}</span>
              <button onClick={() => setVoiceMinimized(!voiceMinimized)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717a', fontSize: '14px', display: 'flex' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#fafafa'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#71717a'; }}
              >{voiceMinimized ? '▢' : '–'}</button>
            </div>
          </div>

          {/* Participant tiles */}
          <div style={{ display: voiceMinimized ? 'none' : 'block', padding: '8px' }}>
            {callMode === 'video' ? (
              <div style={{ display: 'grid', gridTemplateColumns: voiceCount === 1 ? '1fr' : '1fr 1fr', gap: '6px' }}>
                <VideoTile name={selfName} stream={localStream.current} videoStream={localStream.current} muted={isMuted} videoOff={isVideoOff} self connecting={false} audioCtx={audioCtxRef.current} />
                {voicePeerEntries.map(([peerId, peer]) => (
                  <VideoTile key={peerId} name={peer.name} stream={peer.stream} videoStream={peer.videoStream} muted={peer.muted} videoOff={peer.videoOff} self={false} connecting={peer.state !== 'connected'} audioCtx={audioCtxRef.current} />
                ))}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: voiceCount === 1 ? '1fr' : '1fr 1fr', gap: '6px' }}>
                <VoiceTile name={selfName} stream={localStream.current} muted={isMuted} self connecting={false} audioCtx={audioCtxRef.current} />
                {voicePeerEntries.map(([peerId, peer]) => (
                  <VoiceTile key={peerId} name={peer.name} stream={peer.stream} muted={peer.muted} self={false} connecting={peer.state !== 'connected'} audioCtx={audioCtxRef.current} />
                ))}
              </div>
            )}
            {voicePeerEntries.length === 0 && <p style={{ fontSize: '11px', color: '#52525b', textAlign: 'center', marginTop: '6px' }}>Waiting for others…</p>}
          </div>

          {/* Hidden audio elements when minimized */}
          {voiceMinimized && voicePeerEntries.map(([peerId, peer]) => (
            <span key={peerId} style={{ display: 'none' }}><RemoteAudio stream={peer.stream} /></span>
          ))}

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'} style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', cursor: 'pointer', background: isMuted ? '#ef4444' : 'rgba(255,255,255,0.08)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms' }}>
              {isMuted ? <MicOffIcon /> : <MicIcon />}
            </button>
            {callMode === 'video' && (
              <button onClick={toggleCamera} title={isVideoOff ? 'Turn camera on' : 'Turn camera off'} style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', cursor: 'pointer', background: isVideoOff ? '#ef4444' : 'rgba(255,255,255,0.08)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms' }}>
                {isVideoOff ? <VideoOffIcon /> : <VideoIcon />}
              </button>
            )}
            <button onClick={toggleVoice} title="Leave call" style={{ width: '44px', height: '36px', borderRadius: '999px', border: 'none', cursor: 'pointer', background: '#ef4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms' }}>
              <HangUpIcon />
            </button>
          </div>
        </div>
      )}

      {/* ── Invite Modal ────────────────────────────────────────── */}
      {showInviteModal && (
        <div onClick={() => setShowInviteModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <form onSubmit={handleInvite} onClick={(e) => e.stopPropagation()} style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px', padding: '28px', width: '320px', boxShadow: '0 20px 60px rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#fafafa', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Invite member</h2>
              <p style={{ fontSize: '12px', color: '#71717a', margin: 0 }}>They'll get access to this project.</p>
            </div>
            <input type="email" placeholder="colleague@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required
              style={{ padding: '9px 12px', background: '#111113', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fafafa', fontSize: '13px', fontFamily: "'Inter',sans-serif", outline: 'none' }}
              onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
            />
            {inviteStatus && (
              <p role="status" style={{
                margin: 0, color: inviteStatus.includes('successfully') ? '#4ade80' : '#f87171',
                fontSize: '12px', lineHeight: 1.5,
              }}>
                {inviteStatus}
              </p>
            )}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowInviteModal(false)} disabled={inviteLoading} style={{ padding: '7px 14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px', color: '#a1a1aa', cursor: inviteLoading ? 'not-allowed' : 'pointer', fontFamily: "'Inter',sans-serif" }}>Cancel</button>
              <button type="submit" disabled={inviteLoading} style={{ padding: '7px 16px', background: 'linear-gradient(135deg,#6366f1,#7c3aed)', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: '#fff', cursor: inviteLoading ? 'not-allowed' : 'pointer', fontFamily: "'Inter',sans-serif", opacity: inviteLoading ? 0.7 : 1 }}>{inviteLoading ? 'Sending…' : 'Send Invite'}</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Context Menu ────────────────────────────────────────── */}
      {contextMenu && (
        <div onMouseLeave={() => setContextMenu(null)} style={{ position: 'fixed', zIndex: 100, top: contextMenu.y, left: contextMenu.x, background: '#1c1c1f', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '10px', boxShadow: '0 10px 40px rgba(0,0,0,0.7)', padding: '4px', minWidth: '160px' }}>
          <button onClick={() => handleDeleteMessage(contextMenu.msg, 'for_me')}
            style={{ width: '100%', textAlign: 'left', padding: '7px 12px', fontSize: '12px', color: '#a1a1aa', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '6px', fontFamily: "'Inter',sans-serif" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
          >Delete for me</button>
          {contextMenu.msg.userId === auth?.user?.id && (
            <button onClick={() => handleDeleteMessage(contextMenu.msg, 'for_everyone')}
              style={{ width: '100%', textAlign: 'left', padding: '7px 12px', fontSize: '12px', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '6px', fontFamily: "'Inter',sans-serif" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >Delete for everyone</button>
          )}
        </div>
      )}

      {/* ── Delete Confirm ──────────────────────────────────────── */}
      {deleteConfirm.type === 'conversation' && (
        <div onClick={() => setDeleteConfirm({ type: null })} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px', padding: '24px', width: '300px', boxShadow: '0 20px 60px rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" fill="none" stroke="#f87171" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#fafafa', margin: 0 }}>Clear conversation?</p>
                <p style={{ fontSize: '12px', color: '#71717a', marginTop: '4px' }}>This clears chat history for you only.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirm({ type: null })} style={{ padding: '7px 14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px', color: '#a1a1aa', cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>Cancel</button>
              <button onClick={handleDeleteConversation} style={{ padding: '7px 14px', background: '#ef4444', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes ws-spin { to { transform: rotate(360deg); } }
        @keyframes ws-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
      `}</style>
    </div>
  );
} 