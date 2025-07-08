#!/usr/bin/env python3
"""
High-Quality Audio Processor using Librosa
RxOne Healthcare VoiceAgent - Professional Audio Resampling

Provides librosa-based audio resampling for optimal voice quality
in real-time telephony applications.
"""

import sys
import json
import numpy as np
import librosa
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='[Audio-Librosa] %(message)s')
logger = logging.getLogger(__name__)

def resample_audio_librosa(samples, orig_sr, target_sr):
    """
    High-quality audio resampling using librosa
    
    Args:
        samples: List of int16 PCM samples
        orig_sr: Original sample rate (Hz)
        target_sr: Target sample rate (Hz)
    
    Returns:
        List of resampled int16 PCM samples
    """
    # Convert int16 samples to float32 normalized to [-1, 1]
    audio_float = np.array(samples, dtype=np.float32) / 32768.0
    
    # Use librosa for high-quality resampling with anti-aliasing
    resampled_float = librosa.resample(
        audio_float, 
        orig_sr=orig_sr, 
        target_sr=target_sr,
        res_type='kaiser_best'  # Highest quality resampling
    )
    
    # Convert back to int16 PCM with proper clipping
    resampled_int16 = np.clip(resampled_float * 32767, -32768, 32767).astype(np.int16)
    
    return resampled_int16.tolist()

def process_audio_request(request):
    """Process incoming audio resampling request"""
    try:
        operation = request.get('operation')
        samples = request.get('samples')
        
        if operation == 'downsample_24k_to_8k':
            # OpenAI audio (24kHz) → Ozonetel (8kHz)
            result = resample_audio_librosa(samples, 24000, 8000)
            logger.info(f"Downsampled {len(samples)} → {len(result)} samples (24kHz→8kHz)")
            
        elif operation == 'upsample_8k_to_24k':
            # Ozonetel audio (8kHz) → OpenAI (24kHz)  
            result = resample_audio_librosa(samples, 8000, 24000)
            logger.info(f"Upsampled {len(samples)} → {len(result)} samples (8kHz→24kHz)")
            
        else:
            raise ValueError(f"Unknown operation: {operation}")
        
        return {
            'success': True,
            'samples': result,
            'input_length': len(samples),
            'output_length': len(result),
            'operation': operation,
            'requestId': request.get('requestId')
        }
        
    except Exception as e:
        logger.error(f"Audio processing error: {e}")
        return {
            'success': False,
            'error': str(e),
            'operation': request.get('operation', 'unknown'),
            'requestId': request.get('requestId')
        }

def main():
    """Main loop for processing audio requests from Node.js"""
    logger.info("Starting Librosa Audio Processor...")
    logger.info("Ready for high-quality audio resampling requests")
    
    try:
        for line in sys.stdin:
            line = line.strip()
            if not line:
                continue
                
            try:
                # Parse JSON request from Node.js
                request = json.loads(line)
                
                # Process the audio
                response = process_audio_request(request)
                
                # Send JSON response back to Node.js
                print(json.dumps(response), flush=True)
                
            except json.JSONDecodeError as e:
                error_response = {
                    'success': False,
                    'error': f'JSON decode error: {e}'
                }
                print(json.dumps(error_response), flush=True)
                
    except KeyboardInterrupt:
        logger.info("Audio processor shutting down...")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 