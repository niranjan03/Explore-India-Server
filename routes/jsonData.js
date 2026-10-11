const express = require('express');
const fs = require('fs');
const path = require('path');
const { makeKey, normalizeValue, syncJsonData } = require('../services/jsonData');

const router = express.Router();

const DATA_FILE = path.join(__dirname, '../data/data.json');
const IMAGES_FILE = path.join(__dirname, '../data/images.json');

function readJson(filePath, fallback = []) {
  if (!fs.existsSync(filePath)) return fallback;

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return raw && raw.trim() ? JSON.parse(raw) : fallback;
  } catch (error) {
    throw new Error(`Failed to read ${path.basename(filePath)}: ${error.message}`);
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function findItemByNameAndState(items, name, state, map = {}) {
  const key = makeKey(name, state);

  return items.findIndex((item) => {
    const itemName = item[map.nameField || 'name'];
    const itemState = item[map.stateField || 'state'];
    return makeKey(itemName, itemState) === key;
  });
}

router.get('/data', (req, res) => {
  try {
    const data = readJson(DATA_FILE, []);
    res.status(200).json({ count: data.length, data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/images', (req, res) => {
  try {
    const images = readJson(IMAGES_FILE, []);
    res.status(200).json({ count: images.length, images });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/combined', async (req, res) => {
  try {
    const combined = await req.db.collection('json_destinations')
      .find({}, { projection: { _id: 0, recordKey: 0 } })
      .toArray();

    res.status(200).json({
      count: combined.length,
      combined
    });
  } catch (error) {
    console.error('Error fetching combined JSON data:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { state, name, keyword, q } = req.query;
    const searchTerm = normalizeValue(q || keyword || name || '');
    const stateTerm = normalizeValue(state || '');
    const dataList = await req.db.collection('json_destinations')
      .find({}, { projection: { _id: 0, recordKey: 0 } })
      .toArray();

    const results = dataList.filter((entry) => {
      const entryName = normalizeValue(entry.Name);
      const entryState = normalizeValue(entry.State);

      const matchesState = !stateTerm || entryState.includes(stateTerm);
      const matchesName = !searchTerm || entryName.includes(searchTerm);

      return matchesState && matchesName;
    });

    res.status(200).json({
      count: results.length,
      query: { state, name, keyword, q },
      results
    });
  } catch (error) {
    console.error('Error searching combined JSON data:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/connect', async (req, res) => {
  try {
    const { name, state, data = {}, images = [] } = req.body || {};

    if (!name || !state) {
      return res.status(400).json({ message: 'Name and state are required.' });
    }

    const dataList = readJson(DATA_FILE, []);
    const imageList = readJson(IMAGES_FILE, []);

    const dataIndex = findItemByNameAndState(dataList, name, state, {
      nameField: 'Name',
      stateField: 'State'
    });

    const imageIndex = findItemByNameAndState(imageList, name, state, {
      nameField: 'name',
      stateField: 'state'
    });

    const dataEntry = {
      ...data,
      Name: String(name).trim(),
      State: String(state).trim()
    };

    const imageEntry = {
      name: String(name).trim(),
      state: String(state).trim(),
      placeKey: makeKey(name, state),
      query: `${String(name).trim()}, ${String(state).trim()}`,
      images: Array.isArray(images) ? images : []
    };

    if (dataIndex >= 0) {
      dataList[dataIndex] = { ...dataList[dataIndex], ...dataEntry };
    } else {
      dataList.push(dataEntry);
    }

    if (imageIndex >= 0) {
      imageList[imageIndex] = { ...imageList[imageIndex], ...imageEntry };
    } else {
      imageList.push(imageEntry);
    }

    writeJson(DATA_FILE, dataList);
    writeJson(IMAGES_FILE, imageList);
    await syncJsonData(req.db);

    res.status(200).json({
      message: 'Connected data.json and images.json by name and state.',
      connected: {
        name,
        state,
        data: dataEntry,
        image: imageEntry
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
