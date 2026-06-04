# Decomposition: authorization testing

## Topic Overview

Authorization testing in Laravel verifies that Gates, Policies, and permission checks correctly allow authorized users and deny unauthorized users. Laravel provides testing helpers: `$this->actingAs($user)`, `$this->assertResponseStatus()`, and Gate/Policy unit tests. Key testing scenarios: authenticated user has access, unauthenticated user is rejected, user without permission is rejected, model-specific policies correctly scope access, and edge cases (guest access, soft-deleted resources, super-admin bypass).

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
authorization-testing/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### authorization testing
- **Purpose:** Authorization testing in Laravel verifies that Gates, Policies, and permission checks correctly allow authorized users and deny unauthorized users. Laravel provides testing helpers: `$this->actingAs($user)`, `$this->assertResponseStatus()`, and Gate/Policy unit tests. Key testing scenarios: authenticated user has access, unauthenticated user is rejected, user without permission is rejected, model-specific policies correctly scope access, and edge cases (guest access, soft-deleted resources, super-admin bypass).
- **Difficulty:** Intermediate
- **Dependencies:** Prerequisites: Gates (closure-based authorization), Policies (model-centric authorization), Middleware pipeline, Related: Spatie laravel-permission (permission testing), Super-admin bypass testing, Multi-tenancy security testing, Advanced Follow-up: Pest vs PHPUnit for authorization testing, Custom authorization assertion helpers, and CI authorization coverage gates

## Dependency Graph
**Depends on:** Prerequisites: Gates (closure-based authorization), Policies (model-centric authorization), Middleware pipeline, Related: Spatie laravel-permission (permission testing), Super-admin bypass testing, Multi-tenancy security testing, Advanced Follow-up: Pest vs PHPUnit for authorization testing, Custom authorization assertion helpers, and CI authorization coverage gates
**Depended on by:** Knowledge units that leverage or extend authorization testing patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for authorization testing.
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
