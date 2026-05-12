const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const env = require('./config/env');
const { connectDatabase } = require('./config/database');
const { seedPermissionsAndRoles } = require('./services/seed');
const { verifyAccessToken } = require('./utils/tokenService');
const { startCronJobs } = require('./jobs/cron');

function attachSocket(server) {
  const io = new Server(server, {
    cors: { origin: env.clientUrl, credentials: true },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) return next(new Error('Unauthorized'));
      const decoded = verifyAccessToken(token);
      socket.userId = decoded.sub;
      return next();
    } catch {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('join:conversation', (conversationId) => {
      socket.join(`conv:${conversationId}`);
    });
    socket.on('leave:conversation', (conversationId) => {
      socket.leave(`conv:${conversationId}`);
    });
  });

  app.set('io', io);
  return io;
}

async function bootstrap() {
  await connectDatabase();
  await seedPermissionsAndRoles();
  startCronJobs();

  const server = http.createServer(app);
  attachSocket(server);

  server.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Academy API listening on port ${env.port}`);
  });
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
