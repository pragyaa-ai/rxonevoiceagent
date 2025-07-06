import { NextRequest } from 'next/server';

/**
 * Ozonetel XML Endpoint
 * 
 * This endpoint is called by Ozonetel when a call is initiated to get XML instructions
 * for handling the call flow (recording, streaming, etc.)
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  // Use correct parameter names from Ozonetel
  const phoneNo = searchParams.get('cid') || searchParams.get('phone_no');
  const ucid = searchParams.get('sid') || searchParams.get('ucid');
  const apiKey = 'KK11001341678ccf2d10f850135f15c809'; // Use our API key
  
  console.log('XML endpoint called with params:', { 
    cid: phoneNo, 
    sid: ucid, 
    api_key: apiKey,
    all_params: Object.fromEntries(searchParams.entries())
  });
  
  // Using GCP VM WebSocket server for production Ozonetel integration
  const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Stream url="ws://34.100.243.161:8080/?cust_name=Mr.Sachin&key=${apiKey}&phone_no=${phoneNo}&ucid=${ucid}" />
</Response>`;

  console.log('Returning XML response with GCP VM WebSocket URL: ws://34.100.243.161:8080/');
  
  return new Response(xmlResponse, {
    headers: {
      'Content-Type': 'text/xml',
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