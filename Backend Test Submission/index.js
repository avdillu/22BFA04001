


const express = require('express');
const { nanoid } = require('nanoid');
const { addMinutes, toISOString, isAfter } = require('date-fns');
const { Log } = require('../Logging Middleware/logger.js'); 

const app = express();
const PORT = 3000; 
app.use(express.json());
const urlDatabase = new Map();

// --- API ENDPOINTS ---

/**
 * 1. Create a Short URL
 * Method: POST
 * Route: /shorturls
 */
app.post('/shorturls', async (req, res) => {
  await Log('backend', 'info', 'route', 'Request received at POST /shorturls');
  const { url, validity, shortcode } = req.body;

  // Validate that the original URL was provided
  if (!url) {
    await Log('backend', 'error', 'handler', 'Validation failed: URL is a required field.');
    return res.status(400).json({ error: 'URL is a required field.' });
  }

  let finalShortcode = shortcode;
  if (finalShortcode) {
    // If a custom shortcode is provided, check if it's already in use
    if (urlDatabase.has(finalShortcode)) {
      await Log('backend', 'error', 'handler', `Shortcode collision: ${finalShortcode} already exists.`);
      return res.status(409).json({ error: 'This shortcode is already in use.' });
    }
  } else {
    // If no shortcode is provided, generate a unique one
    finalShortcode = nanoid(7); // e.g., 'abc1234'
  }

  const creationDate = new Date();
  // Default validity is 30 minutes if not provided
  const expiryDate = addMinutes(creationDate, validity || 30);

  const urlData = {
    originalUrl: url,
    creationDate: toISOString(creationDate),
    expiryDate: toISOString(expiryDate),
    clicks: [], // Initialize an empty array to track clicks
  };

  // Store the new URL data in our in-memory map
  urlDatabase.set(finalShortcode, urlData);
  await Log('backend', 'info', 'service', `Successfully created shortcode ${finalShortcode} for URL ${url}`);

  res.status(201).json({
    shortLink: `http://localhost:${PORT}/${finalShortcode}`,
    expiry: toISOString(expiryDate),
  });
});

/**
 * 2. Retrieve Short URL Statistics
 * Method: GET
 * Route: /shorturls/:shortcode
 */
app.get('/shorturls/:shortcode', async (req, res) => {
  const { shortcode } = req.params;
  await Log('backend', 'info', 'route', `Statistics request for shortcode: ${shortcode}`);

  const urlData = urlDatabase.get(shortcode);

  if (!urlData) {
    await Log('backend', 'warn', 'handler', `Statistics requested for non-existent shortcode: ${shortcode}`);
    return res.status(404).json({ error: 'Shortcode not found.' });
  }

  // Respond with the statistics
  res.status(200).json({
    totalClicks: urlData.clicks.length,
    originalUrl: urlData.originalUrl,
    creationDate: urlData.creationDate,
    expiryDate: urlData.expiryDate,
    clickDetails: urlData.clicks,
  });
});


/**
 * 3. Redirect to Original URL
 * Method: GET
 * Route: /:shortcode
 * NOTE: This must be the LAST route defined to avoid catching other routes like /shorturls.
 */
app.get('/:shortcode', async (req, res) => {
  const { shortcode } = req.params;
  await Log('backend', 'info', 'route', `Redirect request for shortcode: ${shortcode}`);

  const urlData = urlDatabase.get(shortcode);

  if (!urlData) {
    await Log('backend', 'warn', 'handler', `Redirect failed: Shortcode not found: ${shortcode}`);
    return res.status(404).json({ error: 'Shortcode not found.' });
  }

  // Check if the current date is after the expiry date
  if (isAfter(new Date(), new Date(urlData.expiryDate))) {
    await Log('backend', 'warn', 'handler', `Attempted to access expired link: ${shortcode}`);
    return res.status(410).json({ error: 'This link has expired.' });
  }

  // Record the click event for statistics
  urlData.clicks.push({
    timestamp: toISOString(new Date()),
    referrer: req.headers.referer || 'direct', // Get referrer from header, or mark as 'direct'
    location: 'N/A', // As per instructions, location can be coarse-grained
  });

  await Log('backend', 'info', 'service', `Redirecting ${shortcode} to its original URL.`);
  // Perform a 302 Found redirect
  res.redirect(302, urlData.originalUrl);
});


// Start the server
app.listen(PORT, async () => {
  await Log('backend', 'info', 'server', `Microservice started and listening on http://localhost:${PORT}`);
});