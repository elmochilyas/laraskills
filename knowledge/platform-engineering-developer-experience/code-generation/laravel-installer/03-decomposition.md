# Decomposition: laravel installer

## Topic Overview

The Laravel Installer is a standalone CLI tool that creates new Laravel applications via `laravel new project-name`. It provides a guided, interactive experience for project creation: selecting starter kits (Breeze, Jetstream, or none), choosing frontend stacks (Blade, Livewire, React, Vue), picking testing frameworks (Pest, PHPUnit), configuring database options, initializing Git repos, and running initial commands. The installer creates the project using Composer's `create-project` command ...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
laravel-installer/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### laravel installer
- **Purpose:** The Laravel Installer is a standalone CLI tool that creates new Laravel applications via `laravel new project-name`. It provides a guided, interactive experience for project creation: selecting starter kits (Breeze, Jetstream, or none), choosing frontend stacks (Blade, Livewire, React, Vue), picking testing frameworks (Pest, PHPUnit), configuring database options, initializing Git repos, and running initial commands. The installer creates the project using Composer's `create-project` command ...
- **Difficulty:** Foundation
- **Dependencies:** laravel-breeze, laravel-jetstream, and laravel-starter-kits

## Dependency Graph
**Depends on:** laravel-breeze, laravel-jetstream, and laravel-starter-kits
**Depended on by:** Knowledge units that leverage or extend laravel installer patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for laravel installer.
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