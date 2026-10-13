const fs = require('node:fs');
const path = require('node:path');

const DATA_FILE = path.join(__dirname, '../data/data.json');
const IMAGES_FILE = path.join(__dirname, '../data/images.json');
const COMBINED_FILE = path.join(__dirname, '../data/combined.json');
const COLLECTION_NAME = 'json_destinations';

function normalizeValue(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function makeKey(name, state) {
  return `${normalizeValue(name)}|${normalizeValue(state)}`;
}

function readJsonArray(filePath) {
  let contents;
  try {
    contents = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to read ${path.basename(filePath)}: ${error.message}`);
  }

  try {
    const data = JSON.parse(contents);
    if (!Array.isArray(data)) {
      throw new Error('Expected a JSON array.');
    }
    return data;
  } catch (error) {
    throw new Error(`Failed to parse ${path.basename(filePath)}: ${error.message}`);
  }
}

function buildCombinedData(dataList, imageList) {
  const imageMap = new Map();

  imageList.forEach((item) => {
    imageMap.set(makeKey(item.name, item.state), item);
  });

  return dataList.map((entry, index) => {
    const matchKey = makeKey(entry.Name, entry.State);
    const imageEntry = imageMap.get(matchKey);
    return {
      ...entry,
      placeKey: imageEntry?.placeKey || matchKey,
      query: imageEntry?.query || `${entry.Name}, ${entry.State}`,
      images: Array.isArray(imageEntry?.images) ? imageEntry.images : [],
      recordKey: `${index}:${matchKey}`
    };
  });
}

console.log(buildCombinedData);

async function syncJsonData(db) {
  const dataList = readJsonArray(DATA_FILE);
  const imageList = readJsonArray(IMAGES_FILE);

  if (dataList.length === 0) {
    throw new Error('Refusing to sync an empty data.json file.');
  }

  const combined = buildCombinedData(dataList, imageList);
  const fileData = combined.map(({ recordKey, ...record }) => record);
  fs.writeFileSync(COMBINED_FILE, JSON.stringify(fileData, null, 2), 'utf8');

  const collection = db.collection(COLLECTION_NAME);
  const indexes = await collection.listIndexes().toArray();
  for (const index of indexes) {
    if (
      index.unique
      && Object.keys(index.key).length === 1
      && index.key.matchKey === 1
    ) {
      await collection.dropIndex(index.name);
    }
  }

  await collection.createIndex(
    { recordKey: 1 },
    {
      unique: true,
      partialFilterExpression: { recordKey: { $type: 'string' } }
    }
  );
  await collection.bulkWrite(combined.map((record) => ({
    replaceOne: {
      filter: { recordKey: record.recordKey },
      replacement: record,
      upsert: true
    }
  })));
  await collection.deleteMany({
    recordKey: { $nin: combined.map((record) => record.recordKey) }
  });

  return combined.length;
}

module.exports = {
  buildCombinedData,
  makeKey,
  normalizeValue,
  syncJsonData
};
