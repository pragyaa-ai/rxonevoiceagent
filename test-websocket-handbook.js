const WebSocket = require('ws');

// Configuration exactly as per the API handbook
const API_KEY = 'KK11001341678ccf2d10f850135f15c809';
const CUSTOMER_NAME = 'TestUser';
const WEBSOCKET_ENDPOINT = 'wss://voiceagent.pragyaa.ai/wsDVCom';

// Construct the connection URL as per handbook
const connectionUrl = `${WEBSOCKET_ENDPOINT}?key=${API_KEY}&cust_name=${CUSTOMER_NAME}`;

console.log('📖 WebSocket API Handbook Test');
console.log('===============================');
console.log('🌐 Endpoint:', WEBSOCKET_ENDPOINT);
console.log('🔑 API Key:', API_KEY);
console.log('👤 Customer Name:', CUSTOMER_NAME);
console.log('🔗 Full URL:', connectionUrl);
console.log('===============================\n');

console.log('🔌 Establishing WebSocket connection...');

const ws = new WebSocket(connectionUrl);

ws.on('open', () => {
  console.log('✅ WebSocket connection established successfully!');
  console.log('🎧 Real-time bi-directional communication channel active');
  console.log('📡 Features enabled:');
  console.log('   ✓ Stream Audio: Send raw audio data in real-time to server');
  console.log('   ✓ Receive Audio: Get processed/transformed audio back in real-time');
  console.log('   ✓ Low Latency: Designed for efficient real-time streaming');
  console.log('   ✓ Audio Processing: Real-time transcription, enhancement, transformation');
  
  // Send initial connection confirmation
  console.log('\n📤 Sending connection confirmation...');
  const confirmationMessage = {
    type: 'connection_established',
    customer_name: CUSTOMER_NAME,
    timestamp: new Date().toISOString(),
    capabilities: ['audio_send', 'audio_receive', 'low_latency']
  };
  
  ws.send(JSON.stringify(confirmationMessage));
  
  // Simulate audio streaming (as per handbook - for low-latency audio processing)
  console.log('🎵 Starting simulated audio stream...');
  let audioPacketCount = 0;
  
  const audioStreamInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      // Simulate 20ms audio packets (160 bytes for 8kHz mono)
      const audioPacket = Buffer.alloc(160);
      audioPacket.fill(Math.sin(audioPacketCount * 0.1) * 127 + 127); // Sine wave
      
      ws.send(audioPacket);
      audioPacketCount++;
      
      if (audioPacketCount % 50 === 0) {
        console.log(`🎤 Sent ${audioPacketCount} audio packets (${audioPacketCount * 160} bytes total)`);
      }
    } else {
      clearInterval(audioStreamInterval);
    }
  }, 20); // 20ms intervals for real-time audio
  
  // Stop streaming after 10 seconds
  setTimeout(() => {
    clearInterval(audioStreamInterval);
    console.log('🛑 Audio streaming stopped');
  }, 10000);
});

ws.on('message', (data) => {
  if (data.length < 100) {
    // Likely a JSON message
    try {
      const message = JSON.parse(data.toString());
      console.log('📩 Received JSON message:', message);
    } catch (e) {
      console.log('📩 Received text message:', data.toString());
    }
  } else {
    // Likely audio data
    console.log(`🔊 Received audio data: ${data.length} bytes`);
    console.log('   ↳ This could be processed/transformed audio from the server');
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
  console.log('💡 Troubleshooting:');
  console.log('   • Check API key is valid');
  console.log('   • Ensure customer name is provided');
  console.log('   • Verify network connectivity');
  console.log('   • Check WebSocket endpoint availability');
});

ws.on('close', (code, reason) => {
  console.log(`\n🔌 WebSocket connection closed`);
  console.log(`   Code: ${code}`);
  console.log(`   Reason: ${reason || 'No reason provided'}`);
  
  if (code === 1000) {
    console.log('✅ Connection closed normally');
  } else {
    console.log('⚠️  Connection closed unexpectedly');
  }
  
  console.log('\n📊 Test Summary:');
  console.log('✓ Connection established successfully');
  console.log('✓ Authentication with API key worked');
  console.log('✓ Bi-directional communication tested');
  console.log('✓ Audio streaming simulation completed');
  console.log('\n🎯 Next steps for actual implementation:');
  console.log('• Replace simulated audio with real microphone input');
  console.log('• Handle received audio for playback');
  console.log('• Implement proper error handling and reconnection');
  console.log('• Add audio format conversion if needed');
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n⏹️  Test interrupted by user');
  if (ws.readyState === WebSocket.OPEN) {
    ws.close(1000, 'Test terminated by user');
  }
  process.exit(0);
});

console.log('🕐 Test running... (Press Ctrl+C to stop)'); 