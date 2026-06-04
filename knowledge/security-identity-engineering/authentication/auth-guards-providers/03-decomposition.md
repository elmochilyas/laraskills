# Decomposition: auth guards providers

## Topic Overview

Laravel's authentication system is a factory-managed, contract-driven architecture built on two abstractions: Guards (how authentication state is maintained per request) and Providers (how users are retrieved from storage). The `AuthManager` resolves Guard instances by name; each Guard delegates to a named Provider to fetch user records. This decoupling allows mixing session-based auth for web routes with token-based auth for APIs, custom providers for LDAP/legacy databases, and custom guards...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
auth-guards-providers/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### auth guards providers
- **Purpose:** Laravel's authentication system is a factory-managed, contract-driven architecture built on two abstractions: Guards (how authentication state is maintained per request) and Providers (how users are retrieved from storage). The `AuthManager` resolves Guard instances by name; each Guard delegates to a named Provider to fetch user records. This decoupling allows mixing session-based auth for web routes with token-based auth for APIs, custom providers for LDAP/legacy databases, and custom guards...
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: Eloquent ORM basics, service providers, middleware pipeline, config files, Related: Sanctum SPA vs Token auth (dual resolution path), Passport OAuth2 guard (stateless token guard), Fortify action pipeline (uses guards internally), Advanced Follow-up: Custom Guard implementation, Multi-guard architecture patterns, Octane auth state management, and Guard event listener patterns

## Dependency Graph
**Depends on:** Prerequisites: Eloquent ORM basics, service providers, middleware pipeline, config files, Related: Sanctum SPA vs Token auth (dual resolution path), Passport OAuth2 guard (stateless token guard), Fortify action pipeline (uses guards internally), Advanced Follow-up: Custom Guard implementation, Multi-guard architecture patterns, Octane auth state management, and Guard event listener patterns
**Depended on by:** Knowledge units that leverage or extend auth guards providers patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for auth guards providers.
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