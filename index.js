require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

const idToUrl = new Map();
const urlToId = new Map();
let nextId = 1;

app.post('/api/shorturl', function (req, res) {
  const originalUrl = req.body.url;

  if (!originalUrl) {
    return res.json({ error: 'invalid url' })
  }

  let hostname;
  try {
    const parsed = new URL(originalUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return res.json({ error: 'invalid url' });
    }
    hostname = parsed.hostname;
  } catch (error) {
    return res.json({ error: 'invalid url' });
  }

  // Use dns.lookup to validate hostname exists
  dns.lookup(hostname, (dnsErr) => {
    if (dnsErr) {
      // hostname doesn't resolve
      return res.json({ error: 'invalid url' });
    }

    // If URL already exists, return existing id
    if (urlToId.has(originalUrl)) {
      const id = urlToId.get(originalUrl);
      return res.json({ original_url: originalUrl, short_url: id });
    }

    // Otherwise create new mapping
    const id = nextId++;
    idToUrl.set(id, originalUrl);
    urlToId.set(originalUrl, id);

    return res.json({ original_url: originalUrl, short_url: id });
  });
});

// GET /api/shorturl/:id -> redirect to original URL
app.get('/api/shorturl/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.json({ error: 'No short URL found for the given input' });
  }

  const original = idToUrl.get(id);
  if (!original) {
    return res.json({ error: 'No short URL found for the given input' });
  }

  // Redirect (302)
  return res.redirect(original);
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
