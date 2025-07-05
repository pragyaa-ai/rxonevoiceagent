import { NextRequest } from 'next/server';

/**
 * Ozonetel XML Endpoint
 * 
 * This endpoint is called by Ozonetel when a call is initiated to get XML instructions
 * for handling the call flow (recording, streaming, etc.)
 */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  
  // Log all parameters for debugging
  const allParams = Object.fromEntries(searchParams.entries());
  console.log('[Ozonetel XML] ========= XML ENDPOINT CALLED =========');
  console.log('[Ozonetel XML] Full URL:', req.url);
  console.log('[Ozonetel XML] Call parameters:', allParams);
  console.log('[Ozonetel XML] Headers:', Object.fromEntries(req.headers.entries()));
  
  const phoneNumber = searchParams.get('phone_no');
  const apiKey = searchParams.get('api_key');
  const ucid = searchParams.get('ucid') || `call-${Date.now()}`;
  
  console.log(`[Ozonetel XML] Generating XML for phone: ${phoneNumber}, UCID: ${ucid}`);
  
  // Create UUI data with call parameters
  const uuiData = {
    phone_number: phoneNumber,
    ucid: ucid,
    api_key: apiKey,
    agent_type: 'healthcare',
    timestamp: new Date().toISOString(),
    ...allParams
  };
  
  const uuiJson = JSON.stringify(uuiData).replace(/"/g, '&quot;');
  
  // Generate XML response for Ozonetel
  // For now, let's skip streaming and just play messages to test basic flow
  // This will help us verify the XML processing works before adding WebSocket complexity
  
  const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <start-record/>
  <speak>Welcome to Sagar Hospitals. You have successfully connected to our healthcare assistant. This is a working test call.</speak>
  <wait>3</wait>
  <speak>Your call is being recorded for quality purposes. Our AI assistant is now ready to help you.</speak>
  <wait>5</wait>
  <speak>Please state your health concern or query, and I will assist you accordingly.</speak>
  <wait>10</wait>
  <speak>Thank you for calling Sagar Hospitals. This concludes our test. Have a great day!</speak>
  <wait>2</wait>
  <hangup/>
</response>`;

  console.log('[Ozonetel XML] Generated XML response with voice prompts (no streaming)');
  console.log('[Ozonetel XML] UUI data:', uuiData);
  
  return new Response(xmlResponse, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
}

export async function POST(req: NextRequest) {
  // Handle POST requests if needed
  try {
    const body = await req.text();
    console.log('[Ozonetel XML] POST request body:', body);
    
    // Return same XML response
    return GET(req);
  } catch (error) {
    console.error('[Ozonetel XML] Error processing POST:', error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <speak>Sorry, there was an error processing your call. Please try again.</speak>
  <hangup/>
</response>`,
      {
        status: 200,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
        },
      }
    );
  }
} 