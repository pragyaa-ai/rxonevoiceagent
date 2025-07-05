const WebSocket = require('ws');
const https = require('https');

// Create WebSocket server
const wss = new WebSocket.Server({ port: 8080 });

console.log('🎧 WebSocket server started on port 8080');
console.log('🔗 Use this URL in your XML: ws://localhost:8080');

// Store active sessions
const activeSessions = new Map();

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const sessionId = Date.now().toString();
  
  console.log(`🔌 New connection: ${sessionId}`);
  console.log(`📋 Query params:`, url.searchParams);
  
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
    message: 'Connected to WebSocket server'
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

  // Keep connection alive
  const keepAlive = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    } else {
      clearInterval(keepAlive);
    }
  }, 30000);
});

// Handle server errors
wss.on('error', (error) => {
  console.error('❌ WebSocket server error:', error);
});

console.log('✅ WebSocket server ready for Ozonetel connections');
console.log('🔄 To test: Update your XML endpoint to use ws://localhost:8080'); 