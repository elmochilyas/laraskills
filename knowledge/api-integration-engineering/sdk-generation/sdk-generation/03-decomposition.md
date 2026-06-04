---
id: ku-aie-001
title: "API Client SDK Generation & Distribution"
subdomain: "sdk-generation"
ku-type: "practice"
date-created: "2026-06-02"
domain-maturity: "mature"
status: "draft"
file-path: "research/workspaces/api-integration-engineering/08-sdk-generation/03-decomposition.md"
---

# API Client SDK Generation & Distribution

## Topic Overview

API client SDKs encapsulate external API complexity behind a clean, typed, testable PHP interface. The domain covers manual SDK construction with SaloonPHP, OpenAPI-driven auto-generation, package distribution, versioning strategies, and comprehensive testing across sandbox/production environments.

## Decomposition Strategy

Decomposed along the SDK lifecycle: design (structure, patterns) -> generation (manual vs auto) -> distribution (packaging, versioning) -> maintenance (updates, deprecation).

### Level 1: SDK Construction Approaches
- **Manual SDK with Saloon:** Connector, Request, Response, DTO, Pagination patterns
- **OpenAPI-Generated SDK:** Speakeasy, Fern, Postman import workflows
- **Hybrid Approach:** Auto-generate DTOs + skeleton, manually customize business logic

### Level 2: Distribution & Versioning
- Composer package structure, README standards, changelog generation
- Semantic versioning aligned with API version
- Multiple SDK versions per API version, migration guides

### Level 3: Testing & Quality
- Contract testing against sandbox API in CI
- Mock/fake testing with recorded fixtures
- Error rate monitoring and alerting per endpoint

## Proposed Folder Structure

```
08-sdk-generation/
├── manual-sdk-build.md
├── openapi-generation.md
├── testing-sdks.md
├── 02-knowledge-unit.md
├── 03-decomposition.md
└── 04-standardized-knowledge.md
```

## Knowledge Unit Inventory

| KU ID | Title | Priority | Dependencies |
|-------|-------|----------|--------------|
| ku-aie-001 | SDK Generation Overview (this KU) | P0 | None |
| ku-aie-002 | Manual SDK Build with Saloon | P0 | ku-aie-001 |
| ku-aie-003 | OpenAPI SDK Generation | P1 | ku-aie-001 |
| ku-aie-004 | SDK Testing & Contract Testing | P1 | ku-aie-002 |

## Dependency Graph

```
ku-aie-001 (foundation)
├── ku-aie-002 (manual Saloon SDK)
│   └── ku-aie-004 (testing)
└── ku-aie-003 (OpenAPI generation)
```

## Boundary Analysis

- **In scope:** SDK design patterns, generation approaches, package distribution, versioning, testing, authentication integration, pagination.
- **Out of scope:** The APIs the SDK is consuming (covered in respective API docs), OpenAPI spec authoring, API server implementation.
- **Overlaps with:** 02-saloonphp (connector/request patterns), 01-foundations (HTTP client layer), 09-package-landscape (SDK comparison).

## Future Expansion Opportunities

- AI-assisted SDK generation from natural language API descriptions
- SDK health monitoring: track SDK error rates and auto-regenerate from updated OpenAPI specs
- Standardized SDK skeleton template for internal API consumption
- SDK deprecation automation: sunset headers automatically trigger SDK warning logs
