// Wassel platform backend.
//
// Roles:
//   - Verifies Firebase ID tokens for authenticated client requests.
//   - Receives WhatsApp Cloud API + n8n webhooks (with signature checks).
//   - Resolves the tenant (orgId) for every event and fans out triggers
//     into the automation engine.
//   - Calls n8n master workflows on behalf of tenants — the browser never
//     touches n8n directly.

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import authRouter from './routes/auth';
import healthRouter from './routes/health';
import webhooksRouter from './routes/webhooks';
import automationsRouter from './routes/automations';
import broadcastsRouter from './routes/broadcasts';
import organizationsRouter from './routes/organizations';
import teamRouter from './routes/team';

const app = express();
const PORT = Number(process.env.PORT || 8787);

// Capture the raw body alongside the parsed JSON — required for HMAC checks
// on /webhooks/* without re-stringifying (which would change byte order).
app.use(express.json({
  limit: '2mb',
  verify: (req, _res, buf) => {
    (req as any).rawBody = buf;
  },
}));

// Basic CORS — production should pin this to the dashboard origin.
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.header('origin');
  const allow = process.env.ALLOWED_ORIGIN || '*';
  if (allow === '*' || origin === allow) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});

// Lightweight in-process rate limiter (per IP) to absorb webhook bursts and
// brute force attempts. For production deployments swap for a Redis backend.
const buckets = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 600;
app.use((req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || b.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }
  b.count += 1;
  if (b.count > MAX_PER_WINDOW) {
    return res.status(429).json({ error: 'Rate limit exceeded.' });
  }
  next();
});

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/automations', automationsRouter);
app.use('/api/broadcasts', broadcastsRouter);
app.use('/api/organizations', organizationsRouter);
app.use('/api/team', teamRouter);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[server] unhandled error', err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`[wassel-backend] listening on :${PORT}`);
});
