const WebSocket = require('ws');

async function simulateOzonetelFlow() {
  console.log('🔄 Simulating Ozonetel call flow...');
  
  // Step 1: Call XML endpoint (like Ozonetel does)
  console.log('\n📋 Step 1: Calling XML endpoint...');
  try {
    const xmlResponse = await fetch('http://34.100.243.161:3000/api/getXML_dvcom_in_en');
    const xmlText = await xmlResponse.text();
    console.log('✅ XML Response:', xmlText);
    
    // Parse WebSocket URL from XML
    const urlMatch = xmlText.match(/url="([^"]+)"/);
    if (!urlMatch) {
      console.error('❌ No WebSocket URL found in XML');
      return;
    }
    
    const wsUrl = urlMatch[1];
    console.log('🔗 Extracted WebSocket URL:', wsUrl);
    
    // Step 2: Connect to WebSocket (like Ozonetel does)
    console.log('\n🎧 Step 2: Connecting to WebSocket...');
    
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      
      ws.on('open', () => {
        console.log('✅ WebSocket connected successfully!');
        
        // Send a test message similar to what Ozonetel sends
        const ozonetelMessage = {
          event: 'media',
          type: 'media',
          ucid: 'test123',
          data: {
            samples: [0, 0, 0, 0], // Silent audio data
            bitsPerSample: 16,
            sampleRate: 8000,
            channelCount: 1,
            numberOfFrames: 4,
            type: 'data'
          }
        };
        
        console.log('📤 Sending test audio data...');
        ws.send(JSON.stringify(ozonetelMessage));
        
        // Keep connection open for 5 seconds
        setTimeout(() => {
          console.log('🔚 Closing connection...');
          ws.close();
          resolve('success');
        }, 5000);
      });
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log('📥 Received:', message);
        } catch (error) {
          console.log('📥 Received raw data:', data.toString());
        }
      });
      
      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        console.error('🔍 This is why calls are disconnecting!');
        reject(error);
      });
      
      ws.on('close', (code, reason) => {
        console.log(`🔚 WebSocket closed. Code: ${code}, Reason: ${reason || 'None'}`);
        if (code === 1000) {
          console.log('✅ Clean close - connection working properly!');
        } else {
          console.error(`⚠️  Abnormal close code: ${code}`);
        }
      });
    });
    
  } catch (error) {
    console.error('❌ Error in flow:', error);
  }
}

// Run the simulation
simulateOzonetelFlow()
  .then(() => {
    console.log('\n🎉 Flow simulation completed!');
    console.log('💡 If this works, but real calls fail, the issue is network/firewall related.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Flow simulation failed:', error);
    console.error('🔧 This explains why calls are disconnecting.');
    process.exit(1);
  }); 