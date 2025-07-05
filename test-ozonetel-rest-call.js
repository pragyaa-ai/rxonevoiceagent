const https = require('https');

// Configuration
const config = {
  apiKey: 'KK11001341678ccf2d10f850135f15c809',
  phoneNumber: '+919999984076', // Your mobile number
  callerDID: '04048353553', // Ozonetel DID number
  webhookUrl: 'https://voiceagent.pragyaa.ai/api/telephony/ozonetel/webhook', // Our application webhook
};

// Function to initiate Ozonetel outbound call
function initiateOzonetelCall() {
  const callData = JSON.stringify({
    api_key: config.apiKey,
    action: 'call',
    format: 'json',
    phone_number: config.phoneNumber,
    caller_id: config.callerDID,
    time_out: 30,
    call_back_url: config.webhookUrl,
    custom_data: JSON.stringify({
      agent_type: 'healthcare',
      test_call: true,
      timestamp: new Date().toISOString()
    })
  });

  const options = {
    hostname: 'api.ozonetel.com',
    port: 443,
    path: '/v2/api',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': callData.length,
      'Accept': 'application/json'
    }
  };

  console.log('🚀 Initiating Ozonetel call...');
  console.log(`📞 Calling: ${config.phoneNumber}`);
  console.log(`📍 From DID: ${config.callerDID}`);
  console.log(`🔗 Webhook: ${config.webhookUrl}`);

  const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('\n✅ Call API Response:');
        console.log(JSON.stringify(response, null, 2));
        
        if (response.status === 'success' || response.call_uuid) {
          console.log('\n🎉 Call initiated successfully!');
          console.log(`📱 Check your phone (${config.phoneNumber}) for incoming call`);
          console.log('💬 You should hear: "नमस्ते! Welcome to Sagar Hospitals..."');
        } else {
          console.log('\n❌ Call initiation failed');
          console.log('Error:', response.message || response.error || 'Unknown error');
        }
      } catch (error) {
        console.log('❌ Error parsing response:', error.message);
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request error:', error.message);
  });

  req.write(callData);
  req.end();
}

// Alternative method using Ozonetel Click-to-Call API
function initiateClickToCall() {
  const callData = JSON.stringify({
    api_key: config.apiKey,
    action: 'click_to_call',
    format: 'json',
    agent_number: config.callerDID,
    customer_number: config.phoneNumber,
    time_out: 30,
    call_back_url: config.webhookUrl
  });

  const options = {
    hostname: 'api.ozonetel.com',
    port: 443,
    path: '/v2/click_to_call',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': callData.length,
      'Accept': 'application/json'
    }
  };

  console.log('\n🔄 Trying Click-to-Call API as alternative...');

  const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('\n✅ Click-to-Call Response:');
        console.log(JSON.stringify(response, null, 2));
      } catch (error) {
        console.log('❌ Error parsing click-to-call response:', error.message);
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Click-to-Call error:', error.message);
  });

  req.write(callData);
  req.end();
}

// Start the test
console.log('🧪 Starting Ozonetel Call Test...');
console.log('==========================================');

// Try the main call API first
initiateOzonetelCall();

// Try click-to-call as backup after 5 seconds
setTimeout(() => {
  initiateClickToCall();
}, 5000);

console.log('\n⏳ Waiting for API responses...');
console.log('Note: If successful, you should receive a call on your phone within 30 seconds.'); 