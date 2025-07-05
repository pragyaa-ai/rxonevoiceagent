// Using built-in fetch (Node.js 18+)

// Configuration
const config = {
  // Your GCP VM's external IP
  gcpVmIp: '34.100.243.161',
  // Phone number to call
  phoneNumber: '+919999984076',
  // Test with different endpoints
  useLocalProxy: false, // Set to true to test via local proxy, false to use direct Ozonetel API
};

async function testPhoneCall() {
  console.log('🚀 Testing Ozonetel phone call integration...');
  console.log(`📞 Calling: ${config.phoneNumber}`);
  console.log(`🌐 Using GCP VM: ${config.gcpVmIp}`);
  
  try {
    let response;
    
    if (config.useLocalProxy) {
      // Test via your local call proxy (when running locally)
      console.log('📡 Using local call proxy...');
      response = await fetch('http://localhost:3000/api/telephony/ozonetel/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: config.phoneNumber
        })
      });
    } else {
      // Test via GCP VM call proxy
      console.log('☁️  Using GCP VM call proxy...');
      response = await fetch(`http://${config.gcpVmIp}:3000/api/telephony/ozonetel/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: config.phoneNumber
        })
      });
    }
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Call initiated successfully!');
      console.log('📋 Call Details:');
      console.log(`   📞 Phone: ${result.phoneNumber}`);
      console.log(`   🆔 Call ID: ${result.callId}`);
      console.log(`   💬 Message: ${result.message}`);
      console.log('\n🔄 Call flow:');
      console.log('   1. ✅ Call queued with Ozonetel');
      console.log(`   2. 🔄 Ozonetel will call XML endpoint: http://${config.gcpVmIp}:3000/api/getXML_dvcom_in_en`);
      console.log(`   3. 🔄 XML returns WebSocket URL: ws://${config.gcpVmIp}:8080/`);
      console.log('   4. 🔄 Ozonetel places call and connects to WebSocket');
      console.log('   5. 📞 Phone should ring shortly...');
      
      // Wait for call to be placed
      console.log('\n⏳ Waiting for call to be placed...');
      console.log('📱 Your phone should ring in 5-10 seconds');
      console.log('🎯 If call disconnects after 1 second, check WebSocket server logs');
      
    } else {
      console.error('❌ Call failed:', result);
      console.error('🔍 Check:');
      console.error(`   - GCP VM servers are running on ${config.gcpVmIp}`);
      console.error('   - Next.js server (port 3000) is running');
      console.error('   - WebSocket server (port 8080) is running');
      console.error('   - Environment variables are set (.env file)');
    }
    
  } catch (error) {
    console.error('💥 Error testing call:', error.message);
    console.error('🔍 Check:');
    console.error(`   - GCP VM is accessible at ${config.gcpVmIp}`);
    console.error('   - Next.js server is running on port 3000');
    console.error('   - Firewall allows connections to ports 3000 and 8080');
  }
}

// Run the test
testPhoneCall(); 