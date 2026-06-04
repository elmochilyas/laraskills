# Anti-Patterns: Environment & Secret Management

## AP-ENV-001: The Committed .env
**Description:** `.env` file accidentally committed to version control.
**Consequences:** Production credentials exposed to all repository users. Automated scanners may find and exploit these.
**Remediation:** Add `.env` to `.gitignore` immediately. Use `git filter-branch` to remove from history if committed.

## AP-ENV-002: .env as Documentation
**Description:** Using comments in `.env` to document what each variable does instead of `.env.example`.
**Consequences:** `.env` content visible to everyone during development. Comments may leak implementation details.
**Remediation:** Document variables in `.env.example`. Keep `.env` as clean key-value pairs.

## AP-ENV-003: No Staging .env
**Description:** Sharing production `.env` with staging environment.
**Consequences:** Staging commands accidentally modify production data. Production credentials exposed in staging.
**Remediation:** Maintain separate `.env` files per environment. Use environment-specific prefixes or directories.
