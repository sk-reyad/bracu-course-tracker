---
name: security-review
description: "Use for security-sensitive changes or reviews involving Auth, profiles, roles/permissions, RLS/grants, admin/support functions, MFA, Turnstile, secrets, storage privacy, CORS/CSP, middleware or privileged data. Not for unrelated visual or editorial edits without trust-boundary impact."
---

# security-review

## Workflow

1. Read [Security](../../../docs/SECURITY.md), affected [Data model](../../../docs/DATA_MODEL.md) contracts and applicable nested AGENTS.md.
2. State reviewed scope, attacker-controlled inputs, identity classes and assets. Trace authentication separately from authorization.
3. Inspect current server permission/account/AAL checks and target restrictions before service operations. JWT decoding alone is not verification.
4. Inspect direct table/RPC alternatives, PUBLIC/anon/authenticated grants, RLS, ownership and definer search_path. Check all later migrations.
5. Review secret placement, sensitive logs, personal data, object paths, escaping, CORS/Origin, rate-limit scope, error leakage and headers where relevant.
6. Preserve intentional public support branches and owner AAL1 paths while protecting admin actions; do not apply a blanket gate without understanding consumers.
7. Run affected negative-path tests from [Testing](../../../docs/TESTING.md). Report local/mock coverage separately from hosted verification.
8. Review documentation triggers; record verified unresolved issues without converting speculation into a confirmed vulnerability.

## Final report

Report scope, findings with evidence and severity, tests performed, residual risk and unverified items. Never claim global security. Do not deploy, probe unrelated users, disable RLS or request/expose secrets as part of review.

## Final checks

- Invalid token, AAL1, inactive, missing permission and wrong owner considered?
- Public vs protected branches and direct API routes distinguished?
- Privileged client construction/use and failure ordering traced?
- Security statements match implemented scope rather than UI intent?
