# Decomposition: laravel breeze

## Topic Overview

Laravel Breeze is a minimal, lightweight implementation of Laravel's authentication features, providing a starting point for new Laravel applications with authentication scaffolding. It includes login, registration, password reset, email verification, and password confirmation views and controllers. Breeze offers multiple stack options: Blade with Alpine.js (default), Livewire (with Volt or classic), React with Inertia, and Vue with Inertia. All stacks use Tailwind CSS for styling and Vite fo...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
laravel-breeze/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### laravel breeze
- **Purpose:** Laravel Breeze is a minimal, lightweight implementation of Laravel's authentication features, providing a starting point for new Laravel applications with authentication scaffolding. It includes login, registration, password reset, email verification, and password confirmation views and controllers. Breeze offers multiple stack options: Blade with Alpine.js (default), Livewire (with Volt or classic), React with Inertia, and Vue with Inertia. All stacks use Tailwind CSS for styling and Vite fo...
- **Difficulty:** Foundation
- **Dependencies:** laravel-jetstream, laravel-starter-kits, and stub-customization-laravel

## Dependency Graph
**Depends on:** laravel-jetstream, laravel-starter-kits, and stub-customization-laravel
**Depended on by:** Knowledge units that leverage or extend laravel breeze patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for laravel breeze.
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