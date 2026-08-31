// Minimal Node smoke test for PlotThreads core logic.
// No dependencies, no framework — plain asserts. Run: node tests/logic.test.js

const assert = require('assert');
const { isStale, createThread, filterThreads, sortThreads, computeStats } = require('../app.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

test('createThread applies defaults for missing/invalid fields', () => {
  const t = createThread({ name: '  The Missing Heir  ', status: 'bogus' });
  assert.strictEqual(t.name, 'The Missing Heir');
  assert.strictEqual(t.status, 'planted'); // invalid status falls back
  assert.strictEqual(t.lastUpdatedChapter, 0);
  assert.ok(t.id);
});

test('isStale flags a planted thread that has not moved in N chapters', () => {
  const t = createThread({ name: 'A', status: 'planted', lastUpdatedChapter: 2 });
  assert.strictEqual(isStale(t, 10, 5), true); // gap of 8 > threshold 5
  assert.strictEqual(isStale(t, 5, 5), false); // gap of 3 <= threshold 5
});

test('isStale never flags resolved threads', () => {
  const t = createThread({ name: 'A', status: 'resolved', lastUpdatedChapter: 0 });
  assert.strictEqual(isStale(t, 100, 1), false);
});

test('isStale respects exact-boundary threshold (gap must exceed, not equal)', () => {
  const t = createThread({ name: 'A', status: 'developing', lastUpdatedChapter: 5 });
  assert.strictEqual(isStale(t, 10, 5), false); // gap == threshold -> not stale
  assert.strictEqual(isStale(t, 11, 5), true); // gap > threshold -> stale
});

test('filterThreads filters by status and by stale-only', () => {
  const threads = [
    createThread({ name: 'A', status: 'planted', lastUpdatedChapter: 0 }),
    createThread({ name: 'B', status: 'developing', lastUpdatedChapter: 9 }),
    createThread({ name: 'C', status: 'resolved', lastUpdatedChapter: 0 }),
  ];
  const currentChapter = 10;
  const threshold = 3;

  assert.strictEqual(filterThreads(threads, 'planted', currentChapter, threshold).length, 1);
  assert.strictEqual(filterThreads(threads, 'resolved', currentChapter, threshold).length, 1);
  const stale = filterThreads(threads, 'stale', currentChapter, threshold);
  assert.strictEqual(stale.length, 1);
  assert.strictEqual(stale[0].name, 'A'); // gap 10 > 3; B has gap 1 (not stale); C resolved
  assert.strictEqual(filterThreads(threads, 'all', currentChapter, threshold).length, 3);
});

test('sortThreads puts stale threads first', () => {
  const threads = [
    createThread({ name: 'Fresh', status: 'planted', lastUpdatedChapter: 9 }),
    createThread({ name: 'Stale', status: 'planted', lastUpdatedChapter: 0 }),
  ];
  const sorted = sortThreads(threads, 10, 3);
  assert.strictEqual(sorted[0].name, 'Stale');
  assert.strictEqual(sorted[1].name, 'Fresh');
});

test('computeStats tallies totals and stale count correctly', () => {
  const threads = [
    createThread({ name: 'A', status: 'planted', lastUpdatedChapter: 0 }),
    createThread({ name: 'B', status: 'developing', lastUpdatedChapter: 9 }),
    createThread({ name: 'C', status: 'resolved', lastUpdatedChapter: 0 }),
  ];
  const stats = computeStats(threads, 10, 3);
  assert.strictEqual(stats.total, 3);
  assert.strictEqual(stats.planted, 1);
  assert.strictEqual(stats.developing, 1);
  assert.strictEqual(stats.resolved, 1);
  assert.strictEqual(stats.stale, 1);
});

console.log(`\n${passed} tests passed.`);
