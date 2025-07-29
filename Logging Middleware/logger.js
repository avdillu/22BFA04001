const axios = require('axios');

// =======================================================================
// IMPORTANT: PASTE YOUR ACCESS TOKEN (Bearer Token) HERE
// =======================================================================
const BEARER_TOKEN = 'PASTE_YOUR_SAVED_ACCESS_TOKEN_HERE';
// =======================================================================

const LOGS_API_URL = 'http://20.244.56.144/evaluation-service/logs';

/**
 * Sends a log to the evaluation test server.
 * @param {string} stack - "backend" or "frontend"
 * @param {string} level - "debug", "info", "warn", "error", "fatal"
 * @param {string} pkg - The package/module where the log originates (e.g., "route", "handler").
 * @param {string} message - The descriptive log message.
 */
async function Log(stack, level, pkg, message) {
  // Do not proceed if the token is not set.
  if (BEARER_TOKEN === 'PASTE_YOUR_SAVED_ACCESS_TOKEN_HERE') {
    console.error('CRITICAL: Bearer token is not configured in logger.js. Logging is disabled.');
    return;
  }

  try {
    const response = await axios.post(
      LOGS_API_URL,
      {
        stack: stack,
        level: level,
        package: pkg,
        message: message,
      },
      {
        headers: {
          'Authorization': `Bearer ${BEARER_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    // Optional: Log success to console for local debugging if needed.
    // console.log(`Log sent. ID: ${response.data.logID}`);
  } catch (error) {
    // If the logging server fails, log the error to the console as a fallback.
    console.error('FALLBACK: Failed to send log to server.');
    console.error(`FALLBACK: [${level.toUpperCase()}] [${stack}/${pkg}] ${message}`);
    if (error.response) {
      console.error('FALLBACK: Server responded with:', error.response.data);
    }
  }
}

// Export the function to make it reusable in other parts of the application.
module.exports = { Log };