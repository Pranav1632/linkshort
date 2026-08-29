const http = require('http');
const httpProxy = require('http-proxy');
const dns = require('dns').promises;

const PORT = process.env.PORT || 5000;
const BACKEND_HOST = process.env.BACKEND_HOST || 'backend';
const BACKEND_PORT = process.env.BACKEND_PORT || 5000;

const proxy = httpProxy.createProxyServer({
  ws: true,
  changeOrigin: true,
});

let currentTargetIndex = 0;
let cachedTargets = [`http://${BACKEND_HOST}:${BACKEND_PORT}`];

// Periodically resolve all backend replica container IPs via Docker internal DNS
async function refreshReplicaIps() {
  try {
    const addresses = await dns.resolve4(BACKEND_HOST);
    if (addresses && addresses.length > 0) {
      cachedTargets = addresses.map((ip) => `http://${ip}:${BACKEND_PORT}`);
    }
  } catch (err) {
    // Fallback to hostname if DNS resolution in progress
    cachedTargets = [`http://${BACKEND_HOST}:${BACKEND_PORT}`];
  }
}

// Refresh replica pool every 3 seconds
refreshReplicaIps();
setInterval(refreshReplicaIps, 3000);

const server = http.createServer((req, res) => {
  // 1. Gateway Health Check
  if (req.url === '/gateway-health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(
      JSON.stringify({
        status: 'healthy',
        service: 'api-gateway-load-balancer',
        activeReplicasCount: cachedTargets.length,
        replicas: cachedTargets,
      })
    );
  }

  // 2. Round-Robin Target Selection
  const target = cachedTargets[currentTargetIndex % cachedTargets.length];
  currentTargetIndex = (currentTargetIndex + 1) % cachedTargets.length;

  res.setHeader('X-Gateway-Route', 'round-robin');

  // 3. Proxy Request to selected Replica
  proxy.web(
    req,
    res,
    {
      target,
      timeout: 10000,
    },
    (err) => {
      console.error(`[Gateway] Error forwarding to ${target}:`, err.message);
      // Try next available target on error
      const failoverTarget = cachedTargets[currentTargetIndex % cachedTargets.length];
      proxy.web(req, res, { target: failoverTarget }, (retryErr) => {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', error: 'Bad Gateway - All replicas busy' }));
      });
    }
  );
});

// Proxy WebSockets
server.on('upgrade', (req, socket, head) => {
  const target = cachedTargets[currentTargetIndex % cachedTargets.length];
  proxy.ws(req, socket, head, { target });
});

server.listen(PORT, () => {
  console.log(`[Gateway] 🚀 Load Balancer & API Gateway running on port ${PORT}`);
  console.log(`[Gateway] Forwarding across replicas: ${BACKEND_HOST}:${BACKEND_PORT}`);
});
