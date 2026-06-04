# Decomposition: passport vs sanctum

## Topic Overview

The Passport vs Sanctum decision is binary: use Sanctum unless you need to be an OAuth2 provider. Sanctum covers 80%+ of authentication use cases (first-party SPAs, mobile apps, simple API tokens) with minimal complexity. Passport is required only when third-party clients need to authorize via your app — your app becomes an OAuth2 authorization server. The two packages are not interchangeable; they solve fundamentally different problems. Using Passport "because it's more enterprise" is a co...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
passport-vs-sanctum/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### passport vs sanctum
- **Purpose:** The Passport vs Sanctum decision is binary: use Sanctum unless you need to be an OAuth2 provider. Sanctum covers 80%+ of authentication use cases (first-party SPAs, mobile apps, simple API tokens) with minimal complexity. Passport is required only when third-party clients need to authorize via your app — your app becomes an OAuth2 authorization server. The two packages are not interchangeable; they solve fundamentally different problems. Using Passport "because it's more enterprise" is a co...
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: Sanctum SPA vs Token auth, Passport OAuth2 server (grants, scopes, keys), Related: Auth guards/providers architecture (multi-guard setup), API authentication patterns, Advanced Follow-up: Hybrid Sanctum + Passport architecture patterns, and Migration strategies from Sanctum to Passport

## Dependency Graph
**Depends on:** Prerequisites: Sanctum SPA vs Token auth, Passport OAuth2 server (grants, scopes, keys), Related: Auth guards/providers architecture (multi-guard setup), API authentication patterns, Advanced Follow-up: Hybrid Sanctum + Passport architecture patterns, and Migration strategies from Sanctum to Passport
**Depended on by:** Knowledge units that leverage or extend passport vs sanctum patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for passport vs sanctum.
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