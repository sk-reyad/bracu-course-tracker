---
name: release-check
description: "Use for production release readiness, deployment preparation, or completion review after broad/high-risk changes. Not for ordinary unrelated small edits or as authorization to deploy, commit or push."
---

# release-check

## Workflow

1. Read [Deployment](../../../docs/DEPLOYMENT.md), [Testing](../../../docs/TESTING.md), [Known issues](../../../docs/KNOWN_ISSUES.md) and root AGENTS.md.
2. Inspect status/diff/untracked files; distinguish existing user work. Confirm no unexpected runtime/config/data modifications.
3. Review documentation update triggers, relative links and skill routing when instruction files changed.
4. Verify migration/Edge/client compatibility and recovery; review config requirements without printing secret values.
5. Run targeted tests and the full node --test tests/*.test.js suite when feasible. Run deployment-hygiene/security tests; report unavailable checks.
6. Check local routes/syntax and relevant preview/auth/main/admin/maintenance UI. Local static service is not Vercel middleware or provider verification.
7. Identify required manual hosted checks; never run production writes or deploy unless separately instructed.
8. Classify blockers versus follow-ups with evidence. A passing mock suite does not certify live RLS or provider settings.

## Documentation-only bootstrap adaptation

Inspect docs paths, command syntax, module/test mapping, source-backed security/data claims, secrets and unintended diffs. Do not apply SQL or deploy. Read each newly authored SKILL.md and test routing with two matching and two nonmatching example requests.

## Output

- Verified: checks actually run and results.
- Not verified: environments/flows not exercised.
- Blocker: evidence preventing the requested release or completion.
- Follow-up: nonblocking limitations, with next check.

No automatic commit, push, merge, deployment or cleanup.
