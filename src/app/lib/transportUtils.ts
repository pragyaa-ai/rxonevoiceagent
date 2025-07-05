import { TransportType, TransportConfig } from '../types';
import { OpenAIRealtimeWebRTC } from '@openai/agents/realtime';

/**
 * Custom WebSocket transport for OpenAI Realtime API
 * This provides WebSocket connectivity as an alternative to WebRTC
 * Implements the same interface as OpenAIRealtimeWebRTC for compatibility
 */
export class OpenAIRealtimeWebSocket {
  private websocket: WebSocket | null = null;
  private audioElement?: HTMLAudioElement;
  private eventListeners: Map<string, ((data?: any) => void)[]> = new Map();

  constructor(config: { audioElement?: HTMLAudioElement; url?: string; headers?: Record<string, string> }) {
    this.audioElement = config.audioElement;
  }

  /**
   * Event listener management (Node.js EventEmitter-style interface)
   * This is what RealtimeSession expects
   */
  on(event: string, listener: (data?: any) => void) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  off(event: string, listener: (data?: any) => void) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * WebRTC-style addEventListener for compatibility
   */
  addEventListener(event: string, listener: (data?: any) => void) {
    this.on(event, listener);
  }

  removeEventListener(event: string, listener: (data?: any) => void) {
    this.off(event, listener);
  }

  private emit(event: string, data?: any) {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(listener => listener(data));
  }

  /**
   * Send event over WebSocket (mimics WebRTC DataChannel interface)
   */
  sendEvent(event: any) {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(event));
    } else {
      console.warn('WebSocket not connected, cannot send event:', event);
    }
  }

  /**
   * Connect method that RealtimeSession expects
   * This should be called by RealtimeSession, not directly
   */
  async connect(options: { apiKey: string }): Promise<void> {
    const { apiKey } = options;
    const model = 'gpt-4o-realtime-preview-2025-06-03';
    
    return new Promise((resolve, reject) => {
      try {
        // WebSocket connection to OpenAI Realtime API
        const url = `wss://api.openai.com/v1/realtime?model=${model}`;
        
        this.websocket = new WebSocket(url, [
          'realtime',
          `openai-insecure-api-key.${apiKey}`,
          'openai-beta.realtime-v1'
        ]);

        this.websocket.onopen = () => {
          console.log('WebSocket connected to OpenAI Realtime API');
          this.emit('open');
          resolve();
        };

        this.websocket.onmessage = (event) => {
          try {
            JSON.parse(event.data); // Validate JSON format
            this.emit('message', { data: event.data });
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.websocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };

        this.websocket.onclose = () => {
          console.log('WebSocket connection closed');
          this.emit('close');
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Close WebSocket connection
   */
  close() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  /**
   * Additional methods that RealtimeSession might expect
   */
  disconnect() {
    this.close();
  }

  // Getters for compatibility
  get readyState() {
    return this.websocket?.readyState || WebSocket.CLOSED;
  }
}

/**
 * Transport factory function - creates appropriate transport based on configuration
 */
export function createRealtimeTransport(
  transportConfig: TransportConfig = { type: 'webrtc' },
  audioElement?: HTMLAudioElement,
  applyCodec?: (pc: RTCPeerConnection) => void
): any {
  if (transportConfig.type === 'websocket') {
    console.log('Creating WebSocket transport for OpenAI Realtime API');
    return new OpenAIRealtimeWebSocket({
      audioElement,
      url: transportConfig.websocket?.url,
      headers: transportConfig.websocket?.headers,
    });
  }

  // Default to WebRTC transport (existing implementation)
  return new OpenAIRealtimeWebRTC({
    audioElement,
    changePeerConnection: async (pc: RTCPeerConnection) => {
      if (applyCodec) {
        applyCodec(pc);
      }
      return pc;
    },
  });
}

/**
 * Get transport configuration from URL parameters or environment
 */
export function getTransportConfigFromEnvironment(): TransportConfig {
  if (typeof window === 'undefined') {
    return { type: 'webrtc' }; // Default for server-side
  }

  const urlParams = new URLSearchParams(window.location.search);
  const transportType = urlParams.get('transport') as TransportType;
  
  if (transportType === 'websocket') {
    return {
      type: 'websocket',
      websocket: {
        url: urlParams.get('ws_url') || undefined,
      }
    };
  }

  // Default to WebRTC
  return { type: 'webrtc' };
} 