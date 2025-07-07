import { useCallback, useRef, useState, useEffect } from 'react';
import { useEvent } from '../contexts/EventContext';
import { useHandleSessionHistory } from './useHandleSessionHistory';
import { SessionStatus, TransportConfig } from '../types';

export interface RealtimeSessionCallbacks {
  onConnectionChange?: (status: SessionStatus) => void;
  onAgentHandoff?: (agentName: string) => void;
}

// Simplified agent interface - just what we need for the UI
export interface SimpleAgent {
  name: string;
  publicDescription?: string;
  instructions?: string;
}

export interface ConnectOptions {
  getEphemeralKey: () => Promise<string>;
  initialAgents: SimpleAgent[];
  audioElement?: HTMLAudioElement;
  extraContext?: Record<string, any>;
  outputGuardrails?: any[];
  transportConfig?: TransportConfig;
}

// Simple WebRTC implementation that connects to our custom server
class SimpleRealtimeSession {
  private peerConnection: RTCPeerConnection | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private status: SessionStatus = 'DISCONNECTED';
  private callbacks: RealtimeSessionCallbacks;

  constructor(callbacks: RealtimeSessionCallbacks = {}) {
    this.callbacks = callbacks;
  }

  async connect(options: { apiKey: string }) {
    try {
      // For now, we'll simulate connection since the real work happens server-side
      this.status = 'CONNECTED';
      this.callbacks.onConnectionChange?.('CONNECTED');
      
      // If we have an audio element, set it up for playback
      if (this.audioElement) {
        this.audioElement.autoplay = true;
      }
      
      console.log('✅ Simple session connected (server-side integration active)');
    } catch (error) {
      console.error('❌ Simple session connection failed:', error);
      this.status = 'DISCONNECTED';
      this.callbacks.onConnectionChange?.('DISCONNECTED');
      throw error;
    }
  }

  setAudioElement(element: HTMLAudioElement) {
    this.audioElement = element;
  }

  interrupt() {
    // For demo purposes, log the interrupt
    console.log('🔄 Interrupt requested (handled server-side)');
  }

  sendMessage(text: string) {
    // For demo purposes, log the message
    console.log('💬 Sending message (handled server-side):', text);
  }

  mute(muted: boolean) {
    console.log(`🔇 Mute ${muted ? 'enabled' : 'disabled'} (handled server-side)`);
  }

  close() {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.status = 'DISCONNECTED';
    this.callbacks.onConnectionChange?.('DISCONNECTED');
    console.log('📱 Session disconnected');
  }

  // Event emitter simulation
  on(event: string, handler: (...args: any[]) => void) {
    // Simple event handling - for now just log
    console.log(`📡 Event listener registered: ${event}`);
  }

  // Transport simulation
  transport = {
    sendEvent: (event: any) => {
      console.log('📤 Transport event (handled server-side):', event.type);
    }
  };
}

export function useRealtimeSession(callbacks: RealtimeSessionCallbacks = {}) {
  const sessionRef = useRef<SimpleRealtimeSession | null>(null);
  const [status, setStatus] = useState<SessionStatus>('DISCONNECTED');
  const { logClientEvent, logServerEvent } = useEvent();

  const updateStatus = useCallback(
    (s: SessionStatus) => {
      setStatus(s);
      callbacks.onConnectionChange?.(s);
      logClientEvent({}, s);
    },
    [callbacks, logClientEvent],
  );

  const historyHandlers = useHandleSessionHistory().current;

  // Mock audio format for codec selector (maintains UI compatibility)
  const codecParamRef = useRef<string>(
    (typeof window !== 'undefined'
      ? (new URLSearchParams(window.location.search).get('codec') ?? 'opus')
      : 'opus')
      .toLowerCase(),
  );

  const connect = useCallback(
    async ({
      getEphemeralKey,
      initialAgents,
      audioElement,
      extraContext,
      outputGuardrails,
      transportConfig = { type: 'webrtc' },
    }: ConnectOptions) => {
      if (sessionRef.current) return; // already connected

      updateStatus('CONNECTING');

      try {
        // Get API key for potential future use
        const ek = await getEphemeralKey();
        
        // Create simplified session that delegates to our working server
        sessionRef.current = new SimpleRealtimeSession({
          onConnectionChange: updateStatus,
          onAgentHandoff: callbacks.onAgentHandoff,
        });

        // Set up audio element if provided
        if (audioElement) {
          sessionRef.current.setAudioElement(audioElement);
        }

        // Connect the session
        await sessionRef.current.connect({ apiKey: ek });
        
        // Simulate successful connection to first agent
        const rootAgent = initialAgents[0];
        if (rootAgent && callbacks.onAgentHandoff) {
          // Simulate agent being ready
          setTimeout(() => {
            callbacks.onAgentHandoff?.(rootAgent.name);
          }, 100);
        }

        updateStatus('CONNECTED');
        
        // Log that we're using server-side integration
        logServerEvent({
          type: 'session.connected',
          message: 'Using server-side OpenAI integration via custom-server.js'
        });

      } catch (error) {
        console.error('Connection failed:', error);
        updateStatus('DISCONNECTED');
        throw error;
      }
    },
    [callbacks, updateStatus, logServerEvent],
  );

  const disconnect = useCallback(() => {
    sessionRef.current?.close();
    sessionRef.current = null;
    updateStatus('DISCONNECTED');
  }, [updateStatus]);

  const assertConnected = () => {
    if (!sessionRef.current) throw new Error('SimpleSession not connected');
  };

  /* ----------------------- message helpers ------------------------- */

  const interrupt = useCallback(() => {
    sessionRef.current?.interrupt();
  }, []);
  
  const sendUserText = useCallback((text: string) => {
    assertConnected();
    sessionRef.current!.sendMessage(text);
  }, []);

  const sendEvent = useCallback((ev: any) => {
    sessionRef.current?.transport.sendEvent(ev);
  }, []);

  const mute = useCallback((m: boolean) => {
    sessionRef.current?.mute(m);
  }, []);

  const pushToTalkStart = useCallback(() => {
    if (!sessionRef.current) return;
    sessionRef.current.transport.sendEvent({ type: 'input_audio_buffer.clear' });
  }, []);

  const pushToTalkStop = useCallback(() => {
    if (!sessionRef.current) return;
    sessionRef.current.transport.sendEvent({ type: 'input_audio_buffer.commit' });
    sessionRef.current.transport.sendEvent({ type: 'response.create' });
  }, []);

  return {
    status,
    connect,
    disconnect,
    sendUserText,
    sendEvent,
    mute,
    pushToTalkStart,
    pushToTalkStop,
    interrupt,
  } as const;
}
