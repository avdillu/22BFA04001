const express = require('express');
const { nanoid } = require('nanoid');
// CORRECTED: 'toISOString' is now 'toISOString' with a capital 'S'.
const { addMinutes, toISOString, isAfter } = require('date-fns');
const { Log } = require('../Logging Middleware/logger.js');

const app = express();
const PORT = 3000;
app.use(express.json());
const urlDatabase = new Map();

// --- API ENDPOINTS ---

app.post('/shorturls', async (req, res) => {
  await Log('backend', 'info', 'route', 'POST /shorturls request received');
  const { url, validity, shortcode } = req.body;

  if (!url) {
    await Log('backend', 'error', 'handler', 'Validation failed: URL is required.');
    return res.status(400).json({ error: 'URL is a required field.' });
  }

  let finalShortcode = shortcode;
  if (finalShortcode) {
    if (urlDatabase.has(finalShortcode)) {
      await Log('backend', 'error', 'handler', `Shortcode collision: ${finalShortcode}`);
      return res.status(409).json({ error: 'This shortcode is already in use.' });
    }
  } else {
    finalShortcode = nanoid(7);
  }

  const creationDate = new Date();
  const expiryDate = addMinutes(creationDate, validity || 30);

  const urlData = {
    originalUrl: url,
    // CORRECTED: Using 'toISOString' with a capital 'S'.
    creationDate: toISOString(creationDate),
    expiryDate: toISOString(expiryDate),
    clicks: [],
  };

  urlDatabase.set(finalShortcode, urlData);
  await Log('backend', 'info', 'service', `Created shortcode: ${finalShortcode}`);

  res.status(201).json({
    shortLink: `http://localhost:${PORT}/${finalShortcode}`,
    // CORRECTED: Using 'toISOString' with a capital 'S'.
    expiry: toISOString(expiryDate),
  });
});


app.get('/shorturls/:shortcode', async (req, res) => {
  const { shortcode } = req.params;
  await Log('backend', 'info', 'route', `Stats request for code: ${shortcode}`);

  const urlData = urlDatabase.get(shortcode);

  if (!urlData) {
    await Log('backend', 'warn', 'handler', `Stats failed, code not found: ${shortcode}`);
    return res.status(404).json({ error: 'Shortcode not found.' });
  }

  res.status(200).json({
    totalClicks: urlData.clicks.length,
    originalUrl: urlData.originalUrl,
    creationDate: urlData.creationDate,
    expiryDate: urlData.expiryDate,
    clickDetails: urlData.clicks,
  });
});


app.get('/:shortcode', async (req, res) => {
  const { shortcode } = req.params;
  await Log('backend', 'info', 'route', `Redirect request for code: ${shortcode}`);

  const urlData = urlDatabase.get(shortcode);

  if (!urlData) {
    await Log('backend', 'warn', 'handler', `Redirect failed, code not found: ${shortcode}`);
    return res.status(404).json({ error: 'Shortcode not found.' });
  }

  if (isAfter(new Date(), new Date(urlData.expiryDate))) {
    await Log('backend', 'warn', 'handler', `Expired link access: ${shortcode}`);
    return res.status(410).json({ error: 'This link has expired.' });
  }

  urlData.clicks.push({
    // CORRECTED: Using 'toISOString' with a capital 'S'.
    timestamp: toISOString(new Date()),
    referrer: req.headers.referer || 'direct',
    location: 'N/A',
  });

  await Log('backend', 'info', 'service', `Redirecting code: ${shortcode}`);
  res.redirect(302, urlData.originalUrl);
});


app.listen(PORT, async () => {
  await Log('backend', 'info', 'config', `Service listening on port ${PORT}`);
  console.log(`Service listening on http://localhost:${PORT}`);
});