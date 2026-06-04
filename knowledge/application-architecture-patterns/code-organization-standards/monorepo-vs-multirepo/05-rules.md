# Rules: COS-11 — Monorepo vs Multi-Repo

## R01: Default to Monorepo for Laravel Projects Under 50 Engineers
---
## Category
Architecture
---
## Rule
Use a monorepo (single repository with modular structure) as the default for Laravel projects. Only consider multi-repo at significant scale (50+ engineers) or with independent deployment requirements.
---
## Reason
The Laravel ecosystem is monorepo-centric. Monorepos enable atomic cross-module refactoring, single-command CI, and shared tooling. Multi-repos introduce version coordination (dependency hell), duplicated CI configuration, and cross-repo refactoring overhead.
---
## Bad Example
```php
// 3-engineer team, 5 repos (billing, catalog, identity, shared, api-gateway)
// Team spends 20% of time on cross-repo version bumps and CI config
// "Can we refactor this interface?" — "That requires coordinated releases across 3 repos"
```
---
## Good Example
```php
// Same team, 1 monorepo with modules:
// modules/billing/, modules/catalog/, modules/identity/
// Single composer.json, single CI, atomic cross-module changes
```
---
## Exceptions
Organizations with independent deployment requirements per module, or teams exceeding 50 engineers where monorepo CI becomes a bottleneck.
---
## Consequences Of Violation
Unnecessary operational complexity. Cross-cutting refactoring becomes a multi-day coordination effort instead of a single commit.
---

## R02: Use Path-Based CI Filtering in Monorepos to Keep CI Under 10 Minutes
---
## Category
Performance
---
## Rule
Configure CI to run only tests relevant to the changed paths. Use GitHub Actions path filters or equivalent.
---
## Reason
As a monorepo grows, running the full test suite on every commit becomes prohibitively slow (30+ minutes). Path-based filtering ensures that a change to `modules/billing/` only runs billing tests, keeping CI feedback loops fast.
---
## Bad Example
```yaml
# CI runs full suite on every commit — 45 minutes
# Even README changes trigger all tests
```
---
## Good Example
```yaml
jobs:
  billing-tests:
    if: contains(github.event.head_commit.modified, 'modules/billing/')
    runs-on: ubuntu-latest
    steps:
      - run: vendor/bin/pest --testsuite=billing

  catalog-tests:
    if: contains(github.event.head_commit.modified, 'modules/catalog/')
    runs-on: ubuntu-latest
    steps:
      - run: vendor/bin/pest --testsuite=catalog
```
---
## Exceptions
Small monorepos (<10 modules) where full test suite runs under 5 minutes.
---
## Consequences Of Violation
CI times balloon to 30+ minutes. Developers wait for unrelated test suites. Deployment velocity drops.
---

## R03: Enforce Module Boundaries Even Within a Monorepo
---
## Category
Architecture
---
## Rule
Treat modules in a monorepo with the same boundary discipline as separate repositories — no direct cross-module model access, use contracts or events.
---
## Reason
Monorepo without module boundaries is just a monolith — an unmanageable single-mass codebase. Well-defined boundaries enable future extraction to microservices and prevent coupling creep.
---
## Bad Example
```php
// Monorepo — but modules tightly coupled:
// modules/catalog/src/Services/ProductService.php
use Modules\Billing\Models\Invoice;
// Catalog calls Billing's model directly — no boundary
```
---
## Good Example
```php
// modules/catalog/src/Services/ProductService.php
use Modules\Billing\Contracts\BillingServiceInterface;
// Catalog depends on contract, not implementation — boundary maintained
```
---
## Exceptions
Temporary shortcuts during rapid prototyping with a plan to enforce boundaries before v1.0.
---
## Consequences Of Violation
Module extraction to separate repo becomes impossible — coupling is too deep. Monorepo becomes a monolith.
---

## R04: Never Split Into Multi-Repo Without a Shared Contracts Package
---
## Category
Reliability
---
## Rule
Before splitting a monorepo into multiple repositories, create and version a shared contracts package that all repos depend on.
---
## Reason
Without shared contracts, each repo duplicates interfaces and data structures. Code drifts apart, shared concepts fall out of sync, and cross-repo integration becomes unreliable. A versioned contracts package is the minimum infrastructure for multi-repo viability.
---
## Bad Example
```php
// 3 repos, no shared contracts:
// billing repo: interface PaymentService { ... }
// catalog repo: interface PaymentService { ... } — duplicated, different signature
// Integration bugs from mismatched contracts
```
---
## Good Example
```bash
# contracts/ package (separate repo or Packagist package)
# Billing\Contracts\PaymentServiceInterface — single source of truth
# billing repo: composer require our/contracts ^1.0
# catalog repo: composer require our/contracts ^1.0
```
---
## Exceptions
Full microservices isolation where services communicate only via HTTP/event — no shared contracts needed (but API specifications replace them).
---
## Consequences Of Violation
Code duplication and drift across repos. Integration failures from interface mismatches.
---

