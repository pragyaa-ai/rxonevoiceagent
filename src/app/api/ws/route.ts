import { NextRequest } from 'next/server';

/**
 * WebSocket endpoint for Ozonetel audio streaming
 * This redirects to our standalone WebSocket server
 */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  
  // Log incoming WebSocket connection attempt
  console.log('[WebSocket Proxy] Connection attempt from Ozonetel');
  console.log('[WebSocket Proxy] Query params:', Object.fromEntries(searchParams.entries()));
  
  // Check if this is a WebSocket upgrade request
  const upgradeHeader = req.headers.get('upgrade');
  if (upgradeHeader !== 'websocket') {
    console.log('[WebSocket Proxy] Not a WebSocket upgrade request - returning redirect');
    
    // Return a response directing to use the standalone server
    return new Response(`
      WebSocket server is running on port 8080
      Use: ws://localhost:8080/
      Via ngrok: wss://89e6-42-108-29-241.ngrok-free.app/ws
    `, { 
      status: 200,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  }
  
  // For WebSocket upgrade, redirect to our standalone server
  // Note: This is a workaround since Next.js doesn't natively support WebSocket upgrades
  console.log('[WebSocket Proxy] WebSocket upgrade requested - should be handled by standalone server');
  
  return new Response('WebSocket upgrade should be handled by standalone server on port 8080', { 
    status: 426,
    headers: {
      'Content-Type': 'text/plain'
    }
  });
}

// Handle POST requests (if Ozonetel sends audio data via POST)
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    console.log('[WebSocket] POST request received with body length:', body.length);
    
    // Handle audio data sent via POST
    if (body) {
      console.log('[WebSocket] Processing audio data via POST');
      
      // Here you would process the audio data
      // For now, just log and return success
      
      return Response.json({
        status: 'success',
        message: 'Audio data received',
        dataLength: body.length,
        timestamp: new Date().toISOString()
      });
    }
    
    return Response.json({
      status: 'error',
      message: 'No audio data received'
    }, { status: 400 });
    
  } catch (error) {
    console.error('[WebSocket] Error processing POST request:', error);
    return Response.json({
      status: 'error',
      message: 'Failed to process audio data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 