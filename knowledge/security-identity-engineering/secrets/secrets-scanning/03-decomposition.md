# Decomposition: secrets scanning

## Topic Overview

Secrets scanning tools detect hardcoded credentials, API keys, tokens, and private keys in source code before they reach production. Laravel-specific tools like `Laravel-Shield` scan for weak APP_KEY, exposed `.env` files, hardcoded database passwords, and configuration leaks. General-purpose tools (GitHub Secret Scanning, `trufflehog`, `ggshield`, `detect-secrets`) scan all file types. The primary defense is pre-commit hooks and CI pipeline scanning — catch secrets before they enter the re...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
secrets-scanning/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### secrets scanning
- **Purpose:** Secrets scanning tools detect hardcoded credentials, API keys, tokens, and private keys in source code before they reach production. Laravel-specific tools like `Laravel-Shield` scan for weak APP_KEY, exposed `.env` files, hardcoded database passwords, and configuration leaks. General-purpose tools (GitHub Secret Scanning, `trufflehog`, `ggshield`, `detect-secrets`) scan all file types. The primary defense is pre-commit hooks and CI pipeline scanning — catch secrets before they enter the re...
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: .env management and APP_KEY, Dependency security (composer audit), Related: Server header removal and hardening, Enlightn static/dynamic security analysis, Advanced Follow-up: CI/CD secret scanning pipeline setup, Historical secret removal with BFG Repo-Cleaner, and Machine learning-based secret detection

## Dependency Graph
**Depends on:** Prerequisites: .env management and APP_KEY, Dependency security (composer audit), Related: Server header removal and hardening, Enlightn static/dynamic security analysis, Advanced Follow-up: CI/CD secret scanning pipeline setup, Historical secret removal with BFG Repo-Cleaner, and Machine learning-based secret detection
**Depended on by:** Knowledge units that leverage or extend secrets scanning patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for secrets scanning.
**Out of scope:** Adjacent topics covered in their own knowledge units; advanced or specialized use cases that extend beyond the core scope.

## Future Expansion Opportunities
None identified — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization