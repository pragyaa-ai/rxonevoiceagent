import React, { useState, useEffect } from 'react';
import { TelephonyProvider, TelephonyProviderConfig } from '@/app/types';
import { TELEPHONY_PROVIDERS, getDefaultTelephonyConfig, validateTelephonyConfig } from '@/app/lib/telephonyProviders';

interface TelephonyConfigProps {
  provider: TelephonyProvider;
  isVisible: boolean;
  onClose: () => void;
}

const TelephonyConfig: React.FC<TelephonyConfigProps> = ({ provider, isVisible, onClose }) => {
  const [config, setConfig] = useState<TelephonyProviderConfig>(getDefaultTelephonyConfig());
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    // Load saved configuration from localStorage
    const savedConfig = localStorage.getItem(`telephonyConfig_${provider}`);
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
      } catch (error) {
        console.error('Failed to parse saved telephony config:', error);
      }
    }
  }, [provider]);

  useEffect(() => {
    setIsValid(validateTelephonyConfig(config));
  }, [config]);

  const handleSave = () => {
    localStorage.setItem(`telephonyConfig_${provider}`, JSON.stringify(config));
    onClose();
  };

  const updateConfig = (field: string, value: any) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      newConfig.provider = provider;
      newConfig.enabled = true;
      
      if (provider === 'ozonetel') {
        newConfig.ozonetel = { 
          websocketUrl: 'wss://voiceagent.pragyaa.ai/wsDVCom',
          audioFormat: '8khz' as const,
          ...prev.ozonetel, 
          [field]: value 
        };
      } else if (provider === 'exotel') {
        newConfig.exotel = { 
          apiKey: '',
          apiToken: '',
          subdomain: '',
          ...prev.exotel, 
          [field]: value 
        };
      } else if (provider === 'plivo') {
        newConfig.plivo = { 
          authId: '',
          authToken: '',
          ...prev.plivo, 
          [field]: value 
        };
      } else if (provider === 'cell24x7') {
        newConfig.cell24x7 = { 
          apiKey: '',
          username: '',
          ...prev.cell24x7, 
          [field]: value 
        };
      }
      
      return newConfig;
    });
  };

  if (!isVisible || provider === 'none') {
    return null;
  }

  const providerInfo = TELEPHONY_PROVIDERS[provider];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <span className="text-2xl">{providerInfo.icon}</span>
            {providerInfo.name} Configuration
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        <p className="text-gray-600 mb-4">{providerInfo.description}</p>

        {provider === 'ozonetel' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WebSocket URL
              </label>
              <input
                type="url"
                value={config.ozonetel?.websocketUrl || ''}
                onChange={(e) => updateConfig('websocketUrl', e.target.value)}
                placeholder="wss://voiceagent.pragyaa.ai/wsDVCom"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key (Optional)
              </label>
              <input
                type="password"
                value={config.ozonetel?.apiKey || ''}
                onChange={(e) => updateConfig('apiKey', e.target.value)}
                placeholder="Your Ozonetel API key"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DID Number (Optional)
              </label>
              <input
                type="tel"
                value={config.ozonetel?.did || ''}
                onChange={(e) => updateConfig('did', e.target.value)}
                placeholder="+91XXXXXXXXXX"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Audio Format
              </label>
              <select
                value={config.ozonetel?.audioFormat || '8khz'}
                onChange={(e) => updateConfig('audioFormat', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="8khz">8 kHz (Standard telephony)</option>
                <option value="16khz">16 kHz (Higher quality)</option>
              </select>
            </div>
          </div>
        )}

        {provider === 'exotel' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key
              </label>
              <input
                type="password"
                value={config.exotel?.apiKey || ''}
                onChange={(e) => updateConfig('apiKey', e.target.value)}
                placeholder="Your Exotel API key"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Token
              </label>
              <input
                type="password"
                value={config.exotel?.apiToken || ''}
                onChange={(e) => updateConfig('apiToken', e.target.value)}
                placeholder="Your Exotel API token"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subdomain
              </label>
              <input
                type="text"
                value={config.exotel?.subdomain || ''}
                onChange={(e) => updateConfig('subdomain', e.target.value)}
                placeholder="your-subdomain"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        )}

        {provider === 'plivo' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Auth ID
              </label>
              <input
                type="text"
                value={config.plivo?.authId || ''}
                onChange={(e) => updateConfig('authId', e.target.value)}
                placeholder="Your Plivo Auth ID"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Auth Token
              </label>
              <input
                type="password"
                value={config.plivo?.authToken || ''}
                onChange={(e) => updateConfig('authToken', e.target.value)}
                placeholder="Your Plivo Auth Token"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        )}

        {provider === 'cell24x7' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key
              </label>
              <input
                type="password"
                value={config.cell24x7?.apiKey || ''}
                onChange={(e) => updateConfig('apiKey', e.target.value)}
                placeholder="Your Cell 24x7 API key"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={config.cell24x7?.username || ''}
                onChange={(e) => updateConfig('username', e.target.value)}
                placeholder="Your Cell 24x7 username"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mt-6">
          <div className="flex items-center">
            {isValid ? (
              <div className="flex items-center text-green-600">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Configuration valid
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Missing required fields
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!isValid}
              className={`px-4 py-2 rounded-md ${
                isValid
                  ? `${providerInfo.color} text-white hover:opacity-90`
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Save Configuration
            </button>
          </div>
        </div>

        {provider === 'ozonetel' && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <h4 className="font-medium text-blue-900 mb-1">Quick Setup Guide:</h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Configure your Ozonetel webhook to: <code className="bg-blue-100 px-1 rounded">/api/telephony/ozonetel</code></li>
              <li>2. Ensure your WebSocket endpoint is accessible</li>
              <li>3. Test with a sample call to verify audio flow</li>
              <li>4. Monitor healthcare agent handoffs in Agent View</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};

export default TelephonyConfig; 