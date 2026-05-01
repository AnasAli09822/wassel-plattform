import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    service: 'wassel-platform-backend',
    uptime: process.uptime(),
    time: new Date().toISOString(),
  });
});

export default router;
