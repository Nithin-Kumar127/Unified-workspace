// server/src/controllers/projectController.ts
import {type Response } from 'express';
import {type AuthRequest } from '../middleware/authMiddleware.js';
import pool from '../config/db.js';
import { sendProjectInviteEmail } from '../utils/mailer.js';

export const createProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    const ownerId = req.user?.id;

    if (!name) {
      res.status(400).json({ error: 'Project name is required' });
      return;
    }

    // Start a database transaction (DBMS concept: Ensures both inserts succeed, or neither do)
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Insert the project
      const projectResult = await client.query(
        'INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *',
        [name, description, ownerId]
      );
      const newProject = projectResult.rows[0];

      // 2. Add the owner as the first member of the project
      await client.query(
        'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
        [newProject.id, ownerId, 'owner']
      );

      await client.query('COMMIT');
      res.status(201).json(newProject);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getUserProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    // Fetch projects where the user is a member
    const projects = await pool.query(`
      SELECT p.id, p.name, p.description, pm.role, p.created_at
      FROM projects p
      JOIN project_members pm ON p.id = pm.project_id
      WHERE pm.user_id = $1
      ORDER BY p.created_at DESC
    `, [userId]);

    res.json(projects.rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Add this to the bottom of server/src/controllers/projectController.ts

export const getProjectById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id;
    const userId = req.user?.id;

    // 1. Check if user is a member of this project
    const memberCheck = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );

    if (memberCheck.rows.length === 0) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // 2. Get project details
    const projectResult = await pool.query('SELECT * FROM projects WHERE id = $1', [projectId]);
    
    // 3. Get all team members
    const membersResult = await pool.query(`
      SELECT u.id, u.name, u.email, pm.role 
      FROM users u 
      JOIN project_members pm ON u.id = pm.user_id 
      WHERE pm.project_id = $1
    `, [projectId]);

    res.json({
      ...projectResult.rows[0],
      members: membersResult.rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const addMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id;
    const ownerId = req.user?.id;
    const { email, role = 'developer' } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (typeof projectId !== 'string' || !projectId.trim()) {
      res.status(400).json({ error: 'A valid project ID is required' });
      return;
    }

    if (!normalizedEmail) {
      res.status(400).json({ error: 'A valid email address is required' });
      return;
    }

    // 1. Verify the requester is the OWNER
    const ownerCheck = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, ownerId]
    );

    if (ownerCheck.rows.length === 0 || ownerCheck.rows[0].role !== 'owner') {
      res.status(403).json({ error: 'Only the project owner can add members' });
      return;
    }

    const projectResult = await pool.query(
      `SELECT p.name AS project_name, u.name AS inviter_name, u.email AS inviter_email
       FROM projects p
       JOIN users u ON u.id = $2
       WHERE p.id = $1`,
      [projectId, ownerId]
    );
    if (projectResult.rows.length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // 2. Find the user being invited
    const userResult = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [normalizedEmail]
    );
    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'User with this email not found' });
      return;
    }
    const newMemberId = userResult.rows[0].id;

    const configuredOrigin = process.env.FRONTEND_URL;
    const requestOrigin = req.get('origin');
    const fallbackOrigin = `${req.protocol}://${req.get('host')}`;
    const inviteOrigin = configuredOrigin || requestOrigin || fallbackOrigin;
    let origin: URL;
    try {
      origin = new URL(inviteOrigin);
    } catch {
      res.status(500).json({ error: 'Could not determine the project invitation URL' });
      return;
    }

    if (origin.protocol !== 'http:' && origin.protocol !== 'https:') {
      res.status(500).json({ error: 'Project invitation URL must use HTTP or HTTPS' });
      return;
    }

    const inviteLink = new URL(
      `/workspace/${encodeURIComponent(projectId)}`,
      origin.origin
    ).toString();

    // 3. Add them to the project, allowing an existing member to retry a failed email.
    const existingMembership = await pool.query(
      'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, newMemberId]
    );
    if (existingMembership.rows.length === 0) {
      await pool.query(
        'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
        [projectId, newMemberId, role]
      );
    }

    try {
      await sendProjectInviteEmail(
        normalizedEmail,
        projectResult.rows[0].project_name,
        projectResult.rows[0].inviter_name || projectResult.rows[0].inviter_email,
        inviteLink
      );
    } catch (error) {
      console.error('Error sending project invitation email:', error);
      res.status(502).json({
        error: 'Member was added, but the invitation email could not be sent',
      });
      return;
    }

    res.status(201).json({ message: 'Invitation email sent successfully' });
  } catch (error: unknown) {
    const errorCode =
      typeof error === 'object' && error !== null && 'code' in error
        ? error.code
        : undefined;
    if (errorCode === '23505') { // PostgreSQL unique constraint violation code
      res.status(400).json({ error: 'User is already in this project' });
    } else {
      console.error('Error adding project member:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

// Add to the bottom of server/src/controllers/projectController.ts

export const getProjectMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id;
    const userId = req.user?.id;

    // Verify membership
    const memberCheck = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );

    if (memberCheck.rows.length === 0) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Fetch messages with the sender's name
    // Filter out messages deleted for this user, but keep is_deleted ones (show placeholder)
    const messages = await pool.query(`
      SELECT m.id, m.content, m.created_at, m.user_id as "userId", u.name as "userName",
             m.is_deleted, m.deleted_for, m.attachment
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.project_id = $1
        AND NOT (m.deleted_for @> to_jsonb($2::int))
      ORDER BY m.created_at ASC
    `, [projectId, userId]);

    // Parse attachment from JSON string back to object (stored via JSON.stringify on write)
    const formattedMessages = messages.rows.map((row: any) => ({
      ...row,
      attachment: row.attachment
        ? (typeof row.attachment === 'string' ? JSON.parse(row.attachment) : row.attachment)
        : null,
    }));

    res.json(formattedMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete a single message
export const deleteMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: projectId, messageId } = req.params;
    const userId = req.user?.id;
    const { deleteType } = req.body; // 'for_me' | 'for_everyone'

    // Verify membership
    const memberCheck = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    if (memberCheck.rows.length === 0) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    if (deleteType === 'for_everyone') {
      // Only the message sender can delete for everyone
      const msgCheck = await pool.query(
        'SELECT user_id FROM messages WHERE id = $1 AND project_id = $2',
        [messageId, projectId]
      );
      if (msgCheck.rows.length === 0) {
        res.status(404).json({ error: 'Message not found' });
        return;
      }
      if (msgCheck.rows[0].user_id !== userId) {
        res.status(403).json({ error: 'Only the sender can delete for everyone' });
        return;
      }
      await pool.query(
        `UPDATE messages SET is_deleted = TRUE, content = '' WHERE id = $1 AND project_id = $2`,
        [messageId, projectId]
      );
      res.json({ success: true, deleteType: 'for_everyone', messageId });
    } else {
      // Delete for me: add userId to deleted_for array
      await pool.query(
        `UPDATE messages
         SET deleted_for = deleted_for || to_jsonb($1::int)
         WHERE id = $2 AND project_id = $3
           AND NOT (deleted_for @> to_jsonb($1::int))`,
        [userId, messageId, projectId]
      );
      res.json({ success: true, deleteType: 'for_me', messageId });
    }
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete entire conversation for the requesting user
export const deleteConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: projectId } = req.params;
    const userId = req.user?.id;

    // Verify membership
    const memberCheck = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    if (memberCheck.rows.length === 0) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Add this user's ID to deleted_for on ALL messages in this project
    await pool.query(
      `UPDATE messages
       SET deleted_for = deleted_for || to_jsonb($1::int)
       WHERE project_id = $2
         AND NOT (deleted_for @> to_jsonb($1::int))`,
      [userId, projectId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Server error' });
  }
};