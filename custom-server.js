const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const WebSocket = require('ws');
const { spawn } = require('child_process');

// Load environment variables
require('dotenv').config();

// Initialize Librosa Audio Processor (Python child process)
let audioProcessor = null;
let processorReady = false;
const pendingAudioRequests = new Map();
let requestCounter = 0;

function initializeAudioProcessor() {
  console.log('🎵 Starting Librosa Audio Processor...');
  
  audioProcessor = spawn('python3', ['audio_processor.py'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  audioProcessor.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        try {
          const response = JSON.parse(line);
          const requestId = response.requestId;
          
          if (pendingAudioRequests.has(requestId)) {
            const { resolve, reject } = pendingAudioRequests.get(requestId);
            pendingAudioRequests.delete(requestId);
            
            if (response.success) {
              resolve(response.samples);
            } else {
              reject(new Error(response.error));
            }
          }
        } catch (e) {
          console.log(`[Audio-Librosa] ${line}`);
        }
      }
    });
  });

  audioProcessor.stderr.on('data', (data) => {
    console.log(`[Audio-Librosa] ${data.toString().trim()}`);
  });

  audioProcessor.on('close', (code) => {
    console.log(`❌ Audio processor exited with code ${code}`);
    processorReady = false;
  });

  audioProcessor.on('error', (error) => {
    console.error(`❌ Audio processor error:`, error);
    processorReady = false;
  });

  // Give it a moment to start
  setTimeout(() => {
    processorReady = true;
    console.log('✅ Librosa Audio Processor ready for high-quality resampling');
  }, 2000);
}

// Audio processing functions using Librosa
function processAudioWithLibrosa(samples, operation) {
  return new Promise((resolve, reject) => {
    if (!processorReady || !audioProcessor) {
      reject(new Error('Audio processor not ready'));
      return;
    }

    const requestId = ++requestCounter;
    pendingAudioRequests.set(requestId, { resolve, reject });

    const request = {
      requestId,
      operation,
      samples
    };

    try {
      audioProcessor.stdin.write(JSON.stringify(request) + '\n');
    } catch (error) {
      pendingAudioRequests.delete(requestId);
      reject(error);
    }
  });
}

async function convertPCM24kTo8k_HighQuality(samples) {
  return await processAudioWithLibrosa(samples, 'downsample_24k_to_8k');
}

async function convertPCM8kTo24k_HighQuality(samples) {
  return await processAudioWithLibrosa(samples, 'upsample_8k_to_24k');
}

function getAudioQualityMetrics(inputSamples, outputSamples) {
  const inputRMS = Math.sqrt(inputSamples.reduce((sum, sample) => sum + sample * sample, 0) / inputSamples.length);
  const outputRMS = Math.sqrt(outputSamples.reduce((sum, sample) => sum + sample * sample, 0) / outputSamples.length);
  
  return {
    inputLength: inputSamples.length,
    outputLength: outputSamples.length,
    inputRMS: inputRMS,
    outputRMS: outputRMS,
    dynamicRange: outputRMS > 0 ? 20 * Math.log10(32767 / outputRMS) : 0,
    conversionRatio: outputSamples.length / inputSamples.length
  };
}

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Store active telephony sessions
const activeTelephonySessions = new Map();

// Helper function for batch processing audio
async function processAndSendAudioBatch(session, sessionId, pcmSamples) {
  if (pcmSamples.length === 0) return;
  
  try {
    // High-quality upsampling from 8kHz to 24kHz with librosa
    const upsampledSamples = await convertPCM8kTo24k_HighQuality(pcmSamples);
    
    // Convert to buffer
    const audioBuffer = Buffer.alloc(upsampledSamples.length * 2);
    for (let i = 0; i < upsampledSamples.length; i++) {
      audioBuffer.writeInt16LE(upsampledSamples[i], i * 2);
    }
    
    // Send to OpenAI
    if (session.openaiWs && session.openaiWs.readyState === WebSocket.OPEN) {
      const base64Audio = audioBuffer.toString('base64');
      session.openaiWs.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: base64Audio
      }));
    }
  } catch (error) {
    console.error(`❌ [${sessionId}] Audio upsampling error:`, error);
  }
}

