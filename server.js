const http = require('http');
const WebSocket = require('ws');
const url = require('url');

// Create HTTP server
const server = http.createServer((req, res) => {
  // Handle HTTP requests
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WebSocket server is running');
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

console.log('🎧 HTTP + WebSocket server starting...');

// Store active sessions
const activeSessions = new Map();

wss.on('connection', (ws, req) => {
  const query = url.parse(req.url, true).query;
  const sessionId = Date.now().toString();
  
  console.log(`🔌 New WebSocket connection: ${sessionId}`);
  console.log(`📋 Query params:`, query);
  
  // Store session
  activeSessions.set(sessionId, {
    ws: ws,
    startTime: Date.now(),
    audioChunks: 0,
    initialPacketReceived: false
  });

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connection_established',
    sessionId: sessionId,
    message: 'Connected to Ozonetel audio stream handler'
  }));

  ws.on('message', (data) => {
    const session = activeSessions.get(sessionId);
    if (!session) return;

    try {
      // Parse Ozonetel audio data format
      const message = JSON.parse(data.toString());
      
      // Handle Ozonetel media packets
      if (message.event === 'media' && message.type === 'media') {
        const audioData = message.data;
        
        // Check if this is the initial packet (sampleRate 16000) - can be ignored
        if (audioData.sampleRate === 16000) {
          console.log(`🎵 [${sessionId}] Initial audio packet received (ignoring as per spec)`);
          session.initialPacketReceived = true;
          return;
        }
        
        // Process subsequent packets (sampleRate 8000)
        if (audioData.sampleRate === 8000) {
          session.audioChunks++;
          
          console.log(`🎤 [${sessionId}] Audio chunk ${session.audioChunks}: ${audioData.numberOfFrames} frames, ${audioData.samples.length} samples`);
          
          // Log audio specs
          if (session.audioChunks === 1) {
            console.log(`📊 [${sessionId}] Audio specs: ${audioData.bitsPerSample}-bit, ${audioData.sampleRate}Hz, ${audioData.channelCount} channel(s)`);
          }
          
          // Process the PCM audio samples
          const pcmSamples = audioData.samples;
          
          // Convert PCM samples to audio buffer (for OpenAI processing)
          const audioBuffer = Buffer.alloc(pcmSamples.length * 2); // 16-bit = 2 bytes per sample
          for (let i = 0; i < pcmSamples.length; i++) {
            audioBuffer.writeInt16LE(pcmSamples[i], i * 2);
          }
          
          // TODO: Send to OpenAI Realtime API for processing
          // For now, just log the audio data
          if (session.audioChunks % 50 === 0) {
            console.log(`🔊 [${sessionId}] Processed ${session.audioChunks} audio chunks`);
          }
          
          // Echo back some audio data (for testing)
          // Send back silence or processed audio
          if (session.audioChunks % 25 === 0) {
            const responseFrames = 80; // Standard frame size for 8kHz
            const silentSamples = new Array(responseFrames).fill(0);
            
            const responsePacket = {
              event: 'media',
              type: 'media',
              ucid: message.ucid,
              data: {
                samples: silentSamples,
                bitsPerSample: 16,
                sampleRate: 8000,
                channelCount: 1,
                numberOfFrames: responseFrames,
                type: 'data'
              }
            };
            
            ws.send(JSON.stringify(responsePacket));
          }
        }
      } else {
        // Handle other message types
        console.log(`📩 [${sessionId}] Message:`, message);
      }
    } catch (error) {
      // Handle non-JSON data
      console.log(`📦 [${sessionId}] Binary data received: ${data.length} bytes`);
    }
  });

  ws.on('close', (code, reason) => {
    const session = activeSessions.get(sessionId);
    if (session) {
      const duration = Date.now() - session.startTime;
      console.log(`🔌 [${sessionId}] Connection closed after ${duration}ms`);
      console.log(`📊 [${sessionId}] Total audio chunks: ${session.audioChunks}`);
      activeSessions.delete(sessionId);
    }
  });

  ws.on('error', (error) => {
    console.error(`❌ [${sessionId}] WebSocket error:`, error);
  });
});

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 HTTP health check: http://localhost:${PORT}/health`);
  console.log(`🎧 WebSocket endpoint: ws://localhost:${PORT}/`);
  console.log(`✅ Ready for Ozonetel connections`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server error:', error);
});

wss.on('error', (error) => {
  console.error('❌ WebSocket server error:', error);
}); 