# ECC Repository Map

> Laravel Engineering Codex -- a structured knowledge repository for engineering Laravel applications with production-grade intelligence.

| Metric | Count |
|---|---|
| Domains | 21 |
| Knowledge Units (KU) | 2,307 |
| Total knowledge files | 18,003 |
| Intelligence indexes | 6 |
| Intelligence JSON files | 4 |
| Registry files | 1 |
| Skills | 12 |
| Rule files | 40 |
| Agent definitions | 12 |

---

## Repository Tree

```
laravel-ecc/
├── knowledge/                          (21 domains, 2,307 KUs, 18,003 files)
│   ├── ai-intelligence-systems/
│   ├── api-crud-system-engineering/
│   ├── api-integration-engineering/
│   ├── application-architecture-patterns/
│   ├── async-distributed-systems/
│   ├── backend-architecture-design/
│   ├── cost-resource-optimization/
│   ├── data-engineering-analytics/
│   ├── data-storage-systems/
│   ├── devops-infrastructure/
│   ├── governance-compliance-engineering/
│   ├── laravel-core-application-engineering/
│   ├── laravel-eloquent-domain-modeling/
│   ├── laravel-execution-lifecycle/
│   ├── observability-production-intelligence/
│   ├── performance-runtime-engineering/
│   ├── platform-engineering-developer-experience/
│   ├── real-time-systems/
│   ├── search-retrieval-systems/
│   ├── security-identity-engineering/
│   └── testing-reliability-engineering/
├── intelligence/
│   ├── indexes/                        (6 files)
│   ├── registry/                       (1 file)
│   └── json/                           (4 files)
├── agent/                              (0 navigation files)
├── agents/                             (12 agent definitions)
├── skills/                             (12 skill sets, 25 files)
├── rules/                              (40 rules, 4 categories)
│   ├── common/                         (10 rules)
│   ├── laravel/                        (14 rules)
│   ├── php/                            (5 rules)
│   └── web/                            (6 rules)
├── meta/                               (21 domain-discovery directories)
├── docs/                               (documentation)
├── commands/                           (empty)
├── scripts/                            (automation scripts)
├── hooks/                              (git/agent hooks)
├── manifests/                          (empty)
├── mcp-configs/                        (MCP server configs)
├── production/                         (production indexes)
├── .claude/                            (1 file)
├── .codebuddy/                         (1 file)
├── .codex/                             (1 file)
├── .cursor/                            (2 files)
├── .gemini/                            (1 file)
├── .github/                            (1 file)
├── .kiro/                              (1 file)
├── .opencode/                          (1 file)
├── .qwen/                              (1 file)
├── .trae/                              (1 file)
├── .vscode/                            (2 files)
└── .zed/                               (1 file)
```

---

## Domain Inventory

### 1. ai-intelligence-systems
- **KUs:** 117 | **Subdomains:** 15 | **Files:** 942
- Subdomains: 01-provider-integration, 02-laravel-ai-sdk, 03-agentic-workflows, 04-rag-retrieval-augmented-generation, 05-vector-databases, 06-ai-search, 07-streaming, 08-cost-token-management, 09-ai-middleware-gateways, 10-prompt-engineering, 11-ai-safety-security, 12-observability-monitoring, 13-local-llms, 14-ecosystem-packages, 15-future-trends, _templates

### 2. api-crud-system-engineering
- **KUs:** 237 | **Subdomains:** 12 | **Files:** 1,743
- Subdomains: api-authentication-authorization, api-documentation, api-lifecycle-governance, api-testing, api-versioning, crud-architecture, error-handling-design, input-validation-architecture, pagination-strategies, resource-controllers, response-structures, rest-api-design, _templates

### 3. api-integration-engineering
- **KUs:** 65 | **Subdomains:** 10 | **Files:** 670
- Subdomains: 01-foundations, 02-saloonphp, 03-webhooks, 04-resilience, 05-api-versioning, 06-integration-architecture, 07-observability, 08-sdk-generation, 09-package-landscape, 10-case-studies, emerging-topics, _templates

### 4. application-architecture-patterns
- **KUs:** 107 | **Subdomains:** 7 | **Files:** 797
- Subdomains: 01-code-organization-standards, 02-layered-architecture-patterns, 03-modular-monolith-design, 04-service-layer-patterns, 05-domain-boundaries-bounded-contexts, 06-communication-patterns-contracts, 07-architecture-enforcement-governance, _templates

