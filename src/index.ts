import http from 'http';
import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
// Updated to use the new connection-pooled Prisma singleton
import { prisma, connectDB } from './lib/prisma';
import { HTTP_STATUS } from './config/constants';
import { formatError, formatSuccess } from './utils/responseFormatter';
// Modularized interactive HTML status dashboard
import { renderStatusPage } from './utils/statusPage';

// ─── Route imports ─────────────────────────────────────────────
import authRoutes from './routes/auth.routes';
import examResultsRoutes from './routes/examResults.routes';
import galleryRoutes from './routes/gallery.routes';
import videoRoutes from './routes/video.routes';
import studentDemographicsRoutes from './routes/studentDemographics.routes';
import contactRoutes from './routes/contact.routes';
import messagesRoutes from './routes/messages.routes';
import settingsRoutes from './routes/settings.routes';

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);
const MAX_JSON_BODY_SIZE = process.env.MAX_JSON_BODY_SIZE || '1mb';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Parse allowed origins from environment:
 * - CLIENT_ORIGIN (legacy single-origin var)
 * - FRONTEND_URL (comma/newline-separated multi-origin var)
 */
function parseAllowedOrigins(): string[] {
  const origins = new Set<string>();

  if (process.env.CLIENT_ORIGIN) {
    process.env.CLIENT_ORIGIN.split(',')
      .map((o) => o.trim().toLowerCase())
      .filter(Boolean)
      .forEach((o) => origins.add(o));
  }

  if (process.env.FRONTEND_URL) {
    process.env.FRONTEND_URL.split(/[\n,]/)
      .map((o) => o.trim().toLowerCase())
      .filter(Boolean)
      .forEach((o) => origins.add(o));
  }

  return Array.from(origins);
}

const allowedOrigins = parseAllowedOrigins();

// ============================================
// 1. TRUST PROXY — accurate client IP behind Nginx / CyberPanel
// ============================================
app.set('trust proxy', 1);
console.log(`🔒 Trust proxy enabled (${isProduction ? 'production' : 'development'})`);

// ============================================
// 2. HEADER DE-DUPLICATION GUARD
// ============================================
app.use((req, _res, next) => {
  const origin = req.headers.origin;
  if (origin && typeof origin === 'string' && origin.includes(',')) {
    req.headers.origin = origin.split(',')[0].trim();
  }
  next();
});

// ============================================
// 3. REQUEST LOGGER
// ============================================
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// 4. SECURITY HEADERS (HELMET) — env-aware CSP
// ============================================
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", `http://localhost:${PORT}`, ...allowedOrigins],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://fonts.googleapis.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        imgSrc: ["'self'", 'data:', 'blob:', `http://localhost:${PORT}`],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'", ...allowedOrigins],
      },
    },
    hsts: isProduction
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
  })
);

// ============================================
// 5. CUSTOM ZERO-DUPLICATE CORS MIDDLEWARE
// ============================================
const productionAllowedOrigins = [
  'https://bmv.ecosystemlk.app',
  'https://api.bmv.ecosystemlk.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
  ...allowedOrigins,
].filter(Boolean);

app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean | string) => void) => {
    // Mobile apps, server-to-server, curl හෝ same-origin requests allow කිරීම
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.replace(/\/+$/, '');
    const isAllowed = productionAllowedOrigins.some(item => cleanOrigin === item.replace(/\/+$/, '')) ||
                      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin) ||
                      /\.ecosystemlk\.app$/i.test(cleanOrigin);

    if (isAllowed) {
      return callback(null, cleanOrigin);
    }

    // Safe fallback: Error throw නොකර main domain echo කරයි
    return callback(null, 'https://bmv.ecosystemlk.app');
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With', 'Accept', 'X-Request-ID'],
  exposedHeaders: ['Set-Cookie', 'X-Request-ID'],
  maxAge: 86400 // 24 hours preflight cache
}));
// ============================================
// 6. COMPRESSION + 7. BODY PARSERS
// ============================================
app.use(compression({ threshold: 1024 }));
app.use(express.json({ limit: MAX_JSON_BODY_SIZE }));
app.use(express.urlencoded({ extended: true, limit: MAX_JSON_BODY_SIZE }));

// ============================================
// 8. ADDITIONAL SECURITY RESPONSE HEADERS
// ============================================
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (isProduction) {
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  }
  next();
});

// ============================================
// 9. ROOT ENDPOINT
// ============================================
app.get('/', (_req: Request, res: Response) => {
  res.json(
    formatSuccess({
      message: 'Bamunugama School Backend API is running',
      statusCode: HTTP_STATUS.OK,
    })
  );
});

