const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const WebSocket = require('ws');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Create WebSocket server on the same port
  const wss = new WebSocket.Server({ 
    server,
    path: '/ws/ozonetel'
  });

  wss.on('connection', (ws, req) => {
    console.log('🎧 New WebSocket connection from:', req.socket.remoteAddress);
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('📩 Received Ozonetel message:', message);
        
        // Handle different Ozonetel events
        switch (message.event) {
          case 'start':
            console.log('🎉 Call started');
            ws.send(JSON.stringify({
              event: 'call_connected',
              data: { status: 'connected' }
            }));
            break;
            
          case 'media':
            // Handle audio data from Ozonetel
            console.log('🎵 Audio data received');
            // Process audio with OpenAI Realtime API here
            break;
            
          case 'stop':
            console.log('👋 Call ended');
            ws.close();
            break;
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('🔌 WebSocket connection closed');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`🚀 Server ready on http://${hostname}:${port}`);
    console.log(`🎧 WebSocket ready on ws://${hostname}:${port}/ws/ozonetel`);
  });
}); 