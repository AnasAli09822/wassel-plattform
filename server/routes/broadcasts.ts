import { Router } from 'express';
import { requireAuth, requireOrgScope, requireRole } from '../middleware/auth';
import { broadcastSendHandler } from './automations';

const router = Router();

router.post('/:broadcastId/send', requireAuth, requireOrgScope, requireRole(['owner', 'admin']), broadcastSendHandler);

export default router;