### 5. async-distributed-systems
- **KUs:** 78 | **Subdomains:** 11 | **Files:** 726
- Subdomains: 01-queue-engineering, 02-job-batching-chaining, 03-retry-failure-handling, 04-event-driven-architecture, 05-broadcasting-realtime, 06-message-distribution-systems, 07-horizon-scaling, 08-async-patterns, 09-webhook-distribution, 10-queue-observability, 11-production-patterns, references, _templates

### 6. backend-architecture-design
- **KUs:** 58 | **Subdomains:** 19 | **Files:** 682
- Subdomains: anti-corruption-layer, architectural-decision-records, architecture-governance, c4-modeling, clean-onion-architecture, contract-testing, coupling-cohesion, cqrs, ddd-strategic, ddd-tactical, decision-trees, dto-vs-value-objects, event-sourcing, event-storming, grasp-patterns, hexagonal-architecture, patterns, service-decomposition, solid-principles, _templates

### 7. cost-resource-optimization
- **KUs:** 110 | **Subdomains:** 12 | **Files:** 883
- Subdomains: 01-compute-optimization, 02-database-cost-optimization, 03-queue-worker-optimization, 04-cache-layer-optimization, 05-cdn-storage-optimization, 06-commitment-optimization, 07-monitoring-observability-cost, 08-network-cost-optimization, 09-server-sizing-autoscaling, 10-multi-region-global-cost, 11-laravel-cloud-platform-cost, 12-tools-automation, references, templates, _templates

### 8. data-engineering-analytics
- **KUs:** 45 | **Subdomains:** 13 | **Files:** 108
- Subdomains: 01-event-tracking, 02-self-hosted-analytics, 03-etl-elt-pipelines, 04-data-warehousing, 05-olap-modeling, 06-real-time-analytics, 07-data-exports, 08-dashboards-reporting, 09-analytical-queries, 10-observability, 11-case-studies, 12-reference-architectures, 13-reference-data, _templates

### 9. data-storage-systems
- **KUs:** 383 | **Subdomains:** 11 | **Files:** 3,114
- Subdomains: advanced, connections, indexes, multi-tenancy, optimization, partitioning, queries, replication, schema, sharding, transactions

### 10. devops-infrastructure
- **KUs:** 47 | **Subdomains:** 14 | **Files:** 95
- Subdomains: 01-server-provisioning, 02-deployment-strategies, 03-ci-cd-pipelines, 04-docker-containerization, 05-kubernetes-orchestration, 06-serverless-laravel, 07-infrastructure-as-code, 08-environment-secrets-management, 09-database-deployment, 10-observability-monitoring, 11-hosting-platforms, 12-laravel-octane-performance, 13-security-hardening, 14-backup-disaster-recovery, shared, _templates

### 11. governance-compliance-engineering
- **KUs:** 40 | **Subdomains:** 10 | **Files:** 81
- Subdomains: access-control-authorization, audit-trails-activity-logging, compliance-automation-policy-as-code, data-classification-sovereignty, data-retention-anonymization, feature-flag-governance, gdpr-regulatory-compliance, multi-region-multi-tenant-compliance, owasp-compliance, sla-management, _templates

### 12. laravel-core-application-engineering
- **KUs:** 136 | **Subdomains:** 12 | **Files:** 1,205
- Subdomains: action-pattern, api-resources, application-architecture, blade-view-layer, controllers, dtos, exception-handling, feature-based-structure, form-requests-validation, livewire-inertia, middleware, routing, service-layer, _templates

### 13. laravel-eloquent-domain-modeling
- **KUs:** 151 | **Subdomains:** 11 | **Files:** 1,249
- Subdomains: architectural-decisions, attributes-and-casting, domain-modeling-patterns, factories-and-seeders, model-design, model-lifecycle, performance-and-integrity, query-strategy, relationships, serialization, soft-deletes-and-pruning, _templates

### 14. laravel-execution-lifecycle
- **KUs:** 115 | **Subdomains:** 10 | **Files:** 949
- Subdomains: application-bootstrap, boot-order-timing, caching-optimization, dependency-injection, kernel-architecture, long-running-processes, middleware-pipeline, request-lifecycle, service-container, service-providers, _templates

