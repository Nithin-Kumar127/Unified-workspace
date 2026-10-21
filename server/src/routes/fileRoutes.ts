import { Router, type Response } from 'express';
import pool from '../config/db.js';
import { protect, type AuthRequest } from '../middleware/authMiddleware.js';

const router = Router({ mergeParams: true });

// 1. Get all files for a project
router.get('/', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const result = await pool.query(
      'SELECT * FROM files WHERE project_id = $1 ORDER BY id ASC',
      [projectId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// 2. Create a new file
// 2. Create a new file
router.post('/', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { name, content } = req.body;

    const storagePath = `project_${projectId}/${name}`;

    const result = await pool.query(
      'INSERT INTO files (project_id, name, content, storage_path) VALUES ($1, $2, $3, $4) RETURNING *',
      [projectId, name, content || '// New file\n', storagePath]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating file:', error);
    res.status(500).json({ error: 'Failed to create file' });
  }
});

// 3. Get single file content by ID (Bypasses dot-parsing bugs completely)
router.get('/:fileId', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, fileId } = req.params;
    const result = await pool.query(
      'SELECT * FROM files WHERE project_id = $1 AND id = $2',
      [projectId, fileId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching file content:', error);
    res.status(500).json({ error: 'Failed to fetch file content' });
  }
});

// 4. Update / Save file content by ID
router.put('/:fileId', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, fileId } = req.params;
    const { content } = req.body;

    const result = await pool.query(
      'UPDATE files SET content = $1 WHERE project_id = $2 AND id = $3 RETURNING *',
      [content, projectId, fileId]
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