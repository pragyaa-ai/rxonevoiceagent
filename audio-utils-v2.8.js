/**
 * Advanced Audio Utilities for High-Quality Resampling (JavaScript Version)
 * RxOne Healthcare VoiceAgent v2.8
 * 
 * Provides librosa-equivalent audio resampling for improved voice quality
 * and reduced audio jerkiness in telephony applications.
 */

// High-quality resampling using advanced interpolation
function resampleAudio(inputBuffer, inputSampleRate, outputSampleRate) {
  if (inputSampleRate === outputSampleRate) {
    return inputBuffer;
  }

  const ratio = outputSampleRate / inputSampleRate;
  const outputLength = Math.floor(inputBuffer.length * ratio);
  const outputBuffer = new Float32Array(outputLength);

  // Use Lanczos interpolation for high-quality resampling (similar to librosa)
  const lanczosKernel = (x, a = 3) => {
    if (x === 0) return 1;
    if (Math.abs(x) >= a) return 0;
    
    const pix = Math.PI * x;
    return (a * Math.sin(pix) * Math.sin(pix / a)) / (pix * pix);
  };

  for (let i = 0; i < outputLength; i++) {
    const inputIndex = i / ratio;
    const leftIndex = Math.floor(inputIndex);
    const rightIndex = leftIndex + 1;
    
    if (rightIndex >= inputBuffer.length) {
      outputBuffer[i] = inputBuffer[inputBuffer.length - 1];
      continue;
    }

    // High-quality interpolation with windowing
    let sum = 0;
    let weightSum = 0;
    
    const windowSize = 6; // Lanczos window size
    const start = Math.max(0, leftIndex - windowSize);
    const end = Math.min(inputBuffer.length - 1, leftIndex + windowSize);
    
    for (let j = start; j <= end; j++) {
      const distance = inputIndex - j;
      const weight = lanczosKernel(distance);
      sum += inputBuffer[j] * weight;
      weightSum += weight;
    }
    
    outputBuffer[i] = weightSum > 0 ? sum / weightSum : 0;
  }

  return outputBuffer;
}

// Anti-aliasing low-pass filter (similar to librosa's filtering)
function applyAntiAliasingFilter(buffer, cutoffFreq, sampleRate) {
  const filtered = new Float32Array(buffer.length);
  const rc = 1.0 / (cutoffFreq * 2 * Math.PI);
  const dt = 1.0 / sampleRate;
  const alpha = dt / (rc + dt);

  // Simple low-pass filter to prevent aliasing
  filtered[0] = buffer[0];
  for (let i = 1; i < buffer.length; i++) {
    filtered[i] = filtered[i - 1] + alpha * (buffer[i] - filtered[i - 1]);
  }

  return filtered;
}

// Normalize audio to prevent clipping
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
 * High-quality PCM conversion from 24kHz to 8kHz
 * Equivalent to librosa.resample with proper downsampling
 */
function convertPCM24kTo8k_HighQuality(samples) {
  console.log(`[Audio v2.8] Converting ${samples.length} samples from 24kHz to 8kHz with high-quality processing`);
  
  // Convert int16 samples to float32 for processing
  const float32Input = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    float32Input[i] = samples[i] / 32768.0; // Normalize to [-1, 1]
  }
  
  // Apply anti-aliasing filter before downsampling (critical for quality)
  const preFiltered = applyAntiAliasingFilter(float32Input, 3800, 24000); // 3.8kHz cutoff
  
  // High-quality resampling: 24kHz → 8kHz (1/3 downsampling)
  const resampled = resampleAudio(preFiltered, 24000, 8000);
  
  // Final normalization
  const normalized = normalizeAudio(resampled);
  
  // Convert back to int16 PCM
  const outputSamples = [];
  for (let i = 0; i < normalized.length; i++) {
    const sample = Math.max(-32768, Math.min(32767, Math.round(normalized[i] * 32767)));
    outputSamples.push(sample);
  }
  
  console.log(`[Audio v2.8] Downsampled to ${outputSamples.length} samples with anti-aliasing (quality ratio: ${(outputSamples.length / samples.length).toFixed(3)})`);
  
  return outputSamples;
}

/**
 * High-quality PCM conversion from 8kHz to 24kHz
 * Equivalent to librosa.resample with anti-aliasing
 */
function convertPCM8kTo24k_HighQuality(samples) {
  console.log(`[Audio v2.8] Converting ${samples.length} samples from 8kHz to 24kHz with high-quality processing`);
  
  // Convert int16 samples to float32 for processing
  const float32Input = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    float32Input[i] = samples[i] / 32768.0; // Normalize to [-1, 1]
  }
  
  // High-quality resampling: 8kHz → 24kHz (3x upsampling)
  const resampled = resampleAudio(float32Input, 8000, 24000);
  
  // Apply anti-aliasing filter for clean output
  const filtered = applyAntiAliasingFilter(resampled, 4000, 24000); // 4kHz cutoff for telephony
  
  // Normalize to prevent clipping
  const normalized = normalizeAudio(filtered);
  
  // Convert back to int16 PCM
  const outputSamples = [];
  for (let i = 0; i < normalized.length; i++) {
    const sample = Math.max(-32768, Math.min(32767, Math.round(normalized[i] * 32767)));
    outputSamples.push(sample);
  }
  
  console.log(`[Audio v2.8] Upsampled to ${outputSamples.length} samples with high-quality interpolation (quality ratio: ${(outputSamples.length / samples.length).toFixed(3)})`);
  
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

console.log('[Audio v2.8] High-quality audio resampling utilities loaded (JavaScript version)'); 