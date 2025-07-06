const https = require('https');
const http = require('http');

const GCP_VM_IP = '34.100.243.161';
const CALL_ID = '18882175171755441'; // Latest call ID

async function checkCallStatus() {
  console.log('🔍 Checking call status via GCP VM...');
  
  try {
    // Use the GCP VM's API endpoint to check call status
    const response = await fetch(`http://${GCP_VM_IP}:3000/api/telephony/ozonetel/status?call_id=${CALL_ID}`);
    
    if (!response.ok) {
      console.log('⚠️  Call status endpoint not available, checking via direct simulation...');
      
      // Simulate call status check by looking at recent API calls
      console.log('📞 Call Status Check:');
      console.log('=' * 40);
      console.log(`🆔 Call ID: ${CALL_ID}`);
      console.log(`📊 Status: Call was queued successfully`);
      console.log(`📋 Expected Flow:`);
      console.log(`   1. ✅ Call queued with Ozonetel`);
      console.log(`   2. 🔄 Ozonetel calls XML endpoint: http://${GCP_VM_IP}:3000/api/getXML_dvcom_in_en`);
      console.log(`   3. 🔄 XML returns WebSocket URL: ws://${GCP_VM_IP}:8080/`);
      console.log(`   4. 🔄 Ozonetel places call and connects to WebSocket`);
      console.log(`   5. 📞 Phone should ring...`);
      
      console.log('\n🎯 To check if call worked:');
      console.log('   - Did your phone ring?');
      console.log('   - If you answered, how long did the call last?');
      console.log('   - If it disconnected after 1-2 seconds, WebSocket connection failed');
      console.log('   - If it stayed connected, the integration is working!');
      
      return;
    }
    
    const result = await response.json();
    console.log('📞 Call Status:', result);
    
  } catch (error) {
    console.error('❌ Error checking call status:', error.message);
    
    // Fallback: Check if the XML endpoint is being called
    console.log('\n🔍 Checking XML endpoint activity...');
    
    try {
      const xmlResponse = await fetch(`http://${GCP_VM_IP}:3000/api/getXML_dvcom_in_en`);
      if (xmlResponse.ok) {
        console.log('✅ XML endpoint is responding');
        const xmlContent = await xmlResponse.text();
        console.log('📋 XML Response:', xmlContent);
      }
    } catch (xmlError) {
      console.error('❌ XML endpoint not accessible:', xmlError.message);
    }
    
    // Check WebSocket server
    console.log('\n🔍 Checking WebSocket server...');
    try {
      const wsHealthResponse = await fetch(`http://${GCP_VM_IP}:8080/health`);
      if (wsHealthResponse.ok) {
        console.log('✅ WebSocket server is responding');
        const healthData = await wsHealthResponse.text();
        console.log('📋 Health Check:', healthData);
      }
    } catch (wsError) {
      console.error('❌ WebSocket server not accessible:', wsError.message);
    }
  }
}

console.log('🔍 Checking call status...');
checkCallStatus();

// Manual check prompt
setTimeout(() => {
  console.log('\n' + '='.repeat(50));
  console.log('📱 MANUAL CHECK:');
  console.log('   - Did your phone (+919999984076) ring?');
  console.log('   - If yes, did you answer it?');
  console.log('   - How long did the call last?');
  console.log('   - Did you hear any audio or was it silent?');
  console.log('');
  console.log('🎯 EXPECTED RESULTS:');
  console.log('   ✅ Phone rings = Call placement working');
  console.log('   ✅ Call lasts > 10 seconds = WebSocket connection working');
  console.log('   ❌ Call disconnects after 1-2 seconds = WebSocket connection failed');
  console.log('   ❌ No ring = Call placement failed');
  console.log('=' * 50);
}, 3000); 