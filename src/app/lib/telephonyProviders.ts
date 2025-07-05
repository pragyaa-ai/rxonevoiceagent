import { TelephonyProvider, TelephonyProviderConfig } from '@/app/types';

// Telephony Provider Configurations
export const TELEPHONY_PROVIDERS: Record<TelephonyProvider, { 
  name: string; 
  description: string;
  color: string;
  icon: string;
}> = {
  none: {
    name: 'None',
    description: 'No telephony integration',
    color: 'bg-gray-500',
    icon: '🚫'
  },
  ozonetel: {
    name: 'Ozonetel',
    description: 'Cloud telephony with WebSocket streaming',
    color: 'bg-blue-500',
    icon: '☁️'
  },
  exotel: {
    name: 'Exotel',
    description: 'Enterprise cloud telephony platform',
    color: 'bg-green-500',
    icon: '📞'
  },
  plivo: {
    name: 'Plivo',
    description: 'Communications platform as a service',
    color: 'bg-purple-500',
    icon: '🌐'
  },
  cell24x7: {
    name: 'Cell 24x7',
    description: 'Healthcare-focused telephony solutions',
    color: 'bg-red-500',
    icon: '🏥'
  }
};

export const getDefaultTelephonyConfig = (): TelephonyProviderConfig => ({
  provider: 'none',
  enabled: false,
  ozonetel: {
    websocketUrl: process.env.OZONETEL_WEBSOCKET_URL || 'wss://voiceagent.pragyaa.ai/wsDVCom',
    audioFormat: (process.env.OZONETEL_AUDIO_FORMAT as '8khz' | '16khz') || '8khz',
    did: process.env.OZONETEL_DID,
    apiKey: process.env.OZONETEL_API_KEY
  }
});

export const validateTelephonyConfig = (config: TelephonyProviderConfig): boolean => {
  if (!config.enabled || config.provider === 'none') {
    return true;
  }

  switch (config.provider) {
    case 'ozonetel':
      return !!(config.ozonetel?.websocketUrl);
    case 'exotel':
      return !!(config.exotel?.apiKey && config.exotel?.apiToken && config.exotel?.subdomain);
    case 'plivo':
      return !!(config.plivo?.authId && config.plivo?.authToken);
    case 'cell24x7':
      return !!(config.cell24x7?.apiKey && config.cell24x7?.username);
    default:
      return false;
  }
};

export const getTelephonyProviderEndpoint = (provider: TelephonyProvider): string => {
  switch (provider) {
    case 'ozonetel':
      return '/api/telephony/ozonetel';
    case 'exotel':
      return '/api/telephony/exotel';
    case 'plivo':
      return '/api/telephony/plivo';
    case 'cell24x7':
      return '/api/telephony/cell24x7';
    default:
      return '/api/telephony/none';
  }
}; 