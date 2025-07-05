import { NextRequest } from 'next/server';

/**
 * Ozonetel Webhook Handler
 * 
 * This endpoint handles webhook callbacks from Ozonetel when call events occur.
 * Ozonetel expects XML responses to control call flow.
 * 
 * Configure this URL in your Ozonetel dashboard as the webhook URL:
 * https://yourdomain.com/api/telephony/ozonetel/webhook
 */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const event = searchParams.get('event');
  const ucid = searchParams.get('ucid');
  const phoneNumber = searchParams.get('phone_number');
  const callerNumber = searchParams.get('caller_number');

  console.log(`[Ozonetel Webhook] Event: ${event}, UCID: ${ucid}, Phone: ${phoneNumber}`);

  // Log all parameters for debugging
  const allParams = Object.fromEntries(searchParams.entries());
  console.log('[Ozonetel Webhook] All params:', allParams);

  switch (event) {
    case 'NewCall':
      // Convert all query params to UUI JSON for passing to WebSocket stream
      const uuiJson = JSON.stringify(allParams).replace(/"/g, '&quot;');
      
      console.log(`[Ozonetel Webhook] New call initiated - UCID: ${ucid}, Phone: ${phoneNumber}`);
      
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <start-record/>
  <stream is_sip="true" url="wss://voiceagent.pragyaa.ai/wsDVCom" x-uui="${uuiJson}">healthcare</stream>
</response>`,
        {
          status: 200,
          headers: {
            'Content-Type': 'application/xml',
          },
        }
      );

    case 'Stream':
      console.log(`[Ozonetel Webhook] Stream established for UCID: ${ucid}`);
      
      // Transfer to healthcare agent queue
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <cctransfer record="true" moh="default" uui="healthcare" timeout="30" ringType="ring">healthcare</cctransfer>
</response>`,
        {
          status: 200,
          headers: {
            'Content-Type': 'application/xml',
          },
        }
      );

    case 'Hangup':
    case 'CallEnd':
      console.log(`[Ozonetel Webhook] Call ended for UCID: ${ucid}`);
      
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <hangup/>
</response>`,
        {
          status: 200,
          headers: {
            'Content-Type': 'application/xml',
          },
        }
      );

    case 'Dial':
      console.log(`[Ozonetel Webhook] Dial event for UCID: ${ucid}`);
      
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <dial timeout="30">${phoneNumber}</dial>
</response>`,
        {
          status: 200,
          headers: {
            'Content-Type': 'application/xml',
          },
        }
      );

    default:
      console.log(`[Ozonetel Webhook] Unknown event: ${event}, returning default response`);
      
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <speak>Welcome to healthcare assistance. Please wait while we connect you to our agent.</speak>
</response>`,
        {
          status: 200,
          headers: {
            'Content-Type': 'application/xml',
          },
        }
      );
  }
}

export async function POST(req: NextRequest) {
  // Handle POST webhook events if needed
  try {
    const body = await req.text();
    console.log('[Ozonetel Webhook] POST body:', body);
    
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('[Ozonetel Webhook] Error processing POST:', error);
    return new Response('Error', { status: 500 });
  }
} 