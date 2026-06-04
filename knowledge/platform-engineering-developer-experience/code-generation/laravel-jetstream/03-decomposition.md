# Decomposition: laravel jetstream

## Topic Overview

Laravel Jetstream is a feature-rich application starter kit that provides complete authentication scaffolding with advanced features: login, registration, email verification, two-factor authentication, session management, API token management (via Sanctum), and team management with customizable roles and permissions. Jetstream builds on Laravel Breeze's authentication foundation and adds enterprise-ready features. It uses Tailwind CSS for styling and offers two frontend stacks: Livewire (with...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
laravel-jetstream/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### laravel jetstream
- **Purpose:** Laravel Jetstream is a feature-rich application starter kit that provides complete authentication scaffolding with advanced features: login, registration, email verification, two-factor authentication, session management, API token management (via Sanctum), and team management with customizable roles and permissions. Jetstream builds on Laravel Breeze's authentication foundation and adds enterprise-ready features. It uses Tailwind CSS for styling and offers two frontend stacks: Livewire (with...
- **Difficulty:** Foundation
- **Dependencies:** laravel-breeze, laravel-starter-kits, and laravel-installer

## Dependency Graph
**Depends on:** laravel-breeze, laravel-starter-kits, and laravel-installer
**Depended on by:** Knowledge units that leverage or extend laravel jetstream patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for laravel jetstream.
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