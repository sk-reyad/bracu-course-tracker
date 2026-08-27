const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const styles = fs.readFileSync(path.join(__dirname, "..", "css", "style.css"), "utf8");
const footer = html.slice(html.indexOf('<footer class="site-footer">'), html.indexOf("</footer>") + 9);

test("footer presents the approved compact brand copy", () => {
  assert.match(footer, />BRACU Course Tracker</);
  assert.match(footer, />Plan smarter &amp; track every semester</);
  assert.match(footer, />v0\.9\.0-beta\.1</);
  assert.doesNotMatch(footer, /A modern academic planning companion/);
  assert.doesNotMatch(footer, /BSc in Computer Science/);
  assert.doesNotMatch(footer, /Your progress stays under your control/);
});

test("footer exposes all approved contact destinations with icons", () => {
  assert.match(footer, /<h3>Contact Me<\/h3>/);

  const contacts = [
    ["footerEmailLink", "mailto:skreyad2016@gmail.com", "mail"],
    ["footerPortfolioLink", "https://sk-reyad.github.io/Portfolio-Website_1-Reyad/", "briefcase-business"]
  ];

  for (const [id, href, icon] of contacts) {
    assert.match(footer, new RegExp(`<a[^>]+id="${id}"[^>]+href="${href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>`));
    assert.match(footer, new RegExp(`id="${id}"[\\s\\S]*?data-lucide="${icon}"`));
  }

  const brandContacts = [
    ["footerLinkedinLink", "https://www.linkedin.com/in/sk-reyad/", "footer-linkedin-icon"],
    ["footerGithubLink", "https://github.com/sk-reyad", "footer-github-icon"],
    ["footerBehanceLink", "https://www.behance.net/skreyad1", "footer-behance-icon"]
  ];

  for (const [id, href, iconClass] of brandContacts) {
    assert.match(footer, new RegExp(`id="${id}"[^>]+href="${href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
    assert.match(footer, new RegExp(`id="${id}"[\\s\\S]*?<svg[^>]+class="${iconClass}"`));
  }
});

test("footer credits link to the approved portfolio and BRAC University", () => {
  assert.match(footer, /id="footerDeveloper"[^>]+href="https:\/\/sk-reyad\.github\.io\/Portfolio-Website_1-Reyad\/"/);
  assert.match(footer, /<a(?=[^>]*href="https:\/\/www\.bracu\.ac\.bd\/")[^>]*>\s*BRAC University\s*<\/a\s*>/);
  assert.doesNotMatch(footer, />Project</);
  assert.match(html, /id="openSettingsBtn"/);
});

test("footer external destinations open safely in a new tab", () => {
  const externalLinkIds = [
    "footerPortfolioLink",
    "footerLinkedinLink",
    "footerGithubLink",
    "footerBehanceLink",
    "footerDeveloper"
  ];

  for (const id of externalLinkIds) {
    const openingTag = footer.match(new RegExp(`<a[^>]+id="${id}"[^>]*>`))?.[0] || "";
    assert.match(openingTag, /target="_blank"/);
    assert.match(openingTag, /rel="noopener noreferrer"/);
  }

  assert.match(footer, /href="https:\/\/www\.bracu\.ac\.bd\/"[^>]+target="_blank"[^>]+rel="noopener noreferrer"/);
});

test("footer uses horizontal responsive link groups without the decorative watermark", () => {
  assert.doesNotMatch(styles, /\.footer-shell::before/);
  assert.match(styles, /\.footer-brand-block\s*{[^}]*grid-row:\s*1 \/ span 2/s);
  assert.match(styles, /\.footer-link-group\s*{[^}]*display:\s*flex;[^}]*flex-wrap:\s*wrap/s);
  assert.match(styles, /@media \(max-width: 640px\)[\s\S]*?\.footer-link-group\s*{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(styles, /@media \(max-width: 380px\)[\s\S]*?\.footer-link-group\s*{[^}]*grid-template-columns:\s*1fr/);
});

test("footer credit links never use underlines", () => {
  const creditLinkRule = styles.match(/\.footer-bottom a\s*{([^}]*)}/s)?.[1] || "";
  const creditHoverRule = styles.match(/\.footer-bottom a:hover\s*{([^}]*)}/s)?.[1] || "";

  assert.match(creditLinkRule, /text-decoration:\s*none/);
  assert.doesNotMatch(creditLinkRule, /text-decoration:\s*underline/);
  assert.doesNotMatch(creditHoverRule, /text-decoration/);
});

test("footer bottom reserves space for the fixed back-to-top button", () => {
  const footerBottomRule = styles.match(/\.footer-bottom\s*{([^}]*)}/s)?.[1] || "";
  const mobileFooterRules = styles.match(/@media \(max-width: 640px\)([\s\S]*?)@media \(max-width: 380px\)/)?.[1] || "";
  const mobileFooterBottomRule = mobileFooterRules.match(/\.footer-bottom\s*{([^}]*)}/s)?.[1] || "";

  assert.match(footerBottomRule, /padding:\s*14px 88px 14px 34px/);
  assert.match(mobileFooterBottomRule, /padding:\s*16px 72px 16px 20px/);
});
