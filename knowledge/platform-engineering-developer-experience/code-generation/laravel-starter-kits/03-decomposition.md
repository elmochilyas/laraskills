# Decomposition: laravel starter kits

## Topic Overview

Laravel Starter Kits are official application scaffolding packages that provide pre-built authentication, profile management, and team management for new Laravel applications. The two primary starter kits are Laravel Breeze (minimal authentication scaffolding) and Laravel Jetstream (advanced authentication with teams, two-factor auth, and API tokens). Both kits are installable via Composer and offer multiple frontend stacks: Blade with Alpine.js, Livewire with Volt, and Inertia with React or ...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
laravel-starter-kits/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### laravel starter kits
- **Purpose:** Laravel Starter Kits are official application scaffolding packages that provide pre-built authentication, profile management, and team management for new Laravel applications. The two primary starter kits are Laravel Breeze (minimal authentication scaffolding) and Laravel Jetstream (advanced authentication with teams, two-factor auth, and API tokens). Both kits are installable via Composer and offer multiple frontend stacks: Blade with Alpine.js, Livewire with Volt, and Inertia with React or ...
- **Difficulty:** Foundation
- **Dependencies:** laravel-breeze, laravel-jetstream, and laravel-installer

## Dependency Graph
**Depends on:** laravel-breeze, laravel-jetstream, and laravel-installer
**Depended on by:** Knowledge units that leverage or extend laravel starter kits patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for laravel starter kits.
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