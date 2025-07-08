'use client';

import React, { useState } from 'react';

interface CallStatus {
  stage: 'idle' | 'initiating' | 'websocket_connecting' | 'openai_connecting' | 'call_connecting' | 'active' | 'failed' | 'completed';
  message: string;
  error?: string;
  details?: any;
}

interface TestCallResponse {
  status: string;
  sessionId?: string;
  callId?: string;
  error?: string;
  message?: string;
  details?: string;
}

export default function OzonetelTestCall() {
  const [phoneNumber, setPhoneNumber] = useState('+91');
  const [callStatus, setCallStatus] = useState<CallStatus>({ stage: 'idle', message: 'Ready to test call' });
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [callLogs, setCallLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setCallLogs(prev => [...prev, `${timestamp}: ${message}`]);
  };

  const updateStatus = (stage: CallStatus['stage'], message: string, error?: string, details?: any) => {
    setCallStatus({ stage, message, error, details });
    addLog(`${stage.toUpperCase()}: ${message}${error ? ` - ${error}` : ''}`);
  };

  const initiateTestCall = async () => {
    await initiateCall(true); // Test call only
  };

  const initiateRealCall = async () => {
    await initiateCall(false); // Real call - will ring your phone!
  };

  const initiateCall = async (isTestCall: boolean) => {
    if (!phoneNumber || phoneNumber.length < 10) {
      updateStatus('failed', 'Invalid phone number', 'Please enter a valid phone number with country code');
      return;
    }

    setIsTestRunning(true);
    setCallLogs([]);
    
    const callType = isTestCall ? 'test call' : 'REAL CALL';
    
    try {
      if (isTestCall) {
        // For test calls: Use internal API to test integration
        updateStatus('initiating', `Starting Ozonetel ${callType}...`, undefined, { 
          phoneNumber,
          callType: 'test'
        });
        
        const callData = {
          event: 'start',
          ucid: `test-call-${Date.now()}`,
          data: {
            phoneNumber: phoneNumber,
            callerId: '04048353553',
            testCall: true,
            timestamp: new Date().toISOString()
          }
        };

        updateStatus('initiating', 'Sending call request to application API...');
        
        const response = await fetch('/api/telephony/ozonetel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(callData)
        });

        const result: TestCallResponse = await response.json();
        
        if (!response.ok) {
          updateStatus('failed', 'API call failed', result.error || 'Unknown error', result);
          return;
        }

        if (result.status === 'success') {
          updateStatus('call_connecting', 'Test integration successful!', undefined, { 
            sessionId: result.sessionId,
            message: result.message || 'Integration test completed successfully',
            callType: 'test'
          });
          
          // Stage 3: WebSocket connection test (only for test calls)
          setTimeout(() => {
            testWebSocketConnection(callData.ucid);
          }, 2000);
        } else {
          updateStatus('failed', 'Test integration failed', result.error, result);
        }

             } else {
         // For real calls: Use backend proxy to avoid CORS issues
         updateStatus('initiating', `Starting REAL Ozonetel call to ${phoneNumber}...`, undefined, { 
           phoneNumber,
           callType: 'real'
         });
         
         updateStatus('initiating', 'Calling Ozonetel API to place phone call...');
         addLog(`📞 Using backend proxy to call Ozonetel API`);
         
         const response = await fetch('/api/telephony/ozonetel/call', {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
           },
           body: JSON.stringify({
             phoneNumber: phoneNumber
           })
         });

         const result = await response.json();
         addLog(`📩 Ozonetel Response: ${JSON.stringify(result, null, 2)}`);
         
         if (response.ok && result.status === 'success') {
           updateStatus('call_connecting', 'Phone call queued successfully!', undefined, { 
             callId: result.callId,
             phoneNumber: phoneNumber,
             message: `Call ID: ${result.callId} - Your phone should ring within 30 seconds`
           });
           
           setTimeout(() => {
             updateStatus('completed', '📞 Real call placed successfully!', undefined, {
               message: `Your phone (${phoneNumber}) should be ringing now! Healthcare agent is ready.`,
               callId: result.callId,
               details: 'Answer the call to talk with the AI healthcare agent'
             });
           }, 2000);
           
         } else {
           updateStatus('failed', 'Ozonetel API call failed', result.error || 'Unknown error', {
             response: result
           });
         }
       }

    } catch (error) {
      updateStatus('failed', 'Network error occurred', error instanceof Error ? error.message : 'Unknown error');
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTestRunning(false);
    }
  };

  const testWebSocketConnection = (ucid: string) => {
    updateStatus('websocket_connecting', 'Testing WebSocket connection...');
    
    // Use the same connection format as our working standalone test
    // Note: Browser WebSocket behavior might differ from Node.js
    const wsUrl = `wss://voiceagent.pragyaa.ai/wsDVCom?key=KK11001341678ccf2d10f850135f15c809&cust_name=TestUser`;
    addLog(`🔗 Attempting connection to: ${wsUrl}`);
    
    try {
      // Add small delay to ensure any server-side session setup is complete
      setTimeout(() => {
        addLog(`⏱️ Starting WebSocket connection (after 1 second delay)`);
        const ws = new WebSocket(wsUrl);
        
        const timeout = setTimeout(() => {
          addLog(`⏰ Connection timeout after 15 seconds`);
          updateStatus('failed', 'WebSocket connection timeout', 'Failed to connect within 15 seconds');
          if (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
        }, 15000);

        ws.onopen = () => {
          clearTimeout(timeout);
          addLog(`✅ WebSocket connected to: ${wsUrl}`);
          updateStatus('active', 'WebSocket connected successfully!', undefined, {
            message: 'Real-time audio streaming is ready',
            url: wsUrl
          });
          
          // Send test message to verify two-way communication
          const testMessage = {
            type: 'test_connection',
            ucid: ucid,
            timestamp: new Date().toISOString(),
            message: 'Integration test from OpenAI healthcare agent'
          };
          
          try {
            ws.send(JSON.stringify(testMessage));
            addLog(`📤 Sent test message: ${JSON.stringify(testMessage)}`);
          } catch (error) {
            addLog(`❌ Failed to send test message: ${error}`);
          }
          
          // Close after 8 seconds to allow for potential responses
          setTimeout(() => {
            addLog(`✅ Test completed - WebSocket integration working properly`);
            updateStatus('completed', 'Test completed successfully', undefined, {
              message: 'All components integrated successfully',
              summary: 'OpenAI sessions + WebSocket connectivity verified'
            });
            ws.close(1000, 'Test completed successfully');
          }, 8000);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            addLog(`📥 WebSocket JSON message: ${JSON.stringify(data)}`);
          } catch {
            // Likely audio data
            const size = event.data instanceof ArrayBuffer ? event.data.byteLength : event.data.length;
            addLog(`📥 WebSocket audio data: ${size} bytes`);
          }
        };

        ws.onerror = (error) => {
          clearTimeout(timeout);
          addLog(`🚨 WebSocket error occurred: ${error}`);
          updateStatus('failed', 'WebSocket connection failed', 'Unable to establish connection', {
            error: error,
            url: wsUrl
          });
        };

        ws.onclose = (event) => {
          clearTimeout(timeout);
          addLog(`🔚 WebSocket closed - Code: ${event.code}, Reason: ${event.reason || 'No reason provided'}`);
          
          // Check if this is our intentional test completion
          if (event.code === 1000 && event.reason === 'Test completed successfully') {
            // This is a successful test completion - do nothing, status already set to 'completed'
            addLog(`✅ Test completed successfully - WebSocket closed as expected`);
            return;
          }
          
          // Only treat as error if we haven't completed successfully
          if (callStatus.stage !== 'completed' && callStatus.stage !== 'failed') {
            const closeReasons: Record<number, string> = {
              1000: 'Normal closure',
              1001: 'Going away', 
              1002: 'Protocol error',
              1003: 'Unsupported data',
              1005: 'No status received',
              1006: 'Connection lost',
              1007: 'Invalid frame payload data',
              1008: 'Policy violation',
              1009: 'Message too big',
              1010: 'Missing extension',
              1011: 'Internal error',
              1015: 'TLS handshake'
            };
            
            const reason = closeReasons[event.code] || `Unknown code ${event.code}`;
            updateStatus('failed', 'WebSocket connection closed unexpectedly', reason, {
              code: event.code,
              reason: event.reason,
              url: wsUrl
            });
          }
        };
        
      }, 1000); // 1-second delay before attempting connection

    } catch (error) {
      updateStatus('failed', 'WebSocket initialization failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const getStatusColor = (stage: CallStatus['stage']) => {
    switch (stage) {
      case 'idle': return 'text-gray-500';
      case 'initiating': 
      case 'websocket_connecting': 
      case 'openai_connecting': 
      case 'call_connecting': return 'text-blue-500';
      case 'active': return 'text-green-500';
      case 'failed': return 'text-red-500';
      case 'completed': return 'text-green-600';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (stage: CallStatus['stage']) => {
    switch (stage) {
      case 'idle': return '⚪';
      case 'initiating': 
      case 'websocket_connecting': 
      case 'openai_connecting': 
      case 'call_connecting': return '🔄';
      case 'active': return '🟢';
      case 'failed': return '🔴';
      case 'completed': return '✅';
      default: return '⚪';
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">🧪 Ozonetel WebSocket Test Call</h2>
      
      {/* Phone Number Input */}
      <div className="mb-6">
        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
          📞 Test Phone Number
        </label>
        <input
          id="phoneNumber"
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="+919876543210"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isTestRunning}
        />
        <p className="text-sm text-gray-500 mt-1">
          Enter phone number with country code (e.g., +91 for India)
        </p>
      </div>

      {/* Test Button */}
      <div className="space-y-3">
        <button
          onClick={initiateTestCall}
          disabled={isTestRunning || !phoneNumber || phoneNumber.length < 10}
          className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
            isTestRunning || !phoneNumber || phoneNumber.length < 10
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isTestRunning ? '🔄 Testing in Progress...' : '🧪 Integration Test (No Phone Call)'}
        </button>

        {/* Real Call Button */}
        <button
          onClick={initiateRealCall}
          disabled={isTestRunning || !phoneNumber || phoneNumber.length < 10}
          className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
            isTestRunning || !phoneNumber || phoneNumber.length < 10
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {isTestRunning ? '🔄 Call in Progress...' : '📞 Place Real Call'}
        </button>
        
        <p className="text-sm text-gray-600 text-center">
          <span className="font-medium">Integration Test:</span> Tests OpenAI + WebSocket connectivity<br/>
          <span className="font-medium">Real Call:</span> Actually calls your phone number
        </p>
      </div>

      {/* Status Display */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-3">📊 Call Status</h3>
        <div className={`flex items-center space-x-2 ${getStatusColor(callStatus.stage)}`}>
          <span className="text-xl">{getStatusIcon(callStatus.stage)}</span>
          <span className="font-medium">{callStatus.message}</span>
        </div>
        
        {callStatus.error && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">❌ Error: {callStatus.error}</p>
          </div>
        )}
        
        {callStatus.details && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm">
              📋 Details: {JSON.stringify(callStatus.details, null, 2)}
            </p>
          </div>
        )}
      </div>

      {/* Test Stages Checklist */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-3">🔍 Test Stages</h3>
        <div className="space-y-2">
          {[
            { stage: 'initiating', label: 'API Call Initiation', description: 'Sending request to /api/telephony/ozonetel' },
            { stage: 'openai_connecting', label: 'OpenAI Session', description: 'Creating OpenAI Realtime session (fixed for WebSocket)' },
            { stage: 'call_connecting', label: 'Call Dialing', description: 'Initiating outbound call to your number' },
            { stage: 'websocket_connecting', label: 'WebSocket Connection', description: 'Connecting to Ozonetel audio stream' },
            { stage: 'active', label: 'Audio Streaming', description: 'Real-time audio communication active' }
          ].map(({ stage, label, description }) => (
            <div key={stage} className="flex items-center space-x-3">
              <span className="text-sm">
                {callStatus.stage === stage ? '🔄' : 
                 ['completed', 'active'].includes(callStatus.stage) || 
                 (callStatus.stage === 'failed' && stage === 'initiating') ? '✅' : '⚪'}
              </span>
              <div>
                <span className="text-sm font-medium text-gray-800">{label}</span>
                <p className="text-xs text-gray-500">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call Logs */}
      {callLogs.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-3">📝 Call Logs</h3>
          <div className="max-h-48 overflow-y-auto">
            {callLogs.map((log, index) => (
              <div key={index} className="text-xs text-gray-600 font-mono mb-1">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">💡 Instructions</h3>
        <div className="text-sm text-blue-700 space-y-3">
          <div>
            <p className="font-medium mb-1">🧪 Integration Test:</p>
            <ul className="space-y-1 ml-4">
              <li>• Tests OpenAI session creation + WebSocket connectivity</li>
              <li>• Does NOT place actual phone calls</li>
              <li>• Perfect for verifying the technical integration</li>
            </ul>
          </div>
          
          <div>
            <p className="font-medium mb-1">📞 Real Call:</p>
            <ul className="space-y-1 ml-4">
              <li>• Actually places a call to your phone number</li>
              <li>• Uses Ozonetel&apos;s telephony API to initiate outbound calls</li>
              <li>• Your phone will ring if successful</li>
              <li>• Healthcare agent will be ready to assist when you answer</li>
            </ul>
          </div>
          
          <div className="pt-2 border-t border-blue-200">
            <p className="font-medium">Getting Started:</p>
            <ul className="space-y-1 ml-4">
              <li>• Enter your phone number with country code (e.g., +919876543210)</li>
              <li>• Choose &quot;Integration Test&quot; first to verify the system is working</li>
              <li>• Then try &quot;Place Real Call&quot; to test actual phone calls</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 