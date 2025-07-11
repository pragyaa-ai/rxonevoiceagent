import { NextRequest } from 'next/server';

/**
 * Ozonetel Call Proxy
 * 
 * This endpoint proxies calls to Ozonetel's API to avoid CORS issues
 * when calling from the frontend
 */

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber } = await req.json();
    
    if (!phoneNumber) {
      return Response.json({ error: 'Phone number is required' }, { status: 400 });
    }
    
    console.log(`[Ozonetel Call Proxy] Initiating call to: ${phoneNumber} (Local Healthcare Agent)`);
    
    // Clean phone number for Ozonetel API
    const phoneNoClean = phoneNumber.replace('+', '').replace('-', '');
    
    // Use the GCP VM URLs for Healthcare agent
    const ozonetelUrl = `http://in1-cpaas.ozonetel.com/outbound/outbound.php?phone_no=${phoneNoClean}&api_key=KK11001341678ccf2d10f850135f15c809&outbound_version=2&url=http://34.100.243.161:3000/api/getXML_dvcom_in_en&callback_url=http://34.100.243.161:3000/api/telephony/ozonetel/webhook`;
    
    console.log(`[Ozonetel Call Proxy] Calling: ${ozonetelUrl}`);
    
    const response = await fetch(ozonetelUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    const responseText = await response.text();
    console.log(`[Ozonetel Call Proxy] Response: ${responseText}`);
    
    if (response.ok && responseText.includes('<status>queued</status>')) {
      // Extract call ID from response
      const callIdMatch = responseText.match(/<message>(\d+)<\/message>/);
      const callId = callIdMatch ? callIdMatch[1] : 'unknown';
      
      return Response.json({
        status: 'success',
        callId: callId,
        message: `Call queued successfully. Call ID: ${callId}`,
        phoneNumber: phoneNumber,
        ozonetelResponse: responseText
      });
      
    } else {
      return Response.json({
        status: 'error',
        error: `Ozonetel API call failed: HTTP ${response.status}`,
        response: responseText,
        url: ozonetelUrl
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('[Ozonetel Call Proxy] Error:', error);
    return Response.json({
      status: 'error',
      error: 'Failed to place call',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 