import { Router, type Response } from 'express';
import pool from '../config/db.js';
import { protect, type AuthRequest } from '../middleware/authMiddleware.js';
import {
  createProject,
  getUserProjects,
  getProjectById,
  addMember,
  // getProjectMessages, <-- Removed: We are writing the fixed logic directly below
  deleteMessage,
  deleteConversation
} from '../controllers/projectController.js';

const router = Router({ mergeParams: true });

// Apply the 'protect' middleware to all routes in this file
router.use(protect);

router.post('/', createProject);
router.get('/', getUserProjects);

// New Routes
router.get('/:id', getProjectById);
router.post('/:id/members', addMember);

// 👇 FIXED ROUTE: Explicitly selecting and mapping the attachment column
router.get('/:id/messages', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Join with users table so older messages without stored user_name still get their author name
    const result = await pool.query(
      `SELECT m.*, u.name as "authorName" 
       FROM messages m 
       LEFT JOIN users u ON m.user_id = u.id 
       WHERE m.project_id = $1 
       ORDER BY m.created_at ASC`,
      [id]
    );

    const formattedMessages = result.rows.map(row => ({
      id: row.id,
      projectId: row.project_id,
      userId: row.user_id,
      userName: row.user_name || row.authorName || 'User',
      content: row.content,
      attachment: row.attachment,
      is_deleted: row.is_deleted
    }));

    res.json(formattedMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});
// 👆 END OF FIX

router.delete('/:id/messages/:messageId', deleteMessage);
router.delete('/:id/messages', deleteConversation);

// Fetch feature logs (tasks) for a specific project
router.get('/:projectId/tasks', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const result = await pool.query(
      `SELECT t.*, u.name as "userName" 
       FROM tasks t 
       JOIN users u ON t.user_id = u.id 
       WHERE t.project_id = $1 
       ORDER BY t.created_at ASC`,
      [projectId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch feature logs' });
  }
});

router.put('/:fileName', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, fileName } = req.params;
    const { content } = req.body;

    const result = await pool.query(
      'UPDATE files SET content = $1 WHERE project_id = $2 AND name = $3 RETURNING *',
      [content, projectId, fileName]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    res.json({ message: 'File saved successfully', file: result.rows[0] });
  } catch (error) {
    console.error('Error saving file:', error);
    res.status(500).json({ error: 'Failed to save file' });
  }
});

export default router;