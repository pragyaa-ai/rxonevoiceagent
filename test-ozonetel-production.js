const https = require('https');

// Production configuration
const config = {
  apiKey: 'KK11001341678ccf2d10f850135f15c809',
  phoneNumber: '+919999984076',
  callerDID: '04048353553',
  endpoint: 'in1-cpaas.ozonetel.com',
  // Using production URLs that should be accessible to Ozonetel
  xmlUrl: 'https://voiceagent.pragyaa.ai/api/getXML_dvcom_in_en',
  callbackUrl: 'https://voiceagent.pragyaa.ai/api/telephony/ozonetel/webhook'
};

console.log('🚀 Initiating production Ozonetel call...');
console.log(`📞 Calling: ${config.phoneNumber}`);
console.log(`🔗 XML URL: ${config.xmlUrl}`);
console.log(`📋 Callback URL: ${config.callbackUrl}`);

function makeCall() {
  const phoneNoClean = config.phoneNumber.replace('+', '').replace('-', '');
  
  const params = new URLSearchParams({
    phone_no: phoneNoClean,
    api_key: config.apiKey,
    outbound_version: '2',
    url: config.xmlUrl,
    callback_url: config.callbackUrl
  });
  
  const path = `/outbound/outbound.php?${params.toString()}`;
  
  console.log(`\n📡 Full URL: https://${config.endpoint}${path}`);
  
  const options = {
    hostname: config.endpoint,
    port: 443,
    path: path,
    method: 'GET',
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    
    console.log(`\n📊 Response Status: ${res.statusCode}`);
    console.log(`📋 Response Headers:`, res.headers);
    
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('\n📩 Response Body:');
      console.log(data);
      
      if (res.statusCode === 200) {
        if (data.includes('<status>queued</status>')) {
          console.log('\n🎉 Call successfully queued!');
          console.log('📞 Your phone should ring within 30 seconds...');
          
          // Extract call ID from response
          const callIdMatch = data.match(/<message>(\d+)<\/message>/);
          if (callIdMatch) {
            console.log(`📋 Call ID: ${callIdMatch[1]}`);
          }
        } else if (data.includes('error') || data.includes('Error')) {
          console.log('\n❌ Call failed - check response above');
        } else {
          console.log('\n⚠️ Unexpected response - check above for details');
        }
      } else {
        console.log(`\n❌ HTTP Error: ${res.statusCode}`);
      }
    });
  });

  req.on('error', (error) => {
    console.error('\n❌ Request error:', error.message);
  });

  req.setTimeout(15000, () => {
    console.log('\n⏰ Request timeout after 15 seconds');
    req.destroy();
  });

  req.end();
}

console.log('\n🔄 Starting call initiation...');
makeCall();

// Log what will happen next
setTimeout(() => {
  console.log('\n📋 Call Flow:');
  console.log('1. ✅ Call queued with Ozonetel');
  console.log('2. 📞 Ozonetel dials your phone');
  console.log('3. 🔗 When answered, Ozonetel calls your XML endpoint');
  console.log('4. 📋 XML endpoint returns instructions to start recording & stream');
  console.log('5. 🎤 Audio streams to your WebSocket for OpenAI processing');
  console.log('6. 🤖 Healthcare agent responds via the same stream');
  console.log('\n💡 Make sure your production endpoints are working!');
}, 2000); 