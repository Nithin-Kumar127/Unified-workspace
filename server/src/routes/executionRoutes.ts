import { Router } from 'express';
import { runCode } from '../controllers/executionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// Protect ensures only logged-in workspace members can run code
router.post('/', protect, runCode);

export default router;