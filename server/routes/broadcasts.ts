import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { broadcastSendHandler } from './automations';

const router = Router();

router.post('/:broadcastId/send', requireAuth, broadcastSendHandler);

export default router;
