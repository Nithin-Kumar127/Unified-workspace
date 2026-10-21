import dns from 'node:dns';
import express, { type Request, type Response } from 'express';
import http from 'http';
import { networkInterfaces } from 'node:os';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import pool from './config/db.js';
import uploadRoutes from './routes/uploadRoutes.js';
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import executionRoutes from './routes/executionRoutes.js';
import milestoneRoutes from './routes/milestoneRoutes.js';

dns.setDefaultResultOrder('ipv4first');

dotenv.config();

const app = express();
app.set('etag', false);
app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS ?? 0));
const PORT: number = parseInt(process.env.PORT as string, 10) || 5000;
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

// Reflect the requesting origin so credentialed requests work from changing LAN IPs.
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
}));
// Ensure OPTIONS preflight requests are always handled quickly (Express 5 wildcard syntax)
app.options('/{*any}', cors());

app.use('/api', apiLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// REST Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/files', fileRoutes);
app.use('/api/execute', executionRoutes);
app.use('/api/projects/:projectId/upload', uploadRoutes);
app.use('/api/projects/:projectId/milestones', milestoneRoutes);

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Unified Workspace TS Server is live' });
});

// HTTP & Socket.IO Setup
const server = http.createServer(app);
const socketClientOrigins = [
  'http://localhost:5173',
  ...(process.env.CLIENT_URL ?? 'https://unified-workspace-one.vercel.app')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
];
const io = new Server(server, {
  cors: {
    origin: [...new Set(socketClientOrigins)],
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

io.on('connection', (socket) => {
  console.log('🔗 WebSocket connected:', socket.id);

  // 1. Join Project Room
  socket.on('join_project', (projectId) => {
    socket.join(projectId.toString());
    console.log(`User joined project: ${projectId}`);
  });

  socket.on('file_updated', (payload: { projectId: string; file: Record<string, unknown> }) => {
    socket.to(payload.projectId.toString()).emit('file_updated', payload.file);
  });

  // 2. Team Chat Broadcast & DB Insert (WITH ATTACHMENTS)
  // Team Chat Broadcast & DB Insert (Fail-safe)
  socket.on('send_message', async (data) => {
    try {
      const result = await pool.query(
        `INSERT INTO messages (project_id, user_id, user_name, content, attachment) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [
          data.projectId, 
          data.userId, 
          data.userName || 'Anonymous', 
          data.content || '', 
          data.attachment ? JSON.stringify(data.attachment) : null
        ]
      );

      const savedMessage = result.rows[0];

      const formattedMessage = {
        id: savedMessage.id,
        projectId: savedMessage.project_id,
        userId: savedMessage.user_id,
        userName: savedMessage.user_name,
        content: savedMessage.content,
        attachment: savedMessage.attachment,
        is_deleted: savedMessage.is_deleted
      };

      io.to(data.projectId.toString()).emit('receive_message', formattedMessage);
    } catch (err) {
      console.error('❌ Failed to save message to PostgreSQL:', err);
    }
  });

  // Real-time message deletion
  socket.on('delete_message', (data: { projectId: string; messageId: number; deleteType: string }) => {
    socket.to(data.projectId.toString()).emit('message_deleted', data);
  });

  // 3. Milestones
  socket.on('send_new_milestone', (milestone) => {
    socket.to(milestone.project_id.toString()).emit('receive_new_milestone', milestone);
  });

  socket.on('send_updated_milestone', (milestone) => {
    socket.to(milestone.project_id.toString()).emit('receive_updated_milestone', milestone);
  });

  // 4. WebRTC Audio/Video Calling
  socket.on('join_voice', (payload: { projectId: string; userName: string }) => {
    const { projectId, userName } = payload;
    const voiceRoom = `${projectId}_voice`;
    socket.join(voiceRoom);
    socket.to(voiceRoom).emit('user_joined_voice', { socketId: socket.id, userName });
    console.log(`User "${userName}" (${socket.id}) joined voice for project ${projectId}`);
  });

  socket.on('leave_voice', (projectId) => {
    const voiceRoom = `${projectId}_voice`;
    socket.leave(voiceRoom);
    socket.to(voiceRoom).emit('user_left_voice', socket.id);
  });

  socket.on('webrtc_signal', (payload) => {
    io.to(payload.targetSocketId).emit('webrtc_signal', payload);
  });

  // Handle abrupt disconnections during a call
  socket.on('disconnecting', () => {
    socket.rooms.forEach(room => {
      if (room.endsWith('_voice')) {
        socket.to(room).emit('user_left_voice', socket.id);
      }
    });
  });

  // 5. Legacy Tasks (If still in use)
  socket.on('send_task', async (data) => {
    try {
      await pool.query(
        'INSERT INTO tasks (project_id, user_id, content) VALUES ($1, $2, $3)',
        [data.projectId, data.userId, data.content]
      );
      io.to(data.projectId.toString()).emit('receive_task', data);
    } catch (err) {
      console.error('Database write error for tasks:', err);
    }
  });

  // 6. Network Latency Ping Handler
  socket.on('ping_latency', (acknowledge) => {
    if (typeof acknowledge === 'function') acknowledge();
  });

  // 7. Disconnect
  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected:', socket.id);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Unified Workspace Backend live on port ${PORT}`);
  console.log(`   → Local:   http://localhost:${PORT}`);
  const addresses = Object.values(networkInterfaces())
    .flatMap((interfaces) => interfaces ?? [])
    .filter((address) => address.family === 'IPv4' && !address.internal)
    .map((address) => address.address);
  for (const address of addresses) {
    console.log(`   → Network: http://${address}:${PORT}  (accessible on LAN)`);
  }
});