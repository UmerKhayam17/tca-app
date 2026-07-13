const http = require('http');
const app = require('./app');
const env = require('./config/env');
const { connectDatabase } = require('./config/database');
const { seedPermissionsAndRoles } = require('./services/seed');
const { ensureAcademyStudentIndexes } = require('./services/academy/ensureAcademyStudentIndexes');
const { startCronJobs } = require('./jobs/cron');
const { initSocket, getIO } = require('./services/socket/index');

async function bootstrap() {
  await connectDatabase();
  await seedPermissionsAndRoles();
  await ensureAcademyStudentIndexes();
  startCronJobs();

  const server = http.createServer(app);
  initSocket(server, env.clientOrigins);
  app.set('io', getIO());

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
