# Decomposition: package service provider patterns

## Topic Overview

Service providers are the central bootstrapping mechanism for Laravel packages. Every package registers bindings, event listeners, middleware, routes, commands, and configurations through a service provider class. The core pattern separates concerns into two phases: `register()` (binding classes into the container, never using the container resolved instances) and `boot()` (registering views, routes, migrations, and event listeners after all providers are registered). Understanding the provid...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
package-service-provider-patterns/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### package service provider patterns
- **Purpose:** Service providers are the central bootstrapping mechanism for Laravel packages. Every package registers bindings, event listeners, middleware, routes, commands, and configurations through a service provider class. The core pattern separates concerns into two phases: `register()` (binding classes into the container, never using the container resolved instances) and `boot()` (registering views, routes, migrations, and event listeners after all providers are registered). Understanding the provid...
- **Difficulty:** Foundation
- **Dependencies:** spatie-laravel-package-tools, service-provider-registration-boot, and package-auto-discovery

## Dependency Graph
**Depends on:** spatie-laravel-package-tools, service-provider-registration-boot, and package-auto-discovery
**Depended on by:** Knowledge units that leverage or extend package service provider patterns patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for package service provider patterns.
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