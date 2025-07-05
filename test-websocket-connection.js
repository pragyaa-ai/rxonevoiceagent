const WebSocket = require('ws');

// Test WebSocket connection to your GCP VM
const wsUrl = 'ws://34.100.243.161:8080/?cust_name=TestUser&key=KK11001341678ccf2d10f850135f15c809&phone_no=919999984076&ucid=test123';

console.log('🧪 Testing WebSocket connection...');
console.log(`🔗 Connecting to: ${wsUrl}`);

const ws = new WebSocket(wsUrl);

ws.on('open', () => {
  console.log('✅ WebSocket connected successfully!');
  console.log('📝 Connection details:');
  console.log(`   - URL: ${wsUrl}`);
  console.log(`   - ReadyState: ${ws.readyState}`);
  
  // Send a test message
  const testMessage = {
    type: 'test',
    message: 'Hello from test client',
    timestamp: new Date().toISOString()
  };
  
  ws.send(JSON.stringify(testMessage));
  console.log('📤 Sent test message:', testMessage);
  
  // Close after 3 seconds
  setTimeout(() => {
    console.log('🔚 Closing connection...');
    ws.close();
  }, 3000);
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('📥 Received message:', message);
  } catch (error) {
    console.log('📥 Received raw data:', data.toString());
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
  console.error('🔍 This might be why Ozonetel can\'t connect!');
  console.error('💡 Check:');
  console.error('   - WebSocket server is running on GCP VM');
  console.error('   - Environment variables (.env file) are set');
  console.error('   - OpenAI API key is valid');
  console.error('   - Server has proper error handling');
});

ws.on('close', (code, reason) => {
  console.log(`🔚 WebSocket closed. Code: ${code}, Reason: ${reason || 'No reason provided'}`);
  if (code !== 1000) {
    console.error('⚠️  Abnormal close code. This indicates an issue.');
  } else {
    console.log('✅ Clean close - WebSocket server is working properly!');
  }
  process.exit(0);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error('⏰ Connection timeout - WebSocket server may not be responding');
  console.error('🔍 Check if WebSocket server is running on GCP VM port 8080');
  ws.close();
  process.exit(1);
}, 10000); 