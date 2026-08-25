// server/src/controllers/projectController.ts
import {type Response } from 'express';
import {type AuthRequest } from '../middleware/authMiddleware.js';
import pool from '../config/db.js';

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

    // 1. Verify the requester is the OWNER
    const ownerCheck = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, ownerId]
    );

    if (ownerCheck.rows.length === 0 || ownerCheck.rows[0].role !== 'owner') {
      res.status(403).json({ error: 'Only the project owner can add members' });
      return;
    }

    // 2. Find the user being invited
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'User with this email not found' });
      return;
    }
    const newMemberId = userResult.rows[0].id;

    // 3. Add them to the project
    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [projectId, newMemberId, role]
    );

    res.status(201).json({ message: 'Member added successfully' });
  } catch (error: any) {
    if (error.code === '23505') { // PostgreSQL unique constraint violation code
      res.status(400).json({ error: 'User is already in this project' });
    } else {
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
    const messages = await pool.query(`
      SELECT m.id, m.content, m.created_at, m.user_id as "userId", u.name as "userName"
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.project_id = $1
      ORDER BY m.created_at ASC
    `, [projectId]);

    res.json(messages.rows);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Server error' });
  }
};