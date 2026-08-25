// server/src/server.ts
import express, {type Request,type Response } from 'express';
import http from 'http'; // NEW: Node's native HTTP module
import { Server } from 'socket.io'; // NEW: Socket.IO
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import fileRoutes from './routes/fileRoutes.js';

dotenv.config();

const app = express();
const PORT: number = parseInt(process.env.PORT as string, 10) || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/files', fileRoutes);

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Unified Workspace TS server is running!' });
});

// --- NEW: WEBSOCKET SERVER SETUP ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Allow your Vite React app
    methods: ["GET", "POST"]
  }
});

// Listen for WebSocket connections
io.on('connection', (socket) => {
  console.log('🔗 User connected via WebSocket:', socket.id);

  // 1. Join a specific project room
  socket.on('join_project', (projectId) => {
    socket.join(`project_${projectId}`);
    console.log(`Socket joined room: project_${projectId}`);
  });

  // 2. Listen for chat messages
  socket.on('send_message', async (data) => {
    // data looks like: { projectId, userId, userName, content }
    
    // Broadcast the message immediately to everyone in that project
    io.to(`project_${data.projectId}`).emit('receive_message', data);

    // Save it to PostgreSQL in the background
    try {
      await pool.query(
        'INSERT INTO messages (project_id, user_id, content) VALUES ($1, $2, $3)',
        [data.projectId, data.userId, data.content]
      );
    } catch (err) {
      console.error('Error saving message to DB:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

// IMPORTANT: Change app.listen to server.listen
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});