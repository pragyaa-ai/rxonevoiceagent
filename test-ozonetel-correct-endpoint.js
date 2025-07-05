const https = require('https');
const http = require('http');

// Configuration using the correct Ozonetel endpoint from search results
const config = {
  apiKey: 'KK11001341678ccf2d10f850135f15c809',
  phoneNumber: '+919999984076', // Full international format
  callerDID: '04048353553',
  // Using the correct endpoint from search results
  endpoint: 'in1-cpaas.ozonetel.com',
  webhookUrl: 'https://voiceagent.pragyaa.ai/api/telephony/ozonetel/webhook',
  xmlUrl: 'http://localhost:3000/api/getXML_dvcom_in_en',
  callbackUrl: 'http://localhost:3000/api/telephony/ozonetel/webhook'
};

console.log('🚀 Initiating Ozonetel call using correct endpoint...');
console.log(`📞 Calling: ${config.phoneNumber}`);
console.log(`🔗 Endpoint: ${config.endpoint}`);
console.log(`📋 Webhook: ${config.webhookUrl}`);

function initiateOzonetelCall() {
  // Build the URL with proper parameters
  const phoneNoClean = config.phoneNumber.replace('+', '').replace('-', '');
  
  const params = new URLSearchParams({
    phone_no: phoneNoClean,
    api_key: config.apiKey,
    outbound_version: '2',
    url: config.xmlUrl,  // This was missing in the original URL
    callback_url: config.callbackUrl
  });
  
  const path = `/outbound/outbound.php?${params.toString()}`;
  
  console.log(`\n📡 Full URL: http://${config.endpoint}${path}`);
  
  const options = {
    hostname: config.endpoint,
    port: 80,
    path: path,
    method: 'GET',
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  };

  const req = http.request(options, (res) => {
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
        if (data.includes('success') || data.includes('Success') || data.includes('call initiated')) {
          console.log('\n🎉 Call initiated successfully!');
          console.log('📞 Your phone should ring shortly...');
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
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 DNS resolution failed. Check:');
      console.log('   1. Your internet connection');
      console.log('   2. Whether you need VPN access');
      console.log('   3. If the endpoint is correct for your region');
    }
  });

  req.setTimeout(10000, () => {
    console.log('\n⏰ Request timeout after 10 seconds');
    req.destroy();
  });

  req.end();
}

console.log('\n🔄 Starting call initiation...');
initiateOzonetelCall();

// Alternative method using HTTPS if HTTP fails
setTimeout(() => {
  console.log('\n🔄 Trying HTTPS version as backup...');
  
  const phoneNoClean = config.phoneNumber.replace('+', '').replace('-', '');
  const params = new URLSearchParams({
    phone_no: phoneNoClean,
    api_key: config.apiKey,
    outbound_version: '2',
    url: config.xmlUrl,
    callback_url: config.callbackUrl
  });
  
  const httpsOptions = {
    hostname: config.endpoint,
    port: 443,
    path: `/outbound/outbound.php?${params.toString()}`,
    method: 'GET',
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  };

  const httpsReq = https.request(httpsOptions, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log('\n📩 HTTPS Response:');
      console.log(data);
    });
  });

  httpsReq.on('error', (error) => {
    console.error('❌ HTTPS request error:', error.message);
  });

  httpsReq.end();
}, 5000); 