// Language filtering utility for transcripts
// Ensures only English, Hindi, and Kannada characters are displayed

// Unicode ranges for allowed languages
const ALLOWED_UNICODE_RANGES = [
  // Basic Latin (English) - 0000-007F
  [0x0000, 0x007F],
  // Latin-1 Supplement (Extended English) - 0080-00FF  
  [0x0080, 0x00FF],
  // Latin Extended-A (Extended English) - 0100-017F
  [0x0100, 0x017F],
  // Latin Extended-B (Extended English) - 0180-024F
  [0x0180, 0x024F],
  // Devanagari (Hindi) - 0900-097F
  [0x0900, 0x097F],
  // Devanagari Extended (Hindi) - A8E0-A8FF
  [0xA8E0, 0xA8FF],
  // Kannada - 0C80-0CFF
  [0x0C80, 0x0CFF],
  // General Punctuation - 2000-206F
  [0x2000, 0x206F],
  // Mathematical Operators - 2200-22FF
  [0x2200, 0x22FF],
];

// Common words in different languages for better detection
const LANGUAGE_PATTERNS = {
  hindi: {
    words: ['मैं', 'हूं', 'है', 'का', 'की', 'के', 'को', 'से', 'में', 'पर', 'और', 'या', 'तो', 'नहीं', 'हां', 'जी', 'आप', 'तुम', 'वह', 'यह'],
    greeting: ['नमस्ते', 'नमस्कार'],
  },
  kannada: {
    words: ['ನಾನು', 'ಇದೆ', 'ಅಲ್ಲ', 'ಮತ್ತು', 'ಅಥವಾ', 'ಆದರೆ', 'ಈ', 'ಆ', 'ಅವರು', 'ನೀವು', 'ಇದು', 'ಅದು'],
    greeting: ['ನಮಸ್ಕಾರ', 'ನಮಸ್ತೆ'],
  },
  english: {
    words: ['the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'have', 'has', 'had', 'will', 'would', 'can', 'could', 'should'],
    greeting: ['hello', 'hi', 'namaste', 'good morning', 'good afternoon', 'good evening'],
  }
};

/**
 * Check if a character is in allowed unicode ranges
 */
function isCharacterAllowed(char: string): boolean {
  const codePoint = char.codePointAt(0);
  if (codePoint === undefined) return false;
  
  return ALLOWED_UNICODE_RANGES.some(([start, end]) => 
    codePoint >= start && codePoint <= end
  );
}

/**
 * Detect the primary language of the text
 */
function detectLanguage(text: string): 'english' | 'hindi' | 'kannada' | 'mixed' {
  const lowerText = text.toLowerCase();
  
  // Check for Hindi patterns
  const hindiMatches = LANGUAGE_PATTERNS.hindi.words.filter(word => 
    text.includes(word)
  ).length + LANGUAGE_PATTERNS.hindi.greeting.filter(word => 
    text.includes(word)
  ).length;
  
  // Check for Kannada patterns  
  const kannadaMatches = LANGUAGE_PATTERNS.kannada.words.filter(word => 
    text.includes(word)
  ).length + LANGUAGE_PATTERNS.kannada.greeting.filter(word => 
    text.includes(word)
  ).length;
  
  // Check for English patterns
  const englishMatches = LANGUAGE_PATTERNS.english.words.filter(word => 
    lowerText.includes(word.toLowerCase())
  ).length + LANGUAGE_PATTERNS.english.greeting.filter(word => 
    lowerText.includes(word.toLowerCase())
  ).length;
  
  // Determine primary language
  if (hindiMatches > kannadaMatches && hindiMatches > englishMatches) {
    return 'hindi';
  } else if (kannadaMatches > hindiMatches && kannadaMatches > englishMatches) {
    return 'kannada';
  } else if (englishMatches > 0) {
    return 'english';
  } else {
    // Check character distribution
    const totalChars = text.length;
    const devanagariChars = [...text].filter(char => {
      const code = char.codePointAt(0) || 0;
      return code >= 0x0900 && code <= 0x097F;
    }).length;
    const kannadaChars = [...text].filter(char => {
      const code = char.codePointAt(0) || 0;
      return code >= 0x0C80 && code <= 0x0CFF;
    }).length;
    
    if (devanagariChars > totalChars * 0.3) return 'hindi';
    if (kannadaChars > totalChars * 0.3) return 'kannada';
    
    return 'english'; // Default to English
  }
}

/**
 * Filter text to only include allowed language characters
 */
function filterAllowedCharacters(text: string): string {
  return [...text]
    .filter(char => isCharacterAllowed(char) || /\s/.test(char)) // Allow whitespace
    .join('');
}

/**
 * Transliterate common names to English if they appear in other scripts
 */
function transliterateCommonNames(text: string): string {
  const commonTransliterations: Record<string, string> = {
    // Arabic/Urdu to English
    'گلشن': 'Gulshan',
    'محمد': 'Mohammad',
    'احمد': 'Ahmad',
    'علی': 'Ali',
    'فاطمہ': 'Fatima',
    
    // Add more common name transliterations as needed
  };
  
  let result = text;
  for (const [foreign, english] of Object.entries(commonTransliterations)) {
    result = result.replace(new RegExp(foreign, 'g'), english);
  }
  
  return result;
}

/**
 * Main function to filter and clean transcript text
 */
export function filterTranscriptText(text: string): string {
  if (!text || text.trim().length === 0) {
    return text;
  }
  
  // First, try to transliterate common names
  let cleanedText = transliterateCommonNames(text);
  
  // Filter to only allowed characters
  cleanedText = filterAllowedCharacters(cleanedText);
  
  // If the text is completely filtered out, check if it was a name/simple word
  if (cleanedText.trim().length === 0 && text.trim().length > 0) {
    // If original text was short (likely a name), try to provide fallback
    if (text.trim().length <= 20 && !/\s/.test(text.trim())) {
      return '[Name provided]'; // Placeholder for names in unsupported scripts
    }
    return '[Non-supported language detected]';
  }
  
  // Clean up extra whitespace
  cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
  
  return cleanedText;
}

/**
 * Get language display information for debugging
 */
export function getLanguageInfo(text: string): {
  detectedLanguage: string;
  originalLength: number;
  filteredLength: number;
  containsUnsupportedChars: boolean;
} {
  const filtered = filterAllowedCharacters(text);
  
  return {
    detectedLanguage: detectLanguage(text),
    originalLength: text.length,
    filteredLength: filtered.length,
    containsUnsupportedChars: filtered.length !== text.length,
  };
} 