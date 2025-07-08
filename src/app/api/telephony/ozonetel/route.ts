import { NextRequest } from 'next/server';
import { TelephonySession } from '@/app/types';
import { convertPCM8kTo24k, getAudioQualityMetrics } from '@/app/lib/advancedAudioUtils';

console.log('[Audio v2.8] Advanced audio resampling system initialized');



// Session management
const activeSessions = new Map<string, {
  session: TelephonySession;
  openaiClient?: any;
  openaiSession?: any;
}>();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ucid = searchParams.get('ucid');
  
  if (!ucid) {
    return new Response('UCID required', { status: 400 });
  }

  // Upgrade to WebSocket
  const upgradeHeader = req.headers.get('upgrade');
  if (upgradeHeader !== 'websocket') {
    return new Response('Expected WebSocket upgrade', { status: 426 });
  }

  return new Response(null, {
    status: 101,
    headers: {
      'Upgrade': 'websocket',
      'Connection': 'Upgrade',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, ucid, data } = body;

    console.log(`[Ozonetel] Received event: ${event} for UCID: ${ucid}`);

    switch (event) {
      case 'start':
        return await handleCallStart(ucid, data);
      case 'media':
        return await handleMediaStream(ucid, data);
      case 'stop':
        return await handleCallStop(ucid);
      default:
        return Response.json({ error: 'Unknown event type' }, { status: 400 });
    }
  } catch (error) {
    console.error('[Ozonetel] Error processing request:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleCallStart(ucid: string, data: any) {
  console.log(`[Ozonetel] Starting call for UCID: ${ucid}`);

  // Create telephony session
  const session: TelephonySession = {
    sessionId: ucid,
    provider: 'ozonetel',
    ucid: ucid,
    startTime: Date.now(),
    status: 'initiated',
  };

  // For telephony integration, we don't need to create a session upfront
  // The WebSocket connection will be handled when the audio stream starts
  console.log(`[Ozonetel] Call session prepared for UCID: ${ucid}`);

  try {
    // Store session without OpenAI connection (will connect when WebSocket stream starts)
    activeSessions.set(ucid, {
      session: { ...session, status: 'connected' },
      openaiClient: null, // Will be initialized when WebSocket connects
      openaiSession: null,
    });

    console.log(`[Ozonetel] Call started successfully for UCID: ${ucid}`);

    return Response.json({
      status: 'success',
      sessionId: ucid,
      message: data?.testCall 
        ? 'Test call initiated - WebSocket will handle OpenAI connection' 
        : 'Call started, healthcare agent will connect when audio streams'
    });

  } catch (error) {
    console.error(`[Ozonetel] Error starting call for UCID ${ucid}:`, error);
    
    // Update session status to failed
    if (activeSessions.has(ucid)) {
      const sessionInfo = activeSessions.get(ucid)!;
      sessionInfo.session.status = 'failed';
    }

    return Response.json({
      error: 'Failed to initialize call session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function handleMediaStream(ucid: string, data: any) {
  const sessionInfo = activeSessions.get(ucid);
  
  if (!sessionInfo) {
    console.error(`[Ozonetel] No session found for UCID: ${ucid}`);
    return Response.json({ error: 'Session not found' }, { status: 404 });
  }

  try {
    // Extract audio data from Ozonetel payload
    const { audioData } = data;
    
    if (!audioData) {
      return Response.json({ error: 'No audio data provided' }, { status: 400 });
    }

    // Decode base64 audio data
    const audioBuffer = Buffer.from(audioData, 'base64');
    
    // Convert from 8kHz PCM (Ozonetel) to 24kHz PCM (OpenAI) using high-quality resampling
    const convertedAudio = convertPCM8kTo24k(audioBuffer);
    
    // Get audio quality metrics for monitoring
    const qualityMetrics = getAudioQualityMetrics(audioBuffer, convertedAudio);
    
    // Forward to OpenAI Realtime API
    // This would typically be sent via WebSocket connection
    // const audioEvent = {
    //   type: 'input_audio_buffer.append',
    //   audio: convertedAudio.toString('base64')
    // };

    console.log(`[Audio v2.8] Processed ${audioBuffer.length} → ${convertedAudio.length} bytes (${qualityMetrics.conversionRatio.toFixed(2)}x) for UCID: ${ucid}`);
    console.log(`[Audio v2.8] Quality: Input RMS=${qualityMetrics.inputRMS.toFixed(1)}, Output RMS=${qualityMetrics.outputRMS.toFixed(1)}, Dynamic Range=${qualityMetrics.dynamicRange.toFixed(1)}dB`);

    // In a real implementation, this would be sent via WebSocket to OpenAI
    // For now, we'll log the event
    
    return Response.json({
      status: 'success',
      processed: audioBuffer.length,
      converted: convertedAudio.length
    });

  } catch (error) {
    console.error(`[Ozonetel] Error processing media for UCID ${ucid}:`, error);
    return Response.json({
      error: 'Failed to process audio',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function handleCallStop(ucid: string) {
  console.log(`[Ozonetel] Stopping call for UCID: ${ucid}`);

  const sessionInfo = activeSessions.get(ucid);
  
  if (!sessionInfo) {
    console.error(`[Ozonetel] No session found for UCID: ${ucid}`);
    return Response.json({ error: 'Session not found' }, { status: 404 });
  }

  try {
    // Update session status
    sessionInfo.session.status = 'completed';
    sessionInfo.session.endTime = Date.now();

    // Close OpenAI session if needed
    // This would typically involve closing WebSocket connections

    // Log call duration
    const duration = sessionInfo.session.endTime - sessionInfo.session.startTime;
    console.log(`[Ozonetel] Call completed for UCID: ${ucid}, duration: ${duration}ms`);

    // Clean up session
    activeSessions.delete(ucid);

    return Response.json({
      status: 'success',
      sessionId: ucid,
      duration: duration,
      message: 'Call ended successfully'
    });

  } catch (error) {
    console.error(`[Ozonetel] Error stopping call for UCID ${ucid}:`, error);
    return Response.json({
      error: 'Failed to stop call properly',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Utility function to get session status
export async function getSessionStatus(ucid: string) {
  const sessionInfo = activeSessions.get(ucid);
  return sessionInfo?.session || null;
} 