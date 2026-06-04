# Decomposition: enlightn analysis

## Topic Overview

Enlightn is a comprehensive static and dynamic security analysis tool for Laravel applications. It checks 100+ categories covering: configuration security (debug mode, APP_KEY strength), dependency vulnerabilities (composer audit integration), mass assignment protection, CSRF coverage, session configuration, CORS setup, rate limiting, and more. Checks run as static analysis (no app execution), dynamic analysis (hitting running app), or a hybrid. Enlightn integrates into CI pipelines and provi...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
enlightn-analysis/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### enlightn analysis
- **Purpose:** Enlightn is a comprehensive static and dynamic security analysis tool for Laravel applications. It checks 100+ categories covering: configuration security (debug mode, APP_KEY strength), dependency vulnerabilities (composer audit integration), mass assignment protection, CSRF coverage, session configuration, CORS setup, rate limiting, and more. Checks run as static analysis (no app execution), dynamic analysis (hitting running app), or a hybrid. Enlightn integrates into CI pipelines and provi...
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: Application configuration, Session configuration, Security headers, Related: Laravel-Shield security scanning CLI, Dependency security (composer audit), Advanced Follow-up: Custom Enlightn checks for application-specific security rules, and Security score trending over time

## Dependency Graph
**Depends on:** Prerequisites: Application configuration, Session configuration, Security headers, Related: Laravel-Shield security scanning CLI, Dependency security (composer audit), Advanced Follow-up: Custom Enlightn checks for application-specific security rules, and Security score trending over time
**Depended on by:** Knowledge units that leverage or extend enlightn analysis patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for enlightn analysis.
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