// Self-correcting loop for smooth audio playback
async function processPlaybackBuffer(session, ws, ucid, sessionId) {
  // Stop if the session or websocket has ended
  if (!activeTelephonySessions.has(sessionId) || ws.readyState !== WebSocket.OPEN) {
    if (session.playbackTimeout) clearTimeout(session.playbackTimeout);
    session.playbackTimeout = null;
    return;
  }
  
  const SAMPLES_PER_20MS_24k = 480; // 24000Hz * 0.020s
  if (session.playbackBuffer.length >= SAMPLES_PER_20MS_24k) {
    const chunkToProcess = session.playbackBuffer.splice(0, SAMPLES_PER_20MS_24k);
    
    try {
      const downsampledSamples = await convertPCM24kTo8k_HighQuality(chunkToProcess);
      const responsePacket = {
        event: 'media', type: 'media', ucid: ucid,
        data: {
          samples: downsampledSamples, bitsPerSample: 16, sampleRate: 8000,
          channelCount: 1, numberOfFrames: downsampledSamples.length, type: 'data'
        }
      };
      ws.send(JSON.stringify(responsePacket));
    } catch (error) {
      console.error(`❌ [${sessionId}] Audio downsampling error during playback:`, error);
    }
  }

  // Schedule the next execution
  session.playbackTimeout = setTimeout(() => processPlaybackBuffer(session, ws, ucid, sessionId), 20);
}

// OpenAI API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not found in environment variables');
  process.exit(1);
}

console.log('✅ OpenAI API key configured for healthcare agents');
console.log('🎵 RxOne Healthcare VoiceAgent v2.8 - Librosa Audio Processing Enabled');

// Initialize Librosa audio processor
initializeAudioProcessor();

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

  // Create WebSocket server for telephony on the same port
  const wss = new WebSocket.Server({ 
    server,
    path: '/ws/ozonetel'
  });

  console.log('🏥 Healthcare telephony WebSocket server initializing...');

  wss.on('connection', async (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const sessionId = Date.now().toString();
    const phoneNumber = url.searchParams.get('phone');
    const ucid = url.searchParams.get('ucid');
    
    console.log(`📞 [${sessionId}] New telephony connection`);
    console.log(`📋 [${sessionId}] Phone: ${phoneNumber}, UCID: ${ucid}`);
    console.log(`🔗 [${sessionId}] Remote: ${req.socket.remoteAddress}`);

    try {
      // Initialize healthcare agent session
      console.log(`🏥 [${sessionId}] Initializing healthcare agent system...`);
      
      // Create OpenAI Realtime WebSocket connection
      const openaiWs = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01', {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'realtime=v1'
        }
      });

      // Store session info
      activeTelephonySessions.set(sessionId, {
        ws: ws,
        openaiWs: openaiWs,
        startTime: Date.now(),
        audioChunks: 0,
        phoneNumber: phoneNumber,
        ucid: ucid,
        agentReady: false,
      });

      // Handle OpenAI connection establishment
      openaiWs.on('open', () => {
        console.log(`🤖 [${sessionId}] OpenAI Realtime API connected`);
        
        // Configure session with healthcare agent
        const healthcareAgentConfig = {
          type: 'session.update',
          session: {
            model: 'gpt-4o-realtime-preview-2024-10-01',
            modalities: ['text', 'audio'],
            voice: 'sage', // Professional voice for healthcare
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
            instructions: `You are a patient services representative for Sagar Hospitals. 

ALWAYS start every conversation with this exact English greeting:
"Namaste! Welcome to Sagar Hospitals. I'm here to help you with your healthcare needs. May I know your name, please?"

After the initial greeting, adapt to the user's language preference:
- If they respond in Hindi, switch to Hindi
- If they respond in Kannada, switch to Kannada  
- Otherwise, continue in English

Ask for their name and phone number, then understand what they need and respond appropriately:
- For appointment booking: Help schedule appointments with our specialists
- For emergencies: Provide immediate guidance and emergency contact information
- For medical consultations: Provide general guidance with proper disclaimers

Hospital Information - Sagar Hospitals:
Locations:
- Jayanagar: #44/54, 30th Cross Road, Tilak Nagar, Jayanagar, Bengaluru - 560 041
- Banashankari: Behind DSI campus, Shavige Malleshwara Hills, Kumaraswamy Layout, Bengaluru- 560 078

Contact:
- Emergency: 42888100/42999100
- Appointments: 080 69555555

Key Features:
- 4+ decades experience, 250+ doctors
- 24/7 emergency care, ICU, ambulance
- Major Institutes: Brain & Spine, Heart & Vascular, Bone & Joint
- Organ Transplant Centre

Always speak in Indian English, Hindi, or Kannada only. Never use any other languages or scripts.
Be professional, empathetic, and helpful in all interactions.`,
            temperature: 0.7,
            max_response_output_tokens: 4096
          }
        };

        openaiWs.send(JSON.stringify(healthcareAgentConfig));
        
        // Mark agent as ready
        const session = activeTelephonySessions.get(sessionId);
        if (session) {
          session.agentReady = true;
          console.log(`🏥 [${sessionId}] Healthcare agent configured and ready`);
        }
      });

      // Handle OpenAI responses (AI speaking to caller)
      openaiWs.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          const session = activeTelephonySessions.get(sessionId);

          // Handle audio responses from AI and add to playback buffer
          if (message.type === 'response.audio.delta' && message.delta && session) {
            const audioData = Buffer.from(message.delta, 'base64');
            const samples = [];
            for (let i = 0; i < audioData.length; i += 2) {
              samples.push(audioData.readInt16LE(i));
            }
            
            // Downsample and send immediately, no buffering
            const downsampledSamples = await convertPCM24kTo8k_HighQuality(samples);
            const responsePacket = {
                event: 'media', type: 'media', ucid: ucid,
                data: {
                  samples: downsampledSamples, bitsPerSample: 16, sampleRate: 8000,
                  channelCount: 1, numberOfFrames: downsampledSamples.length, type: 'data'
                }
              };
            ws.send(JSON.stringify(responsePacket));
          }
          
          // Log other important messages
          if (message.type === 'session.updated') {
            console.log(`🤖 [${sessionId}] Healthcare agent session ready`);
          } else if (message.type === 'response.done') {
            console.log(`🏥 [${sessionId}] Healthcare agent response completed`);
          } else if (message.type !== 'response.audio.delta') {
            console.log(`🤖 [${sessionId}] OpenAI message:`, JSON.stringify(message, null, 2));
          }
          
        } catch (error) {
          console.error(`❌ [${sessionId}] Error processing OpenAI response:`, error);
        }
      });

      openaiWs.on('error', (error) => {
        console.error(`❌ [${sessionId}] OpenAI connection error:`, error);
      });

      openaiWs.on('close', () => {
        console.log(`🤖 [${sessionId}] OpenAI connection closed`);
      });

    } catch (error) {
      console.error(`❌ [${sessionId}] Error initializing healthcare agent:`, error);
    }

    // Handle incoming messages from Ozonetel
    ws.on('message', async (data) => {
      const session = activeTelephonySessions.get(sessionId);
      if (!session) return;

      try {
        const message = JSON.parse(data.toString());
        
        // Handle call start
        if (message.event === 'start') {
          console.log(`🎉 [${sessionId}] Healthcare call started`);
          ws.send(JSON.stringify({
            event: 'call_connected',
            data: { status: 'connected', message: 'Healthcare agent ready' }
          }));
          return;
        }

        // Handle audio from caller
        if (message.event === 'media' && message.type === 'media') {
          const audioData = message.data;
          
          // Skip initial 16kHz packet
          if (audioData.sampleRate === 16000) {
            console.log(`🎵 [${sessionId}] Initial audio packet (ignoring)`);
            return;
          }
          
          // Process 8kHz audio packets (no batching)
          if (audioData.sampleRate === 8000 && session.agentReady) {
            session.audioChunks++;
            
            const pcmSamples = audioData.samples;
            await processAndSendAudioBatch(session, sessionId, pcmSamples);
          }
        }

        // Handle call stop
        if (message.event === 'stop') {
          console.log(`👋 [${sessionId}] Healthcare call ended`);

          if (session.openaiWs) { session.openaiWs.close(); }
          ws.close();
        }

      } catch (error) {
        console.error(`❌ [${sessionId}] Error processing message:`, error);
      }
    });

    ws.on('close', (code, reason) => {
      const session = activeTelephonySessions.get(sessionId);
      if (session) {
        const duration = Date.now() - session.startTime;
        console.log(`🔌 [${sessionId}] Telephony session closed after ${duration}ms`);
        console.log(`📊 [${sessionId}] Total audio chunks processed: ${session.audioChunks}`);
        
        // Stop playback interval and close connections
        if (session.openaiWs) { session.openaiWs.close(); }
        
        activeTelephonySessions.delete(sessionId);
      }
    });

    ws.on('error', (error) => {
      console.error(`❌ [${sessionId}] WebSocket error:`, error);
    });
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`🚀 Healthcare telephony server ready on http://${hostname}:${port}`);
    console.log(`🏥 Telephony WebSocket ready on ws://${hostname}:${port}/ws/ozonetel`);
    console.log(`📞 Ready for Sagar Hospitals healthcare calls with Librosa audio processing`);
  });
});

// Cleanup on process exit
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  if (audioProcessor) {
    audioProcessor.kill();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  if (audioProcessor) {
    audioProcessor.kill();
  }
  process.exit(0);
}); 