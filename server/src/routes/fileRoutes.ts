// server/src/routes/fileRoutes.ts
import { Router } from 'express';
import { saveFile, getProjectFiles } from '../controllers/fileController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router({ mergeParams: true }); // mergeParams lets us access the projectId from the parent route

router.use(protect);

router.get('/', getProjectFiles);
router.post('/', saveFile);

export default router;