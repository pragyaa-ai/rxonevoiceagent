const WebSocket = require('ws');

// Configuration
const config = {
  websocketUrl: 'wss://voiceagent.pragyaa.ai/wsDVCom',
  apiKey: 'KK11001341678ccf2d10f850135f15c809',
  // Replace with your mobile number
  phoneNumber: '+919999984076', // TODO: Add your phone number here
};

// Create WebSocket connection
const ws = new WebSocket(`${config.websocketUrl}?key=${config.apiKey}&cust_name=TestUser`);

ws.on('open', () => {
  console.log('✅ Connected to Ozonetel WebSocket');
  
  // Initiate call
  const callRequest = {
    event: 'start',
    data: {
      phoneNumber: config.phoneNumber,
      callerId: process.env.OZONETEL_DID || '04048353553', // Default DID if not provided
    }
  };
  
  ws.send(JSON.stringify(callRequest));
  console.log(`📞 Initiating call to ${config.phoneNumber}...`);
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('📩 Received:', message);
    
    // Handle different event types
    switch (message.event) {
      case 'call_connected':
        console.log('🎉 Call connected!');
        break;
      case 'call_disconnected':
        console.log('👋 Call ended');
        ws.close();
        break;
      case 'error':
        console.error('❌ Error:', message.data);
        ws.close();
        break;
    }
  } catch (error) {
    console.error('Error parsing message:', error);
  }
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

ws.on('close', () => {
  console.log('WebSocket connection closed');
  process.exit(0);
}); 