// ============================================
// 10. HEALTH CHECK — instant, no DB call
// ============================================
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Bamunugama School API is running',
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// 11. API STATUS LANDING PAGE (/api/test & /test)
// ============================================
// Handlers utilize async modular status page with real-time MariaDB ping
app.get('/api/test', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.setHeader('Content-Type', 'text/html');
    const html = await renderStatusPage();
    res.status(200).send(html);
  } catch (error) {
    next(error);
  }
});

app.get('/test', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.setHeader('Content-Type', 'text/html');
    const html = await renderStatusPage();
    res.status(200).send(html);
  } catch (error) {
    next(error);
  }
});

// ============================================
// 12. API ROUTES
// ============================================
app.use('/api/admin/auth', authRoutes);
app.use('/api/results', examResultsRoutes);
app.use('/api/admin/results', examResultsRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/admin/gallery', galleryRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/admin/videos', videoRoutes);
app.use('/api/demographics', studentDemographicsRoutes);
app.use('/api/admin/demographics', studentDemographicsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin/contact', contactRoutes);
app.use('/api/admin/messages', messagesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin/settings', settingsRoutes);

// ============================================
// 13. 404 NOT FOUND HANDLER
// ============================================
app.use((req: Request, res: Response) => {
  const errorResponse = formatError({
    message: 'Endpoint not found',
    errors: [`${req.method} ${req.path} is not a valid endpoint`],
    statusCode: HTTP_STATUS.NOT_FOUND,
  });
  res.status(HTTP_STATUS.NOT_FOUND).json(errorResponse);
});


// Error Handler එකට කලින් CORS headers attach වන බව තහවුරු කිරීම (500 Errors වලදී CORS drop වීම වැළැක්වීමට)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin.replace(/\/+$/, ''));
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  next(err);
});


// ============================================
// 14. GLOBAL ERROR HANDLER
// ============================================
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('❌ Error:', {
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
  });
  const statusCode =
    (err as unknown as Record<string, number>).statusCode ||
    HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = err.message || 'Internal server error';
  const errorResponse = formatError({
    message,
    errors: (err as unknown as Record<string, string[]>).errors || [err.message],
    statusCode,
  });
  res.status(statusCode).json(errorResponse);
});

// ============================================
// 15. HTTP SERVER & OPENLITESPEED LSNODE DUAL SUPPORT
// ============================================
const httpServer = http.createServer(app);

// OpenLiteSpeed lsnode pipe socket සහ Local Port dual-support
const isLSNode = Boolean(process.env.LSAPI_CHILDREN);
const LISTEN_PORT = isLSNode ? undefined : PORT;

async function startServer(): Promise<void> {
  try {
    // 1. Verify MariaDB Adapter pool connection
    await connectDB();

    // 2. Start HTTP Listener based on deployment environment
    if (LISTEN_PORT) {
      // Local development or Standalone Node.js mode
      httpServer.listen(LISTEN_PORT, () => {
        console.log(`🚀 Bamunugama School API running on http://localhost:${LISTEN_PORT}`);
        console.log(`⚙️  Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📡 Status page at http://localhost:${LISTEN_PORT}/api/test`);
        console.log(`❤️  Health check at http://localhost:${LISTEN_PORT}/api/health`);
      });
    } else {
      // OpenLiteSpeed (CyberPanel) Native Pipe Mode
      httpServer.listen(() => {
        console.log('🚀 Bamunugama School API running via OpenLiteSpeed lsnode pipe');
        console.log(`⚙️  Environment: ${process.env.NODE_ENV || 'production'}`);
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Failed to start server due to database connection failure:', message);
    process.exit(1);
  }
}

// 🛡️ OpenLiteSpeed (lsnode) Safe Graceful Shutdown Hook
let isShuttingDown = false;
function handleGracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n[lsnode] Received ${signal}. Closing HTTP server and database pool gracefully...`);

  httpServer.close(async () => {
    try {
      await prisma.$disconnect();
      console.log('[lsnode] Database pool disconnected. Exiting cleanly.');
      process.exit(0);
    } catch (err) {
      console.error('[lsnode] Error during database disconnect:', err);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error('[lsnode] Force exiting after 5s timeout.');
    process.exit(1);
  }, 5000).unref();
}

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

// Process Exception Protection
process.on('unhandledRejection', (reason: any) => {
  console.error('[lsnode] Unhandled Promise Rejection trapped:', reason);
});

process.on('uncaughtException', (err: Error) => {
  console.error('[lsnode] Uncaught Exception trapped:', err);
});

startServer();

export default app;