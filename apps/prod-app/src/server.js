const express = require('express');
const os = require('os');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => res.json({
  service: 'prod-app',
  host: os.hostname(),
  uptime: process.uptime(),
}));

app.get('/healthz', (req, res) => res.json({ status: 'ok' }));

const server = app.listen(port, () => console.log(`up on ${port}`));

process.on('SIGTERM', () => {
  console.log('SIGTERM recibida, cerrando...');
  server.close(() => process.exit(0));
});