## R05: Keep Multi-Repo Dependency Graph Documented and Visible
---
## Category
Maintainability
---
## Rule
Document the dependency graph between all repositories in a multi-repo setup, including version constraints.
---
## Reason
Coordinating upgrades in multi-repo requires understanding which repos depend on which. Without a dependency map, upgrading a shared package version cascades into broken builds that take days to diagnose.
---
## Bad Example
```bash
# No dependency documentation
# Team upgrades contracts package to v2.0
# 3 of 7 repos break — no one knows which repos depend on which version
```
---
## Good Example
```md
# REPO-MAP.md
# | Repo | Dependencies | Required Version |
# |------|--------------|-----------------|
# | billing | contracts | ^1.0 |
# | catalog | contracts | ^1.0 |
# | identity | contracts | ^1.0 |
# | api-gateway | billing, catalog | ^1.0 |
```
---
## Exceptions
Monorepo setup where all code is in one repo (no cross-repo dependencies).
---
## Consequences Of Violation
Unplanned outages during dependency upgrades. Emergency "fix-forward" commits across 4 repos.
---

## R06: Prefer Modular Monolith Over Microservices for Laravel Projects
---
## Category
Architecture
---
## Rule
For most Laravel projects, build a modular monolith (single deployable, multiple modules) rather than splitting into microservices.
---
## Reason
Microservices introduce network latency, distributed transactions, eventual consistency, and operational complexity. A modular monolith provides most isolation benefits without these costs. Extract to microservices only when independent scaling or deployment is required.
---
## Bad Example
```php
// 6-microservice architecture for a team of 4
// Services communicate via HTTP — 50ms latency per call
// Need saga pattern for distributed transactions
// Team spends 40% of time on infrastructure, not features
```
---
## Good Example
```php
// Modular monolith — single deployable, clear module boundaries
// modules/billing/, modules/catalog/, modules/identity/
// 0ms internal calls (in-process), atomic transactions
// Extract modules to microservices individually when needed
```
---
## Exceptions
Organizations where independent scaling, deployment, or team autonomy requires separate services.
---
## Consequences Of Violation
Premature microservices complexity. Distributed transaction nightmares. Full-time DevOps staffing for infrastructure that could be one deploy.
---

## R07: Use Semantic Versioning for Shared Packages in Multi-Repo
---
## Category
Reliability
---
## Rule
Version all shared packages (contracts, shared libraries) with strict semantic versioning. Never break backward compatibility in a minor or patch release.
---
## Reason
Multi-repo setups depend on shared packages. A breaking change in a minor version of the contracts package will silently break all consuming repos. Strict semver prevents this by making breaking changes explicit in major versions.
---
## Bad Example
```json
// contracts/composer.json
{
  "version": "1.5.0",
  // Removed a method signature — BREAKING CHANGE
  // Consuming repos get broken without warning
}
```
---
## Good Example
```json
// contracts/composer.json
{
  "version": "2.0.0",
  // Breaking changes only in major version
  // Consuming repos must explicitly require ^2.0
}
```
---
## Exceptions
Monorepo setups where all consumers share the same version (no separate versioning needed).
---
## Consequences Of Violation
Silent breaking changes. Production outages from incompatible shared packages. Emergency rollbacks.
---

## R08: Use Hybrid Approach — Monorepo for Related Modules, Multi-Repo for External Services
---
## Category
Scalability
---
## Rule
Use a monorepo for closely related modules (billing, catalog, identity) and separate repos for loosely coupled external services (notification service, analytics pipeline).
---
## Reason
Not all code benefits equally from monorepo or multi-repo. Related code benefits from atomic changes and shared tooling (monorepo). Truly independent services benefit from independent deployment and scaling (multi-repo). The hybrid approach optimizes both.
---
## Bad Example
```php
// All-or-nothing:
// 1 monorepo with billing, catalog, identity, data-pipeline, notification-service, ML-training
// Data pipeline runs every 4 hours — no reason to couple its deploy to web app
```
---
## Good Example
```php
// Monorepo: billing, catalog, identity (related, same deploy)
// Separate repos: data-pipeline (batch, different schedule)
// Separate repos: notification-service (independent scaling needs)
```
---
## Exceptions
Teams under 15 engineers where multi-repo overhead exceeds benefits regardless of service coupling.
---
## Consequences Of Violation
Unnecessary coupling of unrelated deploy schedules. Monorepo CI runs data pipeline tests on every web commit.
