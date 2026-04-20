const http = require('http')
const https = require('https')
const { exec } = require('child_process')
const { URL } = require('url')

const PORT = 3001

const server = http.createServer((req, res) => {
  // CORS and basic headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'application/json')

  // Early error handling for the response
  res.on('error', (err) => {
    console.error('Response error:', err)
  })

  const path = req.url.split('?')[0]
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)

  // /api/status?url=... — HTTP/HTTPS check
  if (req.method === 'GET' && path === '/api/status') {
    let targetUrl
    try {
      const params = new URL(req.url, 'http://localhost').searchParams
      targetUrl = params.get('url')
    } catch (e) {
      res.writeHead(400); res.end(JSON.stringify({ status: 'error', message: 'invalid request url' })); return
    }

    if (!targetUrl) {
      res.writeHead(400); res.end(JSON.stringify({ status: 'error', message: 'missing url parameter' })); return
    }

    let parsed
    try {
      parsed = new URL(targetUrl)
    } catch (e) {
      res.writeHead(400); res.end(JSON.stringify({ status: 'error', message: 'invalid target url' })); return
    }

    const lib = parsed.protocol === 'https:' ? https : http
    
    // ГАРАНТИРОВАННО убираем скобки из hostname для Node.js
    const pureHostname = parsed.hostname.replace(/[\[\]]/g, '')
    
    const options = {
      hostname: pureHostname, 
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: (parsed.pathname || '/') + (parsed.search || ''),
      method: 'HEAD',
      timeout: 5000,
      rejectUnauthorized: false,
    }

    // Если это IPv6 (содержит двоеточие), принудительно ставим family: 6
    if (pureHostname.includes(':')) {
      options.family = 6
    }

    const respond = (status, code) => {
      if (res.headersSent) return
      res.writeHead(200)
      res.end(JSON.stringify(code ? { status, code } : { status }))
    }

    try {
      const proxyReq = lib.request(options, (proxyRes) => {
        proxyRes.resume() // consume body
        respond('up', proxyRes.statusCode)
      })

      proxyReq.on('error', (err) => {
        console.error(`Status check failed for ${targetUrl}:`, err.code, err.message)
        // ECONNREFUSED often means the host is up but service is down. 
        // In many homelab contexts, this is considered "up" (host is alive).
        // But let's stick to the original logic or improve it.
        respond(err.code === 'ECONNREFUSED' ? 'up' : 'down')
      })

      proxyReq.on('timeout', () => {
        console.warn(`Status check timeout for ${targetUrl}`)
        proxyReq.destroy()
        respond('down')
      })

      proxyReq.end()
    } catch (err) {
      console.error(`Request creation failed for ${targetUrl}:`, err)
      respond('down')
    }
    return
  }

  // /api/ping?host=... — ICMP ping
  if (req.method === 'GET' && path === '/api/ping') {
    let host
    try {
      const params = new URL(req.url, 'http://localhost').searchParams
      host = params.get('host')
    } catch (e) {
      res.writeHead(400); res.end(JSON.stringify({ status: 'error', message: 'invalid request url' })); return
    }

    if (!host || !/^[a-zA-Z0-9:.[\]-]+$/.test(host)) {
      res.writeHead(400)
      res.end(JSON.stringify({ status: 'error', message: 'invalid host' }))
      return
    }

    // Remove brackets for ping command if present
    const cleanHost = host.replace(/[\[\]]/g, '')
    const isV6 = cleanHost.includes(':')
    
    // В Alpine с iputils-ping лучше явно указывать -6 для IPv6
    const cmd = isV6
      ? `ping -6 -c 1 -W 3 ${cleanHost}`
      : `ping -c 1 -W 3 ${cleanHost}`

    exec(cmd, (error, stdout, stderr) => {
      if (res.headersSent) return
      if (error) {
        console.warn(`[Ping Failed] host: ${cleanHost}, error: ${error.message}, stderr: ${stderr.trim()}`)
      }
      res.writeHead(200)
      res.end(JSON.stringify({ status: error ? 'down' : 'up' }))
    })
    return
  }

  res.writeHead(404)
  res.end(JSON.stringify({ error: 'not found' }))
})

// Prevent process crash on unhandled errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Status API listening on 0.0.0.0:${PORT}`)
})
