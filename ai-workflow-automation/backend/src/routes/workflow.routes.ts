import { Router } from 'express';
import {
    createWorkflow,
    getWorkflows,
    getWorkflow,
    updateWorkflow,
    deleteWorkflow,
    toggleWorkflow,
    executeWorkflow,
} from '../controllers/workflow.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All workflow routes require authentication
router.use(authenticate);

router.post('/', createWorkflow);
router.get('/', getWorkflows);
router.get('/:id', getWorkflow);
router.put('/:id', updateWorkflow);
router.delete('/:id', deleteWorkflow);
router.patch('/:id/toggle', toggleWorkflow);
router.post('/:id/execute', executeWorkflow);

export default router;