### 15. observability-production-intelligence
- **KUs:** 31 | **Subdomains:** 10 | **Files:** 96
- Subdomains: 01-logging, 02-error-tracking, 03-apm-performance-monitoring, 04-distributed-tracing, 05-metrics-collection, 06-health-checks, 07-dashboards-visualization, 08-alerting-incident-response, 09-advanced-topics, 10-examples, templates, _templates

### 16. performance-runtime-engineering
- **KUs:** 161 | **Subdomains:** 10 | **Files:** 1,250
- Subdomains: S01-php-engine-version-performance, S02-jit-compilation, S03-opcache-configuration, S04-memory-management-gc, S05-php-fpm-worker-management, S06-alternative-runtimes, S07-laravel-octane, S08-benchmarking-methodology, S09-profiling-observability, S10-deployment-cache-invalidation, Z0-enterprise-architecture, Z9-domain-reference, _assets, _templates

### 17. platform-engineering-developer-experience
- **KUs:** 107 | **Subdomains:** 10 | **Files:** 857
- Subdomains: 01-internal-developer-platforms, 02-package-development, 03-monorepo-management, 04-developer-tooling, 05-code-quality, 06-code-generation, 07-development-environments, 08-workflow-automation, 09-onboarding-and-standards, 10-cli-tooling, shared-references, _templates

### 18. real-time-systems
- **KUs:** 39 | **Subdomains:** 17 | **Files:** 313
- Subdomains: 01-broadcasting-architecture, 03-laravel-echo, 04-channels, 06-sse-server-sent-events, 07-transport-comparison, 08-real-time-notifications, 09-real-time-dashboards, 10-collaborative-editing, 11-scaling-production, 12-deployment, 13-monitoring-observability, 14-testing, 15-advanced-patterns, assets, security, websocket-servers, _templates

### 19. search-retrieval-systems
- **KUs:** 140 | **Subdomains:** 16 | **Files:** 1,121
- Subdomains: 01-laravel-scout-foundation, 02-database-fulltext-search, 03-meilisearch, 04-algolia, 05-typesense, 06-vector-search-systems, 07-hybrid-search, 08-relevance-and-ranking, 09-search-ux-and-analytics, 10-synonym-and-typology-management, 11-search-caching, 12-real-time-indexing, 13-search-performance, 14-rag-search-pipelines, 15-search-operations, 16-search-system-decision-guides, assets, _templates

### 20. security-identity-engineering
- **KUs:** 61 | **Subdomains:** 8 | **Files:** 489
- Subdomains: 01-authentication, 02-authorization, 03-hardening, 04-threat-mitigation, 05-secrets, 06-audit-logging, 07-multi-tenancy, shared, _templates

### 21. testing-reliability-engineering
- **KUs:** 79 | **Subdomains:** 20 | **Files:** 633
- Subdomains: 1-core-concepts, 10-performance-load-testing, 11-resilience-chaos-engineering, 12-accessibility-testing, 13-contract-testing, 14-ci-cd-pipeline, 15-flaky-test-prevention, 16-test-organization, 17-test-data-management, 18-advanced-techniques, 19-query-performance-diagnostics, 2-feature-http-testing, 20-migration-guides, 3-database-testing, 4-unit-testing, 5-mocking-fakes, 6-browser-e2e-testing, 7-architecture-testing, 8-mutation-testing, 9-snapshot-testing, _templates

---

## Intelligence Layer Overview

### Indexes (6 files)

| File | Size | Purpose |
|---|---|---|
| `intelligence/indexes/checklist-index.md` | 440 KB | Master index of all checklists across domains |
| `intelligence/indexes/decision-tree-index.md` | 89 KB | Aggregated decision trees for engineering choices |
| `intelligence/indexes/dependency-index.md` | 13 KB | Cross-domain dependency map |
| `intelligence/indexes/knowledge-unit-index.md` | 196 KB | Complete index of all knowledge units |
| `intelligence/indexes/rule-index.md` | 6.3 MB | Compiled rule definitions for all categories |
| `intelligence/indexes/skill-index.md` | 240 KB | Index of all skill definitions |

### JSON Layer (4 files)

| File | Size | Purpose |
|---|---|---|
| `intelligence/json/dependencies.json` | 824 KB | Machine-readable dependency graph |
| `intelligence/json/knowledge-units.json` | 6.8 MB | Machine-readable KU metadata |
| `intelligence/json/rules.json` | 17.0 MB | Machine-readable rule set |
| `intelligence/json/skills.json` | 4.1 MB | Machine-readable skill definitions |

