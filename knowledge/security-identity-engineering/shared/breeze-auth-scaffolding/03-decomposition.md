# Decomposition: breeze auth scaffolding

## Topic Overview

Laravel Breeze was the minimal authentication scaffolding package (pre-Laravel 12) providing published controllers, views (Blade or Livewire), and routes for login, registration, password reset, and email verification. It published code to the application, giving full ownership and debuggability — at the cost of manual upgrades for security patches. Breeze is now LEGACY (deprecated in favor of stack-specific Starter Kits starting Laravel 12/13). Knowledge of Breeze is relevant only for main...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
breeze-auth-scaffolding/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### breeze auth scaffolding
- **Purpose:** Laravel Breeze was the minimal authentication scaffolding package (pre-Laravel 12) providing published controllers, views (Blade or Livewire), and routes for login, registration, password reset, and email verification. It published code to the application, giving full ownership and debuggability — at the cost of manual upgrades for security patches. Breeze is now LEGACY (deprecated in favor of stack-specific Starter Kits starting Laravel 12/13). Knowledge of Breeze is relevant only for main...
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: Fortify headless auth backend, Auth guards/providers architecture, Related: Laravel Jetstream (Fortify + Sanctum), Laravel Starter Kits (current), Advanced Follow-up: Legacy Breeze project migration to Fortify, and Breeze to Starter Kit migration guide

## Dependency Graph
**Depends on:** Prerequisites: Fortify headless auth backend, Auth guards/providers architecture, Related: Laravel Jetstream (Fortify + Sanctum), Laravel Starter Kits (current), Advanced Follow-up: Legacy Breeze project migration to Fortify, and Breeze to Starter Kit migration guide
**Depended on by:** Knowledge units that leverage or extend breeze auth scaffolding patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for breeze auth scaffolding.
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