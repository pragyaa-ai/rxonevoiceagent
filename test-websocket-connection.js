const WebSocket = require('ws');

const GCP_VM_IP = '34.100.243.161';
const WS_URL = `ws://${GCP_VM_IP}:8080/`;

console.log('🔗 Testing WebSocket connection to GCP VM...');
console.log(`🌐 URL: ${WS_URL}`);

function testWebSocketConnection() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    
    ws.on('open', () => {
      console.log('✅ WebSocket connection established');
      
      // Test sending a message (simulating what Ozonetel would do)
      const testMessage = {
        type: 'session.create',
        session: {
          model: 'gpt-4o-realtime-preview',
          voice: 'alloy'
        }
      };
      
      console.log('📤 Sending test message...');
      ws.send(JSON.stringify(testMessage));
      
      // Wait for response
      setTimeout(() => {
        console.log('⏱️  Connection maintained for 5 seconds');
        ws.close();
        resolve(true);
      }, 5000);
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        console.log('📥 Received message:', message.type || 'unknown');
        if (message.error) {
          console.error('❌ Error in message:', message.error);
        }
      } catch (e) {
        console.log('📥 Received raw data:', data.toString());
      }
    });
    
    ws.on('close', (code, reason) => {
      console.log(`🔚 WebSocket closed: ${code} - ${reason}`);
      resolve(false);
    });
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error.message);
      reject(error);
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      console.log('⏰ Test timeout');
      ws.terminate();
      reject(new Error('Connection timeout'));
    }, 10000);
  });
}

// Test multiple connections (simulating multiple calls)
async function runTests() {
  console.log('🚀 Starting WebSocket connection tests...\n');
  
  for (let i = 1; i <= 3; i++) {
    console.log(`\n--- Test ${i} ---`);
    try {
      await testWebSocketConnection();
      console.log(`✅ Test ${i} passed`);
    } catch (error) {
      console.log(`❌ Test ${i} failed:`, error.message);
    }
    
    // Wait 2 seconds between tests
    if (i < 3) {
      console.log('⏳ Waiting 2 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n🎯 DIAGNOSIS:');
  console.log('  If tests pass: WebSocket server is working');
  console.log('  If tests fail: WebSocket server configuration issue');
  console.log('  If tests timeout: Connection/firewall issue');
}

runTests().catch(console.error); 