### Registry (1 file)

| File | Size | Purpose |
|---|---|---|
| `intelligence/registry/knowledge-registry.md` | 92 KB | Human-readable domain registry with metadata |

---

## Existing ECC Ecosystem

### Skills Inventory (12 Laravel Skill Sets)

| Skill Directory | Description |
|---|---|
| `skills/laravel-api-graphql` | GraphQL API development |
| `skills/laravel-api-grpc` | gRPC API development |
| `skills/laravel-api-jsonapi` | JSON:API specification implementation |
| `skills/laravel-api-microservices` | Microservice API patterns |
| `skills/laravel-api-rest` | RESTful API development |
| `skills/laravel-authentication` | Authentication implementation |
| `skills/laravel-core-internals` | Laravel core internals |
| `skills/laravel-database` | Database engineering |
| `skills/laravel-eloquent` | Eloquent ORM patterns |
| `skills/laravel-patterns` | Laravel design patterns |
| `skills/laravel-security` | Security best practices |
| `skills/laravel-tdd` | Test-driven development |

Total skill files: 25

### Rules Inventory (40 rules across 4 categories)

**common/** (10 rules): agents, code-review, coding-style, development-workflow, git-workflow, hooks, patterns, performance, security, testing

**laravel/** (14 rules): api-graphql, api-grpc, api-jsonapi, api-microservices, api-rest, architecture, authentication, coding-style, contracts, database, eloquent, facades, hooks, middleware, patterns, security, service-container, service-providers, testing

**php/** (5 rules): coding-style, hooks, patterns, security, testing

**web/** (6 rules): coding-style, design-quality, hooks, patterns, performance, security, testing

### Agents Inventory (12 Agent Files)

| Agent | Domain Focus |
|---|---|
| `agents/laravel-api-graphql` | GraphQL API specialization |
| `agents/laravel-api-grpc` | gRPC API specialization |
| `agents/laravel-api-jsonapi` | JSON:API specialization |
| `agents/laravel-api-microservices` | Microservices architecture |
| `agents/laravel-api-rest` | REST API specialization |
| `agents/laravel-artisan` | Artisan console expertise |
| `agents/laravel-authentication` | Authentication systems |
| `agents/laravel-container` | Service container expertise |
| `agents/laravel-database` | Database engineering |
| `agents/laravel-eloquent` | Eloquent ORM expertise |
| `agents/laravel-identity-architecture` | Identity & access architecture |
| `agents/laravel-migration` | Database migration expertise |

### Agent Navigation Files

The `agent/` directory is currently empty -- no navigation files have been created yet.

---

## Navigation Guide

### For Humans
- **Domain discovery:** Start at `meta/domain-discovery/` for domain summaries, then drill into `knowledge/<domain>/` for detailed KUs.
- **Quick reference:** Use `docs/domains.md` for a concise domain overview.
- **Registry:** `intelligence/registry/knowledge-registry.md` provides a curated human-readable map.
- **Rules:** Check `rules/<category>/` for coding standards and workflows.
- **Skills:** Browse `skills/` for reusable skill definitions organized by Laravel topic.

### For AI Agents
- **Root entry:** Use `intelligence/indexes/knowledge-unit-index.md` to locate any KU across all domains.
- **Decision support:** `intelligence/indexes/decision-tree-index.md` for guided engineering decisions.
- **Dependency navigation:** `intelligence/indexes/dependency-index.md` or `intelligence/json/dependencies.json` for cross-domain prerequisites.
- **Rule loading:** `intelligence/indexes/rule-index.md` or `intelligence/json/rules.json` for machine-parseable rule definitions.
- **Skill loading:** `intelligence/indexes/skill-index.md` or `intelligence/json/skills.json` for skill invocation metadata.
- **Checklist execution:** `intelligence/indexes/checklist-index.md` for step-by-step KU checklists.
- **Agent definitions:** `agents/` directory contains specialized agent configurations per domain.
- **Programmatic access:** Use `intelligence/json/` for structured JSON data (dependencies, KUs, rules, skills).
- **Agent configs:** Each `.agent/` directory (`.claude/`, `.cursor/`, `.opencode/`, etc.) contains framework-specific configuration files.

---

*Generated from live repository exploration. All counts are accurate as of query time.*
