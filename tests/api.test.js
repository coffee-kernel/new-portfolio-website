/**
 * Minimal zero-dependency test suite for the serverless API functions.
 * Run with: node tests/api.test.js  (also wired into `npm test` and CI)
 */
const assert = require('assert');
const path = require('path');

const contactHandler = require(path.join(__dirname, '..', 'api', 'contact.js'));
const projectsHandler = require(path.join(__dirname, '..', 'api', 'projects.js'));

let passed = 0;
let failed = 0;

function mockRes() {
  const res = { statusCode: 200, body: null };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (obj) => {
    res.body = obj;
    return res;
  };
  res.setHeader = () => {};
  return res;
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`  \u2713 ${name}`);
    passed++;
  } catch (err) {
    console.error(`  \u2717 ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function run() {
  console.log('api/projects.js');
  await test('GET returns a list of projects', async () => {
    const req = { method: 'GET', query: {} };
    const res = mockRes();
    await projectsHandler(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(Array.isArray(res.body.projects));
    assert.ok(res.body.projects.length > 0);
  });

  await test('GET with featured=true filters the list', async () => {
    const req = { method: 'GET', query: { featured: 'true' } };
    const res = mockRes();
    await projectsHandler(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.projects.every((p) => p.featured));
  });

  await test('non-GET method is rejected with 405', async () => {
    const req = { method: 'POST', query: {} };
    const res = mockRes();
    await projectsHandler(req, res);
    assert.strictEqual(res.statusCode, 405);
  });

  console.log('\napi/contact.js');
  await test('valid submission succeeds', async () => {
    const req = {
      method: 'POST',
      headers: {},
      socket: { remoteAddress: '10.0.0.1' },
      body: { name: 'Jane Doe', email: 'jane@example.com', message: 'Hello there, this is a test.' },
    };
    const res = mockRes();
    await contactHandler(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
  });

  await test('missing fields are rejected with 400', async () => {
    const req = {
      method: 'POST',
      headers: {},
      socket: { remoteAddress: '10.0.0.2' },
      body: { name: 'Jane Doe' },
    };
    const res = mockRes();
    await contactHandler(req, res);
    assert.strictEqual(res.statusCode, 400);
  });

  await test('invalid email is rejected with 400', async () => {
    const req = {
      method: 'POST',
      headers: {},
      socket: { remoteAddress: '10.0.0.3' },
      body: { name: 'Jane Doe', email: 'not-an-email', message: 'Hello there, this is a test.' },
    };
    const res = mockRes();
    await contactHandler(req, res);
    assert.strictEqual(res.statusCode, 400);
  });

  await test('honeypot field silently short-circuits as success', async () => {
    const req = {
      method: 'POST',
      headers: {},
      socket: { remoteAddress: '10.0.0.4' },
      body: { name: 'Bot', email: 'bot@example.com', message: 'spam', company: 'filled' },
    };
    const res = mockRes();
    await contactHandler(req, res);
    assert.strictEqual(res.statusCode, 200);
  });

  await test('rate limiter blocks after 5 requests from the same IP', async () => {
    const ip = '10.0.0.5';
    let last;
    for (let i = 0; i < 6; i++) {
      const req = {
        method: 'POST',
        headers: {},
        socket: { remoteAddress: ip },
        body: { name: 'Jane Doe', email: 'jane@example.com', message: 'Hello there, this is a test.' },
      };
      const res = mockRes();
      await contactHandler(req, res);
      last = res;
    }
    assert.strictEqual(last.statusCode, 429);
  });

  await test('non-POST method is rejected with 405', async () => {
    const req = { method: 'GET', headers: {}, socket: {} };
    const res = mockRes();
    await contactHandler(req, res);
    assert.strictEqual(res.statusCode, 405);
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run();
