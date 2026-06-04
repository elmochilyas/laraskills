# Decomposition: Application Class

## Topic Overview
The Application class (Illuminate\Foundation\Application) is the central service container, path resolver, environment manager, and bootstrap coordinator for the entire Laravel framework. It extends the Container and serves as both the DI container and application lifecycle manager.

## Decomposition Strategy
This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
`
application-class/
  +-- 02-knowledge-unit.md
  +-- 03-decomposition.md
`

## Knowledge Unit Inventory

### Application Class
- **Purpose:** The Application class as container, path resolver, environment manager, and bootstrap coordinator.
- **Difficulty:** Advanced
- **Dependencies:** Service Container Basics

## Dependency Graph
This KU depends on: Service Container Basics. It serves as prerequisite for Bootstrapping Lifecycle, Kernel Architecture, Directory Conventions, and Service Provider Strategies.

## Boundary Analysis
**In scope:** Application as container, path resolver, environment manager; Laravel 11+ bootstrap/app.php customization; class extension; construction, boot, and termination phases; singleton and alias registries.
**Out of scope:** Service provider internals; kernel middleware pipeline details; bootstrapping step implementation details; configuration loading mechanics.

## Future Expansion Opportunities
None identified � the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization