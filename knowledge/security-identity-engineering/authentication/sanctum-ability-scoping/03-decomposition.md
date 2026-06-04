# Decomposition: sanctum ability scoping

## Topic Overview

Sanctum token abilities are lightweight permission strings assigned at token creation time. They function like OAuth scopes but are simpler — strings like `"posts:read"`, `"posts:create"` checked via `$user->tokenCan($ability)`. Abilities are stored as JSON on the `personal_access_tokens.abilities` column and checked against the token, not the user's role/permission system. This means a user with a "read-only" token cannot perform write operations even if the user has full permissions. Abil...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
sanctum-ability-scoping/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### sanctum ability scoping
- **Purpose:** Sanctum token abilities are lightweight permission strings assigned at token creation time. They function like OAuth scopes but are simpler — strings like `"posts:read"`, `"posts:create"` checked via `$user->tokenCan($ability)`. Abilities are stored as JSON on the `personal_access_tokens.abilities` column and checked against the token, not the user's role/permission system. This means a user with a "read-only" token cannot perform write operations even if the user has full permissions. Abil...
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: Sanctum SPA vs Token auth, Token creation and management, Related: Gates and Policies authorization, Route middleware, Advanced Follow-up: Custom ability resolution with hierarchical scopes, and Ability-based rate limiting per token

## Dependency Graph
**Depends on:** Prerequisites: Sanctum SPA vs Token auth, Token creation and management, Related: Gates and Policies authorization, Route middleware, Advanced Follow-up: Custom ability resolution with hierarchical scopes, and Ability-based rate limiting per token
**Depended on by:** Knowledge units that leverage or extend sanctum ability scoping patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for sanctum ability scoping.
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