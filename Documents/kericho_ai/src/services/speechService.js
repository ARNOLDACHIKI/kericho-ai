/**
 * Speech Service
 * 
 * Transcribes audio files to text using OpenAI Whisper API.
 * Used for processing voice notes from WhatsApp.
 *
 * Usage:
 *   const { transcribeAudio } = require('./speechService');
 *   const text = await transcribeAudio('/tmp/audio.ogg');
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const env = require('../config/env');
const logger = require('../lib/logger');

/**
 * Transcribe audio file to text using OpenAI Whisper API
 * 
 * @param {string} filePath - Path to audio file
 * @param {object} options - Options for transcription
 * @param {string} options.language - Language code (e.g., 'en', 'sw') - helps improve accuracy
 * @returns {Promise<string>} - Transcribed text
 * 
 * Supported formats: mp3, mp4, mpeg, mpga, m4a, ogg, flac, wav, webm
 */
async function transcribeAudio(filePath, options = {}) {
  const { language = undefined } = options;

  if (!env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`Audio file not found: ${filePath}`);
  }

  try {
    logger.info(
      { filePath, language },
      '[speechService] Starting transcription'
    );

    // Create form data
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    form.append('model', 'whisper-1');

    // Add language if specified (improves accuracy)
    if (language) {
      form.append('language', language);
    }

    // Call OpenAI Whisper API
    const response = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
      }
    );

    const transcribedText = response.data.text || '';

    logger.info(
      { filePath, textLength: transcribedText.length },
      '[speechService] Transcription successful'
    );

    return transcribedText;
  } catch (error) {
    logger.error(
      { filePath, error: error.message },
      '[speechService] Transcription failed'
    );

    // Provide helpful error messages
    if (error.response?.status === 401) {
      throw new Error('Invalid OpenAI API key');
    }

    if (error.response?.status === 429) {
      throw new Error('OpenAI API rate limit exceeded');
    }

    throw new Error(`Transcription failed: ${error.message}`);
  }
}

/**
 * Transcribe audio and get structured result with metadata
 * 
 * @param {string} filePath - Path to audio file
 * @param {string} userLanguage - User's language preference ('en' or 'sw')
 * @returns {Promise<object>} - { success, text, language, error? }
 */
async function transcribeAudioSafe(filePath, userLanguage = 'en') {
  try {
    // Map user language to Whisper language code
    // Note: Whisper language parameter helps but isn't required
    const whisperLang = userLanguage === 'sw' ? 'sw' : 'en';

    const text = await transcribeAudio(filePath, { language: whisperLang });

    return {
      success: true,
      text: text.trim(),
      language: userLanguage,
    };
  } catch (error) {
    logger.error(
      { error: error.message },
      '[speechService] Safe transcription failed'
    );

    return {
      success: false,
      text: '',
      language: userLanguage,
      error: error.message,
    };
  }
}

module.exports = {
  transcribeAudio,
  transcribeAudioSafe,
};
