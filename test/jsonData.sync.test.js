const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { syncJsonData } = require('../services/jsonData');

test('syncJsonData joins the JSON files and removes stale database records', async () => {
  const records = [{ recordKey: 'stale|record', matchKey: 'stale|record' }];
  let indexCreated = false;

  const collection = {
    async createIndex(keys, options) {
      indexCreated = keys.recordKey === 1 && options.unique === true;
    },
    async bulkWrite(operations) {
      for (const { replaceOne } of operations) {
        const index = records.findIndex((record) => record.recordKey === replaceOne.filter.recordKey);
        if (index >= 0) {
          records[index] = replaceOne.replacement;
        } else if (replaceOne.upsert) {
          records.push(replaceOne.replacement);
        }
      }
    },
    async deleteMany(filter) {
      const currentKeys = new Set(filter.recordKey.$nin);
      for (let index = records.length - 1; index >= 0; index -= 1) {
        if (!currentKeys.has(records[index].recordKey)) {
          records.splice(index, 1);
        }
      }
    }
  };

  const count = await syncJsonData({ collection: () => collection });

  assert.equal(indexCreated, true);
  assert.ok(count > 0);
  assert.equal(records.length, count);
  assert.ok(records.every((record) => record.Name && record.State));
  assert.ok(records.some((record) => record.images.length > 0));
  assert.ok(records.every((record) => !record.recordKey.startsWith('stale|')));

  const combinedFile = path.join(__dirname, '../data/combined.json');
  const combinedData = JSON.parse(fs.readFileSync(combinedFile, 'utf8'));
  assert.ok(Array.isArray(combinedData));
  assert.equal(combinedData.length, count);
  assert.ok(combinedData.every((record) => record.Name && record.State));
  assert.ok(combinedData.some((record) => record.images.length > 0));
  assert.ok(combinedData.every((record) => !Object.hasOwn(record, 'recordKey')));
  assert.ok(combinedData.every((record) => !Object.hasOwn(record, 'image')));
});
