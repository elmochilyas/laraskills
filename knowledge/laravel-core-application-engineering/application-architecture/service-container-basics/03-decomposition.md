# Decomposition: Service Container Basics

## Topic Overview
The service container (Illuminate\Container\Container) is the dependency injection container powering the framework's object resolution via automatic constructor injection, explicit binding, singleton management, and contextual binding.

## Decomposition Strategy
This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
`
service-container-basics/
  +-- 02-knowledge-unit.md
  +-- 03-decomposition.md
`

## Knowledge Unit Inventory

### Service Container Basics
- **Purpose:** Binding, resolution, singletons, contextual binding, auto-resolution via reflection, and method injection.
- **Difficulty:** Foundation
- **Dependencies:** Application Class

## Dependency Graph
This KU depends on: Application Class. It serves as prerequisite for Facade System, Helper Functions, Service Provider Strategies, and most other KUs.

## Boundary Analysis
**In scope:** bind/singleton/instance/scoped; make/build/call resolution; reflection-based auto-resolution; contextual binding (when()->needs()->give()); tagged bindings; circular dependency detection.
**Out of scope:** Service provider strategies; facade system; helper functions implementation.

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