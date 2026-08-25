const test = require('node:test');
const assert = require('node:assert/strict');

const PasswordPolicy = require('../shared/password-policy.js');

test('administrator passwords require length, upper, lower, number, and symbol', () => {
  const invalidPasswords = [
    'Short1!',
    'lowercase-only1!',
    'UPPERCASE-ONLY1!',
    'NoNumberHere!',
    'NoSymbolHere123'
  ];

  for (const password of invalidPasswords) {
    assert.equal(PasswordPolicy.validateAdminPassword(password).valid, false, password);
  }

  assert.equal(PasswordPolicy.validateAdminPassword('SecurePass!2026').valid, true);
});

test('password assertion uses one concise, non-secret error message', () => {
  assert.throws(
    () => PasswordPolicy.assertAdminPassword('weak-password'),
    /12 characters.*uppercase.*lowercase.*number.*symbol/i
  );
  assert.doesNotThrow(() => PasswordPolicy.assertAdminPassword('SecurePass!2026'));
});
