const http = require('http');
const { spawn } = require('child_process');
const crypto = require('crypto');

const PORT = 9000;
const SECRET = 'qunxiang-webhook-2026';
const PROJECT_DIR = '/www/wwwroot/qunxiang-xinghuo';
const LOG_FILE = `${PROJECT_DIR}/webhook-deploy.log`;

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  require('fs').appendFileSync(LOG_FILE, line);
  console.log(line.trim());
}

function runDeploy() {
  log('=== Deploy triggered ===');
  const deployScript = `${PROJECT_DIR}/scripts/deploy.sh`;
  const child = spawn('bash', [deployScript], {
    cwd: PROJECT_DIR,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  child.stdout.on('data', (data) => {
    require('fs').appendFileSync(LOG_FILE, data.toString());
  });
  child.stderr.on('data', (data) => {
    require('fs').appendFileSync(LOG_FILE, `ERR: ${data.toString()}`);
  });
  child.on('close', (code) => {
    log(`Deploy script exited with code ${code}`);
  });
  child.unref();
}

const server = http.createServer((req, res) => {
  if (req.url !== '/webhook' || req.method !== 'POST') {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try {
      const payload = JSON.parse(body);
      const ref = payload.ref || '';
      
      if (ref === 'refs/heads/dev') {
        log(`Push received on dev branch by ${payload.pusher?.name || 'unknown'}`);
        runDeploy();
        res.writeHead(200);
        res.end(JSON.stringify({ status: 'deploy_triggered' }));
      } else {
        res.writeHead(200);
        res.end(JSON.stringify({ status: 'ignored', ref }));
      }
    } catch (e) {
      log(`Webhook parse error: ${e.message}`);
      res.writeHead(400);
      res.end('Bad Request');
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  log(`Webhook server listening on 0.0.0.0:${PORT}`);
});
