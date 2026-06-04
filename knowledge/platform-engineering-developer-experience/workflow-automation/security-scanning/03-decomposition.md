# Decomposition: security scanning

## Topic Overview

Security scanning in CI refers to automated processes that detect security vulnerabilities in a Laravel application's dependencies, code, and configuration. For Laravel teams, security scanning covers: dependency vulnerability scanning (Composer audit, Dependabot, GitHub Advisory Database), static application security testing (SAST tools that detect SQL injection, XSS, CSRF weaknesses in Laravel code), secret detection (preventing accidental commits of API keys, database passwords, and tokens...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
security-scanning/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### security scanning
- **Purpose:** Security scanning in CI refers to automated processes that detect security vulnerabilities in a Laravel application's dependencies, code, and configuration. For Laravel teams, security scanning covers: dependency vulnerability scanning (Composer audit, Dependabot, GitHub Advisory Database), static application security testing (SAST tools that detect SQL injection, XSS, CSRF weaknesses in Laravel code), secret detection (preventing accidental commits of API keys, database passwords, and tokens...
- **Difficulty:** Foundation
- **Dependencies:** dependency-update-automation, github-actions-for-laravel, and automated-testing-in-ci

## Dependency Graph
**Depends on:** dependency-update-automation, github-actions-for-laravel, and automated-testing-in-ci
**Depended on by:** Knowledge units that leverage or extend security scanning patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for security scanning.
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