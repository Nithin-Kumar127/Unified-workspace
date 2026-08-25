// server/src/controllers/fileController.ts
import {type Response } from 'express';
import {type AuthRequest } from '../middleware/authMiddleware.js';
import pool from '../config/db.js';
import { supabase } from '../config/supabase.js';

export const saveFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.projectId;
    const userId = req.user?.id;
    const { name, content, language } = req.body;

    // 1. Verify user is in the project
    const memberCheck = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );

    if (memberCheck.rows.length === 0) {
      res.status(403).json({ error: 'Not a member of this project' });
      return;
    }

    // 2. Define the storage path (e.g., "project_1/App.js")
    const storagePath = `project_${projectId}/${name}`;

    // 3. Upload the text content to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('project-files')
      .upload(storagePath, content, {
        upsert: true, // Overwrite if the file already exists
        contentType: 'text/plain'
      });

    if (uploadError) throw uploadError;

    // 4. Upsert metadata in PostgreSQL
    const fileResult = await pool.query(`
      INSERT INTO files (project_id, name, storage_path, language, created_by, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (project_id, name) 
      DO UPDATE SET updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [projectId, name, storagePath, language || 'javascript', userId]);

    res.json(fileResult.rows[0]);
  } catch (error) {
    console.error('Save File Error:', error);
    res.status(500).json({ error: 'Server error saving file' });
  }
};

export const getProjectFiles = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.projectId;
    const userId = req.user?.id;

    const memberCheck = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );

    if (memberCheck.rows.length === 0) {
      res.status(403).json({ error: 'Not a member of this project' });
      return;
    }

    const filesResult = await pool.query(
      'SELECT * FROM files WHERE project_id = $1 ORDER BY name ASC',
      [projectId]
    );

    res.json(filesResult.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching files' });
  }
};