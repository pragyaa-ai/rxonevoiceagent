const WebSocket = require('ws');
const mic = require('mic');
const Speaker = require('speaker');

// Configuration from your .env file
const API_KEY = 'KK11001341678ccf2d10f850135f15c809'; // Your Ozonetel API key
const CUSTOMER_NAME = 'TestUser';
const WS_URL = `wss://voiceagent.pragyaa.ai/wsDVCom?key=${API_KEY}&cust_name=${CUSTOMER_NAME}`;

console.log('Connecting to:', WS_URL);

// Configure microphone input (16kHz mono as per telephony standard)
const micInstance = mic({
  rate: '16000', // Sample rate in Hz - telephony standard
  channels: '1', // Mono audio
  bitwidth: '16',
  encoding: 'signed-integer'
});

const micInputStream = micInstance.getAudioStream();

// Configure speaker output (24kHz for OpenAI responses)
const speaker = new Speaker({
  channels: 1, // Mono
  bitDepth: 16,
  sampleRate: 24000 // OpenAI Realtime API uses 24kHz
});

// Establish WebSocket connection
const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('✅ WebSocket connection established to DVCOM.');
  console.log('🎙️  Starting microphone streaming...');
  console.log('🔊 Speaker ready for responses...');
  console.log('💬 You can now speak and should hear responses from the healthcare agent.');
  console.log('   Expected greeting: "नमस्ते! Welcome to Sagar Hospitals..."');
  console.log('');
  console.log('Press Ctrl+C to stop the test.');

  // Start streaming microphone audio to WebSocket
  micInputStream.on('data', (chunk) => {
    ws.send(chunk);
  });

  micInstance.start();
});

ws.on('message', (data) => {
  console.log(`📡 Received ${data.length} bytes of audio from agent`);
  // Write received audio data to the speaker
  speaker.write(data);
});

ws.on('close', (code, reason) => {
  console.log(`❌ WebSocket connection closed. Code: ${code}, Reason: ${reason}`);
  micInstance.stop();
  speaker.end();
});

ws.on('error', (err) => {
  console.error('🚨 WebSocket error:', err.message);
  console.error('Possible issues:');
  console.error('  - Check if your app is running on localhost:3000');
  console.error('  - Verify API key is correct');
  console.error('  - Ensure WebSocket endpoint is accessible');
  micInstance.stop();
  speaker.end();
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down test client...');
  ws.close();
  micInstance.stop();
  speaker.end();
  process.exit(0);
});

// Handle microphone errors
micInputStream.on('error', (err) => {
  console.error('🎙️  Microphone error:', err.message);
}); 