# Decomposition: spatie laravel package tools

## Topic Overview

Spatie Laravel Package Tools (`spatie/laravel-package-tools`) is the de facto standard for building Laravel packages. It provides a `PackageServiceProvider` base class that abstracts the repetitive boilerplate of package configuration—registering migrations, views, translations, Blade components, commands, and assets—into a concise, declarative DSL. Instead of manually calling `$this->loadMigrationsFrom()`, `$this->publishes()`, `$this->loadViewsFrom()`, etc., developers define the packag...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
spatie-laravel-package-tools/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### spatie laravel package tools
- **Purpose:** Spatie Laravel Package Tools (`spatie/laravel-package-tools`) is the de facto standard for building Laravel packages. It provides a `PackageServiceProvider` base class that abstracts the repetitive boilerplate of package configuration—registering migrations, views, translations, Blade components, commands, and assets—into a concise, declarative DSL. Instead of manually calling `$this->loadMigrationsFrom()`, `$this->publishes()`, `$this->loadViewsFrom()`, etc., developers define the packag...
- **Difficulty:** Foundation
- **Dependencies:** package-service-provider-patterns, package-skeleton-structure, and package-auto-discovery

## Dependency Graph
**Depends on:** package-service-provider-patterns, package-skeleton-structure, and package-auto-discovery
**Depended on by:** Knowledge units that leverage or extend spatie laravel package tools patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for spatie laravel package tools.
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