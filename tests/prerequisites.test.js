const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const BracuCatalog = require('../js/catalog.js');

function loadPrerequisites(attempts) {
  const context = {
    BracuCatalog,
    getCountedAttempts() {
      return attempts.filter(
        attempt => attempt.status === 'completed' && attempt.countsInCGPA !== false,
      );
    },
    getAllAttempts() { return attempts; },
  };
  vm.createContext(context);
  vm.runInContext(
    fs.readFileSync(path.join(__dirname, '..', 'js', 'prerequisites.js'), 'utf8'),
    context,
  );
  return context;
}

test('a satisfied alternative pair unlocks the canonical prerequisite without rewriting attempts', () => {
  const attempts = [
    { id: 'one', code: 'CSE161', status: 'completed', countsInCGPA: true },
    { id: 'two', code: 'CSE162L', status: 'completed', countsInCGPA: true },
  ];
  const before = structuredClone(attempts);
  const api = loadPrerequisites(attempts);

  assert.equal(api.completedCourseCodes({ semesters: [{ courses: attempts }] }).has('CSE110'), true);
  const result = api.checkPrerequisites(
    { semesters: [{ courses: attempts }] },
    { hardPrerequisites: ['CSE110'], softPrerequisites: [] },
  );
  assert.equal(result.eligible, true);
  assert.deepEqual(Array.from(result.missingHard), []);
  assert.deepEqual(Array.from(result.missingSoft), []);
  assert.deepEqual(attempts, before);
});

test('an incomplete or non-counted alternative pair does not unlock the canonical prerequisite', () => {
  const attempts = [
    { id: 'one', code: 'EEE283', status: 'completed', countsInCGPA: true },
    { id: 'two', code: 'EEE283L', status: 'completed', countsInCGPA: false },
  ];
  const api = loadPrerequisites(attempts);
  assert.equal(api.completedCourseCodes({ semesters: [{ courses: attempts }] }).has('CSE260'), false);
});
