const http = require('http');
const WebSocket = require('ws');
const url = require('url');

// Load environment variables
require('dotenv').config();

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

// OpenAI Realtime API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_WS_URL = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01';

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not found in environment variables');
  process.exit(1);
}

console.log('✅ OpenAI API key configured');

wss.on('connection', (ws, req) => {
  const query = url.parse(req.url, true).query;
  const sessionId = Date.now().toString();
  
  console.log(`🔌 New WebSocket connection: ${sessionId}`);
  console.log(`📋 Query params:`, query);
  
  // Create OpenAI Realtime API connection
  const openaiWs = new WebSocket(OPENAI_WS_URL, {
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'OpenAI-Beta': 'realtime=v1'
    }
  });

  // Store session
  activeSessions.set(sessionId, {
    ws: ws,
    openaiWs: openaiWs,
    startTime: Date.now(),
    audioChunks: 0,
    initialPacketReceived: false
  });

  // Handle OpenAI WebSocket connection
  openaiWs.on('open', () => {
    console.log(`🤖 [${sessionId}] OpenAI connection established`);
    
    // Configure OpenAI session
    openaiWs.send(JSON.stringify({
      type: 'session.update',
      session: {
        model: 'gpt-4o-realtime-preview-2024-10-01',
        modalities: ['text', 'audio'],
        voice: 'alloy',
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1'
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500
        },
        instructions: "You are a helpful healthcare assistant. You can help patients with general health questions, schedule appointments, and provide basic medical information. Be professional, empathetic, and helpful.",
        temperature: 0.7,
        max_response_output_tokens: 4096
      }
    }));
    
    // Send welcome message to caller
    ws.send(JSON.stringify({
      type: 'connection_established',
      sessionId: sessionId,
      message: 'Connected to Healthcare Assistant'
    }));
  });

  openaiWs.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      // Handle OpenAI responses
      if (message.type === 'response.audio.delta' && message.delta) {
        // Convert OpenAI audio response to Ozonetel format
        const audioData = Buffer.from(message.delta, 'base64');
        const samples = [];
        
        // Convert buffer to 16-bit PCM samples
        for (let i = 0; i < audioData.length; i += 2) {
          samples.push(audioData.readInt16LE(i));
        }
        
        const responsePacket = {
          event: 'media',
          type: 'media',
          ucid: query.ucid,
          data: {
            samples: samples,
            bitsPerSample: 16,
            sampleRate: 8000,
            channelCount: 1,
            numberOfFrames: samples.length,
            type: 'data'
          }
        };
        
        ws.send(JSON.stringify(responsePacket));
      }
      
      // Log other OpenAI messages
      if (message.type !== 'response.audio.delta') {
        console.log(`🤖 [${sessionId}] OpenAI:`, message.type);
      }
    } catch (error) {
      console.error(`❌ [${sessionId}] Error processing OpenAI response:`, error);
    }
  });

  openaiWs.on('error', (error) => {
    console.error(`❌ [${sessionId}] OpenAI WebSocket error:`, error);
  });

  openaiWs.on('close', () => {
    console.log(`🤖 [${sessionId}] OpenAI connection closed`);
  });

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
          
          if (session.audioChunks % 50 === 0) {
            console.log(`🎤 [${sessionId}] Audio chunk ${session.audioChunks}: ${audioData.numberOfFrames} frames`);
          }
          
          // Convert PCM samples to buffer for OpenAI
          const pcmSamples = audioData.samples;
          const audioBuffer = Buffer.alloc(pcmSamples.length * 2);
          for (let i = 0; i < pcmSamples.length; i++) {
            audioBuffer.writeInt16LE(pcmSamples[i], i * 2);
          }
          
          // Send audio to OpenAI Realtime API
          if (session.openaiWs && session.openaiWs.readyState === WebSocket.OPEN) {
            const base64Audio = audioBuffer.toString('base64');
            session.openaiWs.send(JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: base64Audio
            }));
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
      
      // Close OpenAI connection
      if (session.openaiWs) {
        session.openaiWs.close();
      }
      
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
  console.log(`✅ Ready for Ozonetel connections with OpenAI integration`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server error:', error);
});

wss.on('error', (error) => {
  console.error('❌ WebSocket server error:', error);
}); 