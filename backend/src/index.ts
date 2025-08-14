const fastify = require('fastify');
import { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { sessionRoutes } from './http/routes.session';
import { createSocketServer } from './ws/socket';

const PORT = parseInt(process.env.PORT || '8080');
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  const app = fastify({
    logger: {
      level: 'info'
    }
  });

  // Register CORS
  await app.register(cors, {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
    credentials: true
  });

  // Create HTTP server
  const httpServer = app.server;
  
  // Create Socket.IO server
  const io = createSocketServer(httpServer);
  
  // Attach io to app for use in routes
  app.decorate('io', io);

  // Register API routes
  await app.register(sessionRoutes, { prefix: '/api' });

  // Health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Start server
  try {
    await app.listen({ port: PORT, host: HOST });
    console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

start();