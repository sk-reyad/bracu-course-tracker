const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('privacy and terms are public, theme-matched documents with clear ownership', () => {
  const privacy = read('privacy.html');
  const terms = read('terms.html');
  const styles = read(path.join('css', 'legal.css'));

  for (const html of [privacy, terms]) {
    assert.match(html, /BRACU Course Tracker/);
    assert.match(html, /Effective date:\s*25 August 2026/);
    assert.match(html, /skreyad2016@gmail\.com/);
    assert.match(html, /css\/legal\.css/);
    assert.match(html, /id="dotGridBackground"/);
    assert.match(html, /js\/motion\.js/);
    assert.match(html, /id="maintenanceThemeToggle"/);
    assert.doesNotMatch(html, /js\/maintenance-guard\.js/);
  }

  assert.match(styles, /\[data-theme="dark"\]/);
  assert.match(styles, /@media \(max-width:/);
  assert.match(styles, /prefers-reduced-motion/);
});

test('privacy policy describes only the data flows implemented by the service', () => {
  const privacy = read('privacy.html');
  for (const disclosure of [
    'Google', 'Supabase', 'Cloudflare Turnstile', 'Web3Forms', 'Vercel',
    'profile photo', 'academic planning data', 'support', 'localStorage',
    'access to, correction of, or deletion of'
  ]) assert.match(privacy, new RegExp(disclosure, 'i'));

  assert.match(privacy, /do not sell/i);
  assert.doesNotMatch(privacy, /GDPR compliant|100% secure|guaranteed security/i);
});

test('terms state the academic, affiliation, and acceptable-use boundaries', () => {
  const terms = read('terms.html');
  assert.match(terms, /official BRAC University record/i);
  assert.match(terms, /not affiliated with, endorsed by, or\s+operated by BRAC University/i);
  assert.match(terms, /official BRAC University G-Suite email/);
  assert.match(terms, /acceptable use/i);
  assert.match(terms, /suspend or restrict/i);
  assert.doesNotMatch(terms, /binding arbitration|indemnif|governed by the laws of/i);
});

test('legal links are visible at account entry, support, maintenance, and footer surfaces', () => {
  const index = read('index.html');
  const auth = read('auth.html');
  const maintenance = read('maintenance.html');
  const support = read(path.join('js', 'support-widget.js'));

  for (const source of [index, auth, maintenance]) {
    assert.match(source, /href="privacy\.html"/);
    assert.match(source, /href="terms\.html"/);
  }
  assert.match(auth, /agree to the\s+<a href="terms\.html">Terms of Use<\/a> and acknowledge the\s+<a href="privacy\.html">Privacy Policy<\/a>/);
  assert.match(support, /href="privacy\.html"/);
});

test('legal documents remain reachable while maintenance mode is active', () => {
  const middleware = read('middleware.ts');
  const supportCore = require('../js/support-core.js');
  assert.match(middleware, /privacy\.html/);
  assert.match(middleware, /terms\.html/);
  assert.equal(supportCore.maintenanceDestination({ enabled: true, pathname: '/privacy.html' }), null);
  assert.equal(supportCore.maintenanceDestination({ enabled: true, pathname: '/terms.html' }), null);
});

test('password recovery guidance belongs to recovery and not MFA', () => {
  const auth = read('auth.html');
  const mfa = auth.slice(auth.indexOf('id="adminMfaView"'), auth.indexOf('id="adminRecoveryView"'));
  const recoveryStart = auth.indexOf('id="adminRecoveryView"');
  const recovery = auth.slice(recoveryStart, auth.indexOf('</section>', recoveryStart));
  assert.doesNotMatch(mfa, /recoveryPasswordHint/);
  assert.match(recovery, /recoveryPasswordHint/);
});
