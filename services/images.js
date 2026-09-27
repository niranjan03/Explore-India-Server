const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createClient } = require('pexels');

const API_PEXELS_KEY = process.env.API_PEXELS_KEY;
const RATE_LIMIT_PER_HOUR = 200;
const WINDOW_MS = 60 * 60 * 1000;
const IMAGES_FILE_PATH = path.join(__dirname, '../data/images.json');

if (!API_PEXELS_KEY) {
  throw new Error('API_PEXELS_KEY is missing from the project .env file.');
}

const client = createClient(API_PEXELS_KEY);
const requestHistory = [];

function loadPlaces() {
  const filePath = path.join(__dirname, '../data/data.json');
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readImageStore() {
  if (!fs.existsSync(IMAGES_FILE_PATH)) {
    return [];
  }

  const raw = fs.readFileSync(IMAGES_FILE_PATH, 'utf8');
  if (!raw.trim()) {
    return [];
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error('Failed to parse images.json; resetting it.', error.message);
    fs.writeFileSync(IMAGES_FILE_PATH, '[]', 'utf8');
    return [];
  }
}

function saveImageStore(store) {
  fs.writeFileSync(IMAGES_FILE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

function getPlaceKey(place) {
  return `${(place.Name || '').trim()}|${(place.State || '').trim()}`.toLowerCase();
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanOldRequests() {
  const now = Date.now();
  while (requestHistory.length && requestHistory[0] <= now - WINDOW_MS) {
    requestHistory.shift();
  }
}

async function waitForRateLimit() {
  cleanOldRequests();

  while (requestHistory.length >= RATE_LIMIT_PER_HOUR) {
    const oldestRequestTime = requestHistory[0];
    const waitMs = WINDOW_MS - (Date.now() - oldestRequestTime) + 1000;

    console.log(`Pexels limit reached. Waiting ${Math.ceil(waitMs / 1000)} seconds for the next hourly window.`);
    await wait(waitMs);
    cleanOldRequests();
  }

  requestHistory.push(Date.now());
}

async function searchImages(query, perPage = 1) {
  await waitForRateLimit();

  try {
    const response = await client.photos.search({ query, per_page: perPage });
    return response.photos.map((photo) => ({
      id: photo.id,
      name: query,
      url: photo.url,
      original: photo.src?.original || '',
      alt: photo.alt || query,
    }));
  } catch (error) {
    if (error?.status === 429 || /429|rate limit|too many requests/i.test(error?.message || '')) {
      console.warn(`Rate limit hit for "${query}". Pausing before retrying...`);
      await wait(60 * 1000);
      return searchImages(query, perPage);
    }
    throw error;
  }
}

async function processPlace(place, imageStore) {
  const query = `${place.Name}, ${place.State}`;
  const placeKey = getPlaceKey(place);

  try {
    const images = await searchImages(query, 1);

    if (!images.length) {
      console.warn(`No image found for "${query}". Re-queuing for retry.`);
      return { success: false, query, placeKey };
    }

    const existingIndex = imageStore.findIndex((entry) => entry.placeKey === placeKey);
    const payload = { placeKey, query, name: place.Name, state: place.State, images };

    if (existingIndex >= 0) {
      imageStore[existingIndex] = payload;
    } else {
      imageStore.push(payload);
    }

    saveImageStore(imageStore);
    console.log(`Saved images for ${query}`);
    return { success: true, query, placeKey };
  } catch (error) {
    console.error(`Failed to fetch images for ${query}:`, error.message || error);
    return { success: false, query, placeKey };
  }
}

async function fillMissingImages() {
  const places = loadPlaces();
  let imageStore = readImageStore();
  const pending = [];

  for (const place of places) {
    const placeKey = getPlaceKey(place);
    const existingEntry = imageStore.find((entry) => entry.placeKey === placeKey);

    if (!existingEntry || !Array.isArray(existingEntry.images) || existingEntry.images.length === 0) {
      pending.push(place);
    }
  }

  if (pending.length === 0) {
    console.log('All places already have images. No more Pexels requests needed.');
    return;
  }

  console.log(`Starting image fill for ${pending.length} places with a 200 requests/hour limit.`);

  let attempts = 0;
  while (pending.length > 0) {
    const place = pending.shift();
    attempts += 1;

    imageStore = readImageStore();
    const result = await processPlace(place, imageStore);

    if (!result.success) {
      pending.push(place);
      console.log(`Retrying ${place.Name} in 10 seconds. Remaining: ${pending.length}`);
      await wait(10 * 1000);
    }

    if (attempts % 50 === 0) {
      console.log(`Processed ${attempts} attempts so far. Still waiting on ${pending.length} places.`);
    }
  }

  console.log('All places have images. Image collection completed.');
}

fillMissingImages().catch((error) => {
  console.error('Image fill job failed:', error);
  process.exit(1);
});

