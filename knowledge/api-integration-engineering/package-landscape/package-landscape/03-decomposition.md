---
id: ku-aie-005
title: "Package Landscape & Decision Framework"
subdomain: "package-landscape"
ku-type: "reference"
date-created: "2026-06-02"
domain-maturity: "mature"
status: "draft"
file-path: "research/workspaces/api-integration-engineering/09-package-landscape/03-decomposition.md"
---

# Package Landscape & Decision Framework

## Topic Overview

The Laravel API Integration Engineering ecosystem has mature packages for each concern: HTTP clients (Saloon, Guzzle, Http facade), webhooks (Spatie), circuit breakers (algoyounes, Fuse), idempotency (square1, infinitypaul), and versioning (laravel-apiroute). This KU provides a comparison matrix, decision framework, and migration guides.

## Decomposition Strategy

Decomposed by integration concern (HTTP client, webhooks, circuit breaker, idempotency, versioning) with evaluation criteria: maturity, features, maintenance health, Laravel compatibility, and migration paths.

### Level 1: Concern Categories
- **HTTP Clients:** SaloonPHP v4 vs Http facade vs Guzzle vs vendor SDKs
- **Webhook Packages:** Spatie client/server vs Convoy/Svix managed gateways vs custom
- **Resilience Tools:** algoyounes circuit-breaker, Fuse, idempotency packages
- **Versioning:** laravel-apiroute vs manual strategies

### Level 2: Evaluation Criteria
- Maturity (version, stars, contributors, release cadence)
- Laravel version compatibility matrix
- Integration depth (middleware, plugins, service providers)
- Production readiness (test coverage, documentation, upgrade guides)

### Level 3: Migration Guides
- Http facade to Saloon migration
- Guzzle to Saloon migration
- Adding circuit breaker to existing integrations
- Inline API calls to service module/connector pattern

## Proposed Folder Structure

```
09-package-landscape/
├── comparison-matrix.md
├── dependency-management.md
├── migration-guides/
│   ├── v3-to-v4-saloon.md
│   ├── circuit-breaker-addition.md
│   ├── http-facade-to-saloon.md
│   └── inline-to-service-module.md
├── 02-knowledge-unit.md
├── 03-decomposition.md
└── 04-standardized-knowledge.md
```

## Knowledge Unit Inventory

| KU ID | Title | Priority | Dependencies |
|-------|-------|----------|--------------|
| ku-aie-005 | Package Landscape Overview (this KU) | P0 | None |
| ku-aie-006 | HTTP Client Package Comparison | P0 | ku-aie-005 |
| ku-aie-007 | Webhook Package Comparison | P1 | ku-aie-005 |
| ku-aie-008 | Resilience Package Guide | P1 | ku-aie-005 |
| ku-aie-009 | Migration Playbooks | P1 | ku-aie-006, ku-aie-007, ku-aie-008 |

## Dependency Graph

```
ku-aie-005 (overview)
├── ku-aie-006 (HTTP clients)
├── ku-aie-007 (webhooks)
├── ku-aie-008 (resilience)
└── ku-aie-009 (migration)
```

## Boundary Analysis

- **In scope:** Package comparison and selection framework, migration guides, dependency management, version compatibility matrices.
- **Out of scope:** Deep implementation details of each package (covered in respective subdomains: 01-foundations, 02-saloonphp, 03-webhooks, 04-resilience).
- **Overlaps with:** 01-foundations (Http facade), 02-saloonphp (Saloon details), 03-webhooks (Spatie details), 04-resilience (breaker/idempotency details), 05-api-versioning (versioning packages).

## Future Expansion Opportunities

- Automated package health monitoring service: GitHub API integration for stars, commits, issue response time
- Decision tree interactive tool for package selection based on project requirements
- Compatibility matrix maintained as a living document with CI checks against Laravel versions
- Vendor SDK evaluation framework for non-Laravel-specific PHP packages
