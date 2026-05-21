/**
 * Media Service
 * 
 * Downloads media files from WhatsApp Cloud API (Meta).
 * Used for processing voice notes and other media.
 *
 * Usage:
 *   const { downloadMedia } = require('./mediaService');
 *   const filePath = await downloadMedia(mediaId, 'audio.ogg');
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');
const env = require('../config/env');
const logger = require('../lib/logger');

// Create temp directory if it doesn't exist
const tempDir = path.join(os.tmpdir(), 'kericho-media');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

/**
 * Get media URL from Meta Cloud API
 * 
 * @param {string} mediaId - The media ID from WhatsApp message
 * @returns {Promise<string>} - The media download URL
 */
async function getMediaUrl(mediaId) {
  if (!env.WHATSAPP_ACCESS_TOKEN) {
    throw new Error('WhatsApp access token not configured');
  }

  try {
    const response = await axios.get(
      `https://graph.instagram.com/${env.WHATSAPP_API_VERSION}/${mediaId}`,
      {
        headers: {
          Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        },
      }
    );

    if (!response.data || !response.data.url) {
      throw new Error('No media URL in response');
    }

    return response.data.url;
  } catch (error) {
    logger.error(
      { mediaId, error: error.message },
      '[mediaService] Failed to get media URL'
    );
    throw error;
  }
}

/**
 * Download media file from URL and save to temp directory
 * 
 * @param {string} mediaUrl - The media file URL
 * @param {string} filename - Filename to save as
 * @returns {Promise<string>} - Path to saved temp file
 */
async function downloadMediaFile(mediaUrl, filename) {
  try {
    const filePath = path.join(tempDir, filename);

    const response = await axios.get(mediaUrl, {
      responseType: 'arraybuffer',
    });

    fs.writeFileSync(filePath, response.data);
    logger.info(
      { filePath, size: response.data.length },
      '[mediaService] Media file downloaded'
    );

    return filePath;
  } catch (error) {
    logger.error(
      { error: error.message },
      '[mediaService] Failed to download media file'
    );
    throw error;
  }
}

/**
 * Main function: Download media from WhatsApp
 * 
 * @param {string} mediaId - Media ID from WhatsApp message
 * @param {string} filename - Filename to save (e.g., 'audio.ogg')
 * @returns {Promise<string>} - Path to downloaded file
 * 
 * Usage:
 *   try {
 *     const filePath = await downloadMedia(mediaId, 'voice.ogg');
 *     // Process file...
 *   } catch (error) {
 *     console.error('Download failed:', error.message);
 *   }
 */
async function downloadMedia(mediaId, filename = 'media.ogg') {
  try {
    logger.info(
      { mediaId, filename },
      '[mediaService] Starting media download'
    );

    // Step 1: Get media URL from Meta API
    const mediaUrl = await getMediaUrl(mediaId);

    // Step 2: Download and save file
    const filePath = await downloadMediaFile(mediaUrl, filename);

    return filePath;
  } catch (error) {
    logger.error(
      { mediaId, error: error.message },
      '[mediaService] Media download failed'
    );
    throw new Error(`Failed to download media: ${error.message}`);
  }
}

/**
 * Delete temporary media file
 * 
 * @param {string} filePath - Path to file to delete
 * @returns {void}
 */
function deleteMedia(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info({ filePath }, '[mediaService] Temp file deleted');
    }
  } catch (error) {
    logger.warn(
      { filePath, error: error.message },
      '[mediaService] Failed to delete temp file'
    );
  }
}

module.exports = {
  downloadMedia,
  deleteMedia,
  getMediaUrl,
  downloadMediaFile,
};
