const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');
const express = require('express');
const jsonDataRoutes = require('../routes/jsonData');

test('GET /api/json/search?q=temple returns matching places', async () => {
  const app = express();
  const records = [
    { Name: 'Akshardham Temple', State: 'Delhi', image: null, matchKey: 'akshardham temple|delhi' },
    { Name: 'Red Fort', State: 'Delhi', image: null, matchKey: 'red fort|delhi' }
  ];
  app.use((req, res, next) => {
    req.db = {
      collection: () => ({
        find: () => ({ toArray: async () => records })
      })
    };
    next();
  });
  app.use('/api/json', jsonDataRoutes);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/json/search?q=temple`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.query.q, 'temple');
    assert.ok(body.count > 0);
    assert.ok(body.results.every((place) => place.Name.toLowerCase().includes('temple')));
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
