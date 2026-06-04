# Decomposition: auth testing

## Topic Overview

Authentication testing verifies login, registration, password reset, and session management flows. Authorization testing verifies that authenticated users can/cannot access specific resources based on roles, permissions, or ownership. Laravel provides `actingAs()` for authenticating users in tests, `assertAuthenticated()`/`assertGuest()` for session state assertions, and Gate/Policy integration with HTTP tests. Authorization testing is security-critical—gaps here mean unauthorized data acce...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
auth-testing/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### auth testing
- **Purpose:** Authentication testing verifies login, registration, password reset, and session management flows. Authorization testing verifies that authenticated users can/cannot access specific resources based on roles, permissions, or ownership. Laravel provides `actingAs()` for authenticating users in tests, `assertAuthenticated()`/`assertGuest()` for session state assertions, and Gate/Policy integration with HTTP tests. Authorization testing is security-critical—gaps here mean unauthorized data acce...
- **Difficulty:** Foundation
- **Dependencies:** **Prerequisites**: HTTP test helpers, Laravel authentication system (guards, providers, sessions), **Related Topics**: JSON API testing, Validation testing, Middleware testing, Gate/Policy definition, **Advanced Follow-up**: Multi-tenant authorization testing, OAuth/Socialite testing, and JWT/API token testing

## Dependency Graph
**Depends on:** **Prerequisites**: HTTP test helpers, Laravel authentication system (guards, providers, sessions), **Related Topics**: JSON API testing, Validation testing, Middleware testing, Gate/Policy definition, **Advanced Follow-up**: Multi-tenant authorization testing, OAuth/Socialite testing, and JWT/API token testing
**Depended on by:** Knowledge units that leverage or extend auth testing patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for auth testing.
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