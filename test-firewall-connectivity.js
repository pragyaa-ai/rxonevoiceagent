const http = require('http');
const WebSocket = require('ws');

const GCP_VM_IP = '34.100.243.161';

console.log('🔥 Testing firewall connectivity...\n');

// Test HTTP connectivity to port 3000
function testHTTP() {
  return new Promise((resolve) => {
    const req = http.get(`http://${GCP_VM_IP}:3000/api/getXML_dvcom_in_en`, (res) => {
      console.log('✅ Port 3000 (Next.js) - ACCESSIBLE');
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Headers: ${JSON.stringify(res.headers, null, 2)}`);
      resolve(true);
    });
    
    req.on('error', (err) => {
      console.log('❌ Port 3000 (Next.js) - BLOCKED');
      console.log(`   Error: ${err.message}`);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('⏰ Port 3000 (Next.js) - TIMEOUT');
      req.destroy();
      resolve(false);
    });
  });
}

// Test WebSocket connectivity to port 8080
function testWebSocket() {
  return new Promise((resolve) => {
    const ws = new WebSocket(`ws://${GCP_VM_IP}:8080/`);
    
    ws.on('open', () => {
      console.log('✅ Port 8080 (WebSocket) - ACCESSIBLE');
      ws.close();
      resolve(true);
    });
    
    ws.on('error', (err) => {
      console.log('❌ Port 8080 (WebSocket) - BLOCKED');
      console.log(`   Error: ${err.message}`);
      resolve(false);
    });
    
    setTimeout(() => {
      console.log('⏰ Port 8080 (WebSocket) - TIMEOUT');
      ws.terminate();
      resolve(false);
    }, 5000);
  });
}

// Test health check endpoint
function testHealthCheck() {
  return new Promise((resolve) => {
    const req = http.get(`http://${GCP_VM_IP}:8080/health`, (res) => {
      console.log('✅ Port 8080 (Health Check) - ACCESSIBLE');
      console.log(`   Status: ${res.statusCode}`);
      resolve(true);
    });
    
    req.on('error', (err) => {
      console.log('❌ Port 8080 (Health Check) - BLOCKED');
      console.log(`   Error: ${err.message}`);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('⏰ Port 8080 (Health Check) - TIMEOUT');
      req.destroy();
      resolve(false);
    });
  });
}

// Run all tests
async function runTests() {
  console.log('Testing connectivity to GCP VM:', GCP_VM_IP);
  console.log('=' * 50);
  
  const httpResult = await testHTTP();
  console.log('');
  
  const healthResult = await testHealthCheck();
  console.log('');
  
  const wsResult = await testWebSocket();
  console.log('');
  
  console.log('=' * 50);
  console.log('🎯 SUMMARY:');
  console.log(`   Next.js API (3000): ${httpResult ? '✅ WORKING' : '❌ BLOCKED'}`);
  console.log(`   WebSocket (8080): ${wsResult ? '✅ WORKING' : '❌ BLOCKED'}`);
  console.log(`   Health Check (8080): ${healthResult ? '✅ WORKING' : '❌ BLOCKED'}`);
  
  if (httpResult && wsResult) {
    console.log('\n🎉 All ports accessible! Try making a test call now.');
  } else {
    console.log('\n🔥 Firewall rules still needed. Create the custom rules in GCP Console.');
  }
}

runTests().catch(console.error); 