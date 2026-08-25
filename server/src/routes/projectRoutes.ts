// server/src/routes/projectRoutes.ts
import { Router } from 'express';
import { createProject, getUserProjects,getProjectById, addMember, getProjectMessages } from '../controllers/projectController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// Apply the 'protect' middleware to all routes in this file
router.use(protect);

router.post('/', createProject);
router.get('/', getUserProjects);

// New Routes
router.get('/:id', getProjectById);
router.post('/:id/members', addMember);

router.get('/:id/messages', getProjectMessages);    

export default router;