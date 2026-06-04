# ECC Standardized Knowledge — Directory Organization Strategies

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | Directory Organization Strategies |
| Difficulty | Foundation |
| Category | Architecture |
| Last Updated | 2026-06-02 |

## Overview

Directory organization strategies define how CRUD architecture layers (controllers, DTOs, actions, services, repositories) are organized into directories and namespaces. The two dominant strategies are layer-first (group by layer type) and domain-first (group by business domain). Mixed strategies combine both. The choice determines how developers navigate the codebase, how features are scoped, and how the architecture evolves. Directory structure IS architecture — it communicates how the team thinks about the codebase.

## Core Concepts

- **Layer-First (Technical) Organization**: `app/Controllers/`, `app/Services/`, `app/Models/`. Easy to find files by type, consistent with Laravel's default, works for small-medium codebases. Cons: unrelated code co-located, no domain boundary enforcement.
- **Domain-First (Feature) Organization**: `app/Users/`, `app/Orders/`, `app/Products/` with subdirectories per layer. Domain boundaries explicit, related files co-located, scales well. Cons: requires custom autoloading, not Laravel default.
- **Mixed (Hybrid) Organization**: Domain-first for core domains, layer-first for shared infrastructure. Common compromise for growing applications.
- **PSR-4 Autoloading Impact**: Directory structure directly determines namespace hierarchy. Moving files requires updating namespaces and autoloading configuration in `composer.json`.

## When To Use

- Layer-first for applications with <50 models and teams of 1-5 developers
- Domain-first for applications with 20+ domains and teams of 5+ developers
- Domain-first when team ownership boundaries need filesystem enforcement
- Mixed when some domains are tightly coupled and others are isolated

## When NOT To Use

- Premature domain-first for small applications with mostly-empty domain directories
- Mixing strategies inconsistently — primary strategy must be applied uniformly
- Domain-first when domains are tightly coupled (cross-domain imports everywhere)
- Any strategy that doesn't match the team's mental model of the codebase

## Best Practices

- Choose one primary strategy and apply it consistently — use subdirectories within that strategy for grouping
- Ensure namespace matches directory — `app/Domain/Users/Controllers/UserController.php` has namespace `App\Domain\Users\Controllers`
- Configure PSR-4 autoloading in `composer.json` for domain-first structures
- Run `composer dump-autoload` after adding new domain directories
- Start layer-first by default; adopt domain-first when justified by size and team count

## Architecture Guidelines

- Laravel's default structure is layer-first — use it for most applications <50 models
- Domain-first requires PSR-4 prefix mapping: `"App\\Users\\": "app/Domain/Users/"`
- Migrate from layer-first to domain-first one domain at a time, never in a single commit
- Use a `Shared/` directory for cross-cutting types in domain-first structures
- Domains should not depend on each other — extract shared types to `Shared/`

## Performance Considerations

- Directory structure has zero performance impact — autoloading uses namespace-to-path mapping
- OpCache caches compiled files regardless of directory layout
- Domain-first with many nested directories does not affect runtime performance

## Security Considerations

- Directory structure does not affect security — access control is determined by middleware and authorization
- Domain-first structures don't provide security isolation between domains — that requires separate process boundaries
- Filesystem permissions should be uniform across the application directory

## Common Mistakes

- **Mixing Strategies Inconsistently**: Layer-first for some features, domain-first for others. Solution: Choose one primary strategy and apply it consistently.
- **Premature Domain-First**: Adopting domain-first for a 10-model application. Solution: Start layer-first. Adopt domain-first when justified by 20+ domains or 5+ team members.
- **Incorrect Namespace Mapping**: Moving files to domain directories without updating namespaces. Solution: Update namespaces and autoloading simultaneously.
- **Directory Proliferation**: Every entity including lookup tables gets its own domain directory. Solution: Collapse small entities into a `Shared` domain.

## Anti-Patterns

- **Namespace Confusion**: Directory structure doesn't match namespace, causing autoloading errors and IDE confusion.
- **Circular Domain Dependencies**: Domain A depends on Domain B's DTOs, which depend on Domain A's services. Domain boundaries are not actually bounded.
- **Architecture By URL**: Directory structure mirrors URL structure (`/api/v1/users/` → `app/Api/V1/Users/`), coupling code organization to API versioning.

## Examples

### Layer-First Structure (Laravel Default)
```
app/
  Http/Controllers/
    UserController.php
    OrderController.php
  Actions/
    CreateUserAction.php
    CreateOrderAction.php
  Services/
    UserService.php
    OrderService.php
  Models/
    User.php
    Order.php
```

### Domain-First Structure
```
app/
  Domain/
    Users/
      Controllers/UserController.php
      Actions/CreateUserAction.php
      Services/UserService.php
      Models/User.php
    Orders/
      Controllers/OrderController.php
      Actions/CreateOrderAction.php
      Services/OrderService.php
      Models/Order.php
  Shared/
    Actions/
    DTOs/
```

## Related Topics

| Knowledge Unit | Relationship | Type |
|---------------|--------------|------|
| All CRUD Architecture KUs | Each KU defines a layer type that must be organized | Prerequisite |
| Action Organization | Where action files go | Related |
| DTO Organization | Where DTO files go | Related |
| Service Organization | Where service files go | Related |
| Modular Laravel | Domain modules with service providers | Follow-up |
| Package Development | When to extract domains into separate packages | Follow-up |

## AI Agent Notes

- Directory structure is a communication tool — it tells developers what the team thinks is important
- Layer-first communicates technical architecture; domain-first communicates business architecture
- Default to layer-first for new projects — only adopt domain-first when the application size and team size justify it
- When generating files, place them according to the chosen strategy — never create files that break the directory convention
- Migration between strategies is possible but should be done one domain at a time

## Verification

- [ ] Namespace matches directory path for all classes
- [ ] PSR-4 autoloading is correctly configured in composer.json
- [ ] Primary organization strategy is applied consistently
- [ ] Domain boundaries are respected (no circular domain dependencies)
- [ ] Layer isolation is maintainable within the chosen structure
- [ ] `composer dump-autoload` has been run after structure changes
- [ ] IDE navigation (find class, go to file) works correctly with the chosen strategy
