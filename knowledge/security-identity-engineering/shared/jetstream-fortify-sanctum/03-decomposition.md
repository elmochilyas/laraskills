# Decomposition: jetstream fortify sanctum

## Topic Overview

Laravel Jetstream was a feature-rich application starter kit built on Fortify (backend) and Sanctum (API/SPA auth), adding teams management, profile management, API token management, and Livewire/Inertia frontend stacks. Jetstream has been superseded by stack-specific Laravel Starter Kits (Laravel 12/13), which provide the same canonical stack (Fortify + Sanctum + Passkeys) without the teams or API token management overhead. Jetstream is now a legacy reference for understanding how Fortify + ...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
jetstream-fortify-sanctum/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### jetstream fortify sanctum
- **Purpose:** Laravel Jetstream was a feature-rich application starter kit built on Fortify (backend) and Sanctum (API/SPA auth), adding teams management, profile management, API token management, and Livewire/Inertia frontend stacks. Jetstream has been superseded by stack-specific Laravel Starter Kits (Laravel 12/13), which provide the same canonical stack (Fortify + Sanctum + Passkeys) without the teams or API token management overhead. Jetstream is now a legacy reference for understanding how Fortify + ...
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: Fortify headless auth backend, Sanctum SPA vs Token auth, Related: Laravel Breeze auth scaffolding, Laravel Starter Kits (current), Advanced Follow-up: Jetstream teams migration to custom teams, and API token UI implementation with Sanctum

## Dependency Graph
**Depends on:** Prerequisites: Fortify headless auth backend, Sanctum SPA vs Token auth, Related: Laravel Breeze auth scaffolding, Laravel Starter Kits (current), Advanced Follow-up: Jetstream teams migration to custom teams, and API token UI implementation with Sanctum
**Depended on by:** Knowledge units that leverage or extend jetstream fortify sanctum patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for jetstream fortify sanctum.
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