# Tests subtree

Read [Testing](../docs/TESTING.md) for exact commands and ownership.

- Use node:test and node:assert/strict conventions. Most tests are CommonJS; ESM helpers use dynamic imports and browser globals use VM/factory harnesses.
- Test intended behavior with focused deterministic synthetic fixtures. Static assertions are appropriate when intentionally guarding markup, grants, SQL or deployment structure.
- Do not weaken assertions to make unrelated failures pass. Explain intentional semantic updates alongside implementation.
- Preserve negative auth/permission/MFA/cross-user checks and deployment hygiene tests.
- Never require real production credentials or personal student records.
- Run targeted files first, then node --test tests/*.test.js for broad/high-risk changes.
- degree-plan-browser.cjs is separate Playwright coverage; its dependency/browser/server prerequisites are not provided by the wildcard Node suite.
- Record introduced vs pre-existing vs environmental failures. No test edits merely to make a docs-only task green.
- Update TESTING when coverage ownership, commands or fixture expectations change.
