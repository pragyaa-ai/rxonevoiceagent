/**
 * Optimized Audio Utilities for Real-Time Processing (JavaScript Version)
 * RxOne Healthcare VoiceAgent v2.8 - Performance Optimized
 * 
 * Fast, efficient resampling for smooth real-time telephony without jerkiness
 */

// Lightweight resampling using optimized linear interpolation
function resampleAudio(inputBuffer, inputSampleRate, outputSampleRate) {
  if (inputSampleRate === outputSampleRate) {
    return inputBuffer;
  }

  const ratio = outputSampleRate / inputSampleRate;
  const outputLength = Math.floor(inputBuffer.length * ratio);
  const outputBuffer = new Float32Array(outputLength);

  // Fast linear interpolation - optimized for real-time processing
  for (let i = 0; i < outputLength; i++) {
    const inputIndex = i / ratio;
    const leftIndex = Math.floor(inputIndex);
    const rightIndex = leftIndex + 1;
    
    if (rightIndex >= inputBuffer.length) {
      outputBuffer[i] = inputBuffer[inputBuffer.length - 1];
      continue;
    }

    // Simple linear interpolation (much faster than Lanczos)
    const fraction = inputIndex - leftIndex;
    outputBuffer[i] = inputBuffer[leftIndex] * (1 - fraction) + inputBuffer[rightIndex] * fraction;
  }

  return outputBuffer;
}

// Simple anti-aliasing filter - optimized for speed
function applyAntiAliasingFilter(buffer, cutoffFreq, sampleRate) {
  const filtered = new Float32Array(buffer.length);
  const rc = 1.0 / (cutoffFreq * 2 * Math.PI);
  const dt = 1.0 / sampleRate;
  const alpha = dt / (rc + dt);

  // Fast single-pole low-pass filter
  filtered[0] = buffer[0];
  for (let i = 1; i < buffer.length; i++) {
    filtered[i] = filtered[i - 1] + alpha * (buffer[i] - filtered[i - 1]);
  }

  return filtered;
}

// Fast audio normalization
function normalizeAudio(buffer, targetLevel = 0.95) {
  const maxValue = Math.max(...buffer.map(Math.abs));
  if (maxValue === 0) return buffer;
  
  const normalized = new Float32Array(buffer.length);
  const scale = targetLevel / maxValue;
  
  for (let i = 0; i < buffer.length; i++) {
    normalized[i] = buffer[i] * scale;
  }
  
  return normalized;
}

/**
 * Optimized PCM conversion from 24kHz to 8kHz
 * Fast processing for real-time telephony without jerkiness
 */
function convertPCM24kTo8k_HighQuality(samples) {
  console.log(`[Audio v2.8-optimized] Converting ${samples.length} samples from 24kHz to 8kHz with optimized processing`);
  
  // Convert int16 samples to float32 for processing
  const float32Input = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    float32Input[i] = samples[i] / 32768.0; // Normalize to [-1, 1]
  }
  
  // Apply lightweight anti-aliasing filter
  const preFiltered = applyAntiAliasingFilter(float32Input, 3800, 24000); // 3.8kHz cutoff
  
  // Fast resampling: 24kHz → 8kHz (1/3 downsampling)
  const resampled = resampleAudio(preFiltered, 24000, 8000);
  
  // Final normalization
  const normalized = normalizeAudio(resampled);
  
  // Convert back to int16 PCM
  const outputSamples = [];
  for (let i = 0; i < normalized.length; i++) {
    const sample = Math.max(-32768, Math.min(32767, Math.round(normalized[i] * 32767)));
    outputSamples.push(sample);
  }
  
  console.log(`[Audio v2.8-optimized] Fast downsampled to ${outputSamples.length} samples (ratio: ${(outputSamples.length / samples.length).toFixed(3)})`);
  
  return outputSamples;
}

/**
 * Optimized PCM conversion from 8kHz to 24kHz
 * Fast processing for real-time telephony without jerkiness
 */
function convertPCM8kTo24k_HighQuality(samples) {
  console.log(`[Audio v2.8-optimized] Converting ${samples.length} samples from 8kHz to 24kHz with optimized processing`);
  
  // Convert int16 samples to float32 for processing
  const float32Input = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    float32Input[i] = samples[i] / 32768.0; // Normalize to [-1, 1]
  }
  
  // Fast resampling: 8kHz → 24kHz (3x upsampling)
  const resampled = resampleAudio(float32Input, 8000, 24000);
  
  // Apply lightweight anti-aliasing filter for clean output
  const filtered = applyAntiAliasingFilter(resampled, 4000, 24000); // 4kHz cutoff for telephony
  
  // Normalize to prevent clipping
  const normalized = normalizeAudio(filtered);
  
  // Convert back to int16 PCM
  const outputSamples = [];
  for (let i = 0; i < normalized.length; i++) {
    const sample = Math.max(-32768, Math.min(32767, Math.round(normalized[i] * 32767)));
    outputSamples.push(sample);
  }
  
  console.log(`[Audio v2.8-optimized] Fast upsampled to ${outputSamples.length} samples (ratio: ${(outputSamples.length / samples.length).toFixed(3)})`);
  
  return outputSamples;
}

/**
 * Audio quality metrics for monitoring
 */
function getAudioQualityMetrics(inputSamples, outputSamples) {
  // Calculate RMS levels
  const inputRMS = Math.sqrt(inputSamples.reduce((sum, sample) => sum + sample * sample, 0) / inputSamples.length);
  const outputRMS = Math.sqrt(outputSamples.reduce((sum, sample) => sum + sample * sample, 0) / outputSamples.length);
  
  return {
    inputLength: inputSamples.length,
    outputLength: outputSamples.length,
    inputRMS: inputRMS,
    outputRMS: outputRMS,
    dynamicRange: outputRMS > 0 ? 20 * Math.log10(32767 / outputRMS) : 0,
    conversionRatio: outputSamples.length / inputSamples.length
  };
}

module.exports = {
  convertPCM24kTo8k_HighQuality,
  convertPCM8kTo24k_HighQuality,
  getAudioQualityMetrics
};

console.log('[Audio v2.8-optimized] Fast audio resampling utilities loaded - optimized for real-time processing'); 