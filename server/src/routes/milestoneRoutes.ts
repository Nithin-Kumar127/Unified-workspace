import { Router, type Response } from 'express';
import pool from '../config/db.js';
import { protect, type AuthRequest } from '../middleware/authMiddleware.js';

const router = Router({ mergeParams: true });

// 1. Get all milestones for a timeline
router.get('/', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const result = await pool.query(
      'SELECT * FROM milestones WHERE project_id = $1 ORDER BY created_at ASC',
      [projectId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching milestones:', error);
    res.status(500).json({ error: 'Failed to fetch milestones' });
  }
});

// 2. Create a milestone (Frontend will enforce Owner-only UI)
router.post('/', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { title } = req.body;

    const result = await pool.query(
      'INSERT INTO milestones (project_id, title) VALUES ($1, $2) RETURNING *',
      [projectId, title]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating milestone:', error);
    res.status(500).json({ error: 'Failed to create milestone' });
  }
});

// 3. Complete a milestone (Developer & Owner)
router.put('/:milestoneId/complete', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, milestoneId } = req.params;
    const { note, userId, userName } = req.body;

    const result = await pool.query(
      `UPDATE milestones 
       SET status = 'completed', note = $1, completed_by = $2, completed_by_name = $3, completed_at = CURRENT_TIMESTAMP 
       WHERE id = $4 AND project_id = $5 
       RETURNING *`,
      [note, userId, userName, milestoneId, projectId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Milestone not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error completing milestone:', error);
    res.status(500).json({ error: 'Failed to complete milestone' });
  }
});

export default router;