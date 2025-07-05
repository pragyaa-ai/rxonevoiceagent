const WebSocket = require('ws');
const https = require('https');
const http = require('http');

// Configuration from the API handbook
const config = {
  // WebSocket endpoint from handbook
  websocketUrl: 'wss://voiceagent.pragyaa.ai/wsDVCom',
  apiKey: 'KK11001341678ccf2d10f850135f15c809', // YOUR_API_KEY
  customerName: 'TestUser', // CUSTOMER_NAME
  phoneNumber: '+919999984076', // Your phone number
  applicationUrl: 'http://localhost:3000' // Your Next.js app
};

// Function to initiate a test call via your application
function triggerTestCallViaApp() {
  console.log('🚀 Triggering test call via application...');
  
  // Call your application's Ozonetel API endpoint
  const postData = JSON.stringify({
    event: 'start',
    ucid: 'test-' + Date.now(),
    data: {
      phoneNumber: config.phoneNumber,
      callerId: '04048353553',
      testCall: true
    }
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/telephony/ozonetel',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': postData.length
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📱 Application response:', data);
      
      // Now connect to WebSocket for audio streaming
      setTimeout(connectToWebSocket, 2000);
    });
  });

  req.on('error', (error) => {
    console.error('❌ Application request error:', error.message);
    console.log('🔄 Proceeding with WebSocket test anyway...');
    setTimeout(connectToWebSocket, 1000);
  });

  req.write(postData);
  req.end();
}

// Function to connect to WebSocket as per handbook
function connectToWebSocket() {
  console.log('\n🔌 Connecting to WebSocket for audio streaming...');
  
  // Connection URL as per handbook: wss://voiceagent.pragyaa.ai/wsDVCom?key=<YOUR_API_KEY>&cust_name=<CUSTOMER_NAME>
  const wsUrl = `${config.websocketUrl}?key=${config.apiKey}&cust_name=${config.customerName}`;
  
  console.log(`🌐 WebSocket URL: ${wsUrl}`);
  
  const ws = new WebSocket(wsUrl);

  ws.on('open', () => {
    console.log('✅ WebSocket connection established to DVCOM.');
    console.log('🎧 Ready for real-time bi-directional audio communication.');
    console.log('📡 Features available:');
    console.log('   • Stream Audio: Send raw audio data in real-time');
    console.log('   • Low Latency: Efficient real-time streaming with minimal delay');
    console.log('   • Supported Formats: Real-time audio processing');
    
    // Send a test message to indicate readiness
    const testMessage = {
      type: 'client_ready',
      timestamp: new Date().toISOString(),
      customer_name: config.customerName,
      test_mode: true
    };
    
    ws.send(JSON.stringify(testMessage));
    console.log('📤 Sent client ready message');
  });

  ws.on('message', (data) => {
    try {
      // Try to parse as JSON first
      const message = JSON.parse(data.toString());
      console.log('📩 Received message:', message);
      
      // Handle different message types
      switch (message.type) {
        case 'call_connected':
          console.log('🎉 Call connected! Audio streaming active.');
          break;
        case 'audio_stream_start':
          console.log('🎵 Audio streaming started');
          break;
        case 'call_disconnected':
          console.log('📞 Call disconnected');
          ws.close();
          break;
        case 'error':
          console.error('❌ WebSocket error:', message.data);
          break;
        default:
          console.log('📨 Unknown message type:', message.type);
      }
    } catch (error) {
      // If not JSON, might be raw audio data
      console.log(`🎵 Received audio data: ${data.length} bytes`);
    }
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
  });

  ws.on('close', (code, reason) => {
    console.log(`🔌 WebSocket connection closed. Code: ${code}, Reason: ${reason}`);
    console.log('✅ Test completed.');
  });

  // Keep connection alive for 30 seconds
  setTimeout(() => {
    if (ws.readyState === WebSocket.OPEN) {
      console.log('⏰ Test timeout reached. Closing connection...');
      ws.close();
    }
  }, 30000);

  // Simulate sending audio data every 100ms (as per low-latency streaming)
  const audioInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      // Send simulated audio data (in real scenario, this would be actual audio)
      const simulatedAudio = Buffer.alloc(160); // 160 bytes for 20ms of audio at 8kHz
      simulatedAudio.fill(0); // Silent audio for testing
      
      ws.send(simulatedAudio);
      console.log('🎤 Sent simulated audio chunk (160 bytes)');
    } else {
      clearInterval(audioInterval);
    }
  }, 100);

  // Clear interval when connection closes
  ws.on('close', () => {
    clearInterval(audioInterval);
  });
}

// Start the test
console.log('🧪 Starting WebSocket Audio Streaming Test');
console.log('==========================================');
console.log('📋 Configuration:');
console.log(`   • WebSocket URL: ${config.websocketUrl}`);
console.log(`   • API Key: ${config.apiKey}`);
console.log(`   • Customer Name: ${config.customerName}`);
console.log(`   • Phone Number: ${config.phoneNumber}`);
console.log(`   • Application: ${config.applicationUrl}`);
console.log('==========================================\n');

// First try to trigger a call via the application, then connect WebSocket
triggerTestCallViaApp(); 