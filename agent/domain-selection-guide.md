# ECC Domain Selection Guide

Problem-to-domain matching guide.

---

## Quick Selection Matrix

| If you need... | Go to domain... | Then subdomain... |
|---|---|---|
| Build a REST API | api-crud-system-engineering | rest-api-design → resource-controllers → crud-architecture |
| Implement login/registration | security-identity-engineering | 01-authentication |
| Define Eloquent relationships | laravel-eloquent-domain-modeling | relationships |
| Write a database migration | data-storage-systems | schema |
| Run feature tests with Pest | testing-reliability-engineering | 2-feature-http-testing |
| Debug request lifecycle | laravel-execution-lifecycle | request-lifecycle |
| Create a Blade view | laravel-core-application-engineering | blade-view-layer |
| Set up broadcasting with Reverb | real-time-systems | 01-broadcasting-architecture |
| Deploy to production | devops-infrastructure | 02-deployment-strategies |
| Profile slow endpoints | performance-runtime-engineering | S08-benchmarking-methodology |
| Add queue jobs | async-distributed-systems | 01-queue-engineering |
| Configure AI provider | ai-intelligence-systems | 01-provider-integration |
| Set up Meilisearch | search-retrieval-systems | 03-meilisearch |
| Integrate third-party API | api-integration-engineering | 02-saloonphp |
| Establish architecture patterns | application-architecture-patterns | 02-layered-architecture-patterns |
| Choose CQRS/Event Sourcing | backend-architecture-design | cqrs, event-sourcing |
| Monitor application health | observability-production-intelligence | 01-logging |
| Implement RBAC/ABAC | governance-compliance-engineering | access-control-authorization |
| Optimize cloud costs | cost-resource-optimization | 01-compute-optimization |
| Set up CI/CD pipeline | platform-engineering-developer-experience | 05-code-quality |
| Define DTOs and Actions | laravel-core-application-engineering | action-pattern, dtos |
| Configure service container | laravel-execution-lifecycle | service-container |
| Add GraphQL endpoint | api-crud-system-engineering | (use laravel-api-graphql skill) |
| Handle webhook delivery | api-integration-engineering | 03-webhooks |
| Implement vector search | search-retrieval-systems | 06-vector-search-systems |
| Design bounded contexts | application-architecture-patterns | 05-domain-boundaries-bounded-contexts |
| Set up Laravel Octane | performance-runtime-engineering | S07-laravel-octane |
| Create Artisan commands | platform-engineering-developer-experience | 10-cli-tooling |
| Implement GDPR compliance | governance-compliance-engineering | gdpr-regulatory-compliance |
| Build real-time notifications | real-time-systems | 08-real-time-notifications |
| Design modular monolith | application-architecture-patterns | 03-modular-monolith-design |
| Run architecture tests | testing-reliability-engineering | 7-architecture-testing |
| Optimize N+1 queries | laravel-eloquent-domain-modeling | performance-and-integrity |
| Configure Horizon | async-distributed-systems | 07-horizon-scaling |
| Set up OpenTelemetry | observability-production-intelligence | 04-distributed-tracing |
| Build ETL pipeline | data-engineering-analytics | 03-etl-elt-pipelines |
| Secure API with rate limiting | api-crud-system-engineering | api-authentication-authorization |
| Configure server provisioning | devops-infrastructure | 01-server-provisioning |
| Implement multi-tenancy | security-identity-engineering | 07-multi-tenancy |

---

## Full Domain Reference

### AI Intelligence Systems
**Path:** knowledge/ai-intelligence-systems/
**Problems solved:** LLM integration, RAG, vector databases, agentic workflows, prompt engineering, AI safety, streaming
**Key subdomains:** 01-provider-integration, 02-laravel-ai-sdk, 03-agentic-workflows, 04-rag-retrieval-augmented-generation, 05-vector-databases, 06-ai-search, 07-streaming, 08-cost-token-management, 09-ai-middleware-gateways, 10-prompt-engineering, 11-ai-safety-security, 12-observability-monitoring, 13-local-llms, 14-ecosystem-packages
**Entry KUs:** Rag Architecture Fundamentals, Laravel Ai Sdk Architecture, Vector Database Fundamentals
**Related skills:** (none directly)
**Related agents:** (none directly)

### API & CRUD System Engineering
**Path:** knowledge/api-crud-system-engineering/
**Problems solved:** REST API design, CRUD architecture, resource controllers, input validation, error handling, pagination, API versioning, API documentation, API testing
**Key subdomains:** rest-api-design, crud-architecture, resource-controllers, input-validation-architecture, error-handling-design, pagination-strategies, response-structures, api-versioning, api-authentication-authorization, api-documentation, api-testing, api-lifecycle-governance
**Entry KUs:** Rest Architectural Constraints, Resource Controller Pattern, Thin Controller Principle
**Related skills:** laravel-api-rest, laravel-api-jsonapi, laravel-api-graphql, laravel-api-grpc
**Related agents:** laravel-api-rest, laravel-api-jsonapi, laravel-api-graphql, laravel-api-grpc

### API Integration Engineering
**Path:** knowledge/api-integration-engineering/
**Problems solved:** Third-party API consumption, SaloonPHP, webhooks, resilience patterns, integration architecture, SDK generation
**Key subdomains:** 01-foundations, 02-saloonphp, 03-webhooks, 04-resilience, 05-api-versioning, 06-integration-architecture, 07-observability
**Entry KUs:** Laravel Http Client Facade, Retry & Circuit Breaker, Service Class Pattern
**Related skills:** (none directly)
**Related agents:** laravel-api-microservices

### Application Architecture Patterns
**Path:** knowledge/application-architecture-patterns/
**Problems solved:** Code organization, layered architecture, modular monolith, service layer, domain boundaries, bounded contexts, architecture enforcement
**Key subdomains:** 01-code-organization-standards, 02-layered-architecture-patterns, 03-modular-monolith-design, 04-service-layer-patterns, 05-domain-boundaries-bounded-contexts, 06-communication-patterns-contracts, 07-architecture-enforcement-governance
**Entry KUs:** Default Laravel Directory Structure, Three-Layer Architecture, Service Classes
**Related skills:** laravel-patterns
**Related agents:** (none directly)

### Async & Distributed Systems
**Path:** knowledge/async-distributed-systems/
**Problems solved:** Queue engineering, job batching/chaining, retry/failure handling, event-driven architecture, broadcasting, message distribution, Horizon scaling, async patterns
**Key subdomains:** 01-queue-engineering, 02-job-batching-chaining, 03-retry-failure-handling, 04-event-driven-architecture, 05-broadcasting-realtime, 06-message-distribution-systems, 07-horizon-scaling, 08-async-patterns, 09-webhook-distribution, 10-queue-observability, 11-production-patterns
**Entry KUs:** Queue Configuration, Event Auto-Discovery, After Commit
**Related skills:** (none directly)
**Related agents:** (none directly)

### Backend Architecture & Design
**Path:** knowledge/backend-architecture-design/
**Problems solved:** SOLID principles, GRASP patterns, hexagonal architecture, CQRS, event sourcing, DDD tactical/strategic, anti-corruption layer, architectural decision records
**Key subdomains:** solid-principles, grasp-patterns, hexagonal-architecture, clean-onion-architecture, cqrs, event-sourcing, ddd-tactical, ddd-strategic, anti-corruption-layer, architectural-decision-records, architecture-governance, c4-modeling, coupling-cohesion, service-decomposition, decision-trees
**Entry KUs:** SOLID Principles, Hexagonal Architecture, DDD Tactical Patterns
**Related skills:** laravel-patterns
**Related agents:** (none directly)

### Cost & Resource Optimization
**Path:** knowledge/cost-resource-optimization/
**Problems solved:** Compute optimization, database cost, queue worker optimization, cache layer, CDN/storage, commitment optimization, monitoring cost, network cost, server sizing, multi-region cost, Laravel cloud platform cost
**Key subdomains:** 01-compute-optimization, 02-database-cost-optimization, 03-queue-worker-optimization, 04-cache-layer-optimization, 05-cdn-storage-optimization, 06-commitment-optimization, 07-monitoring-observability-cost, 08-network-cost-optimization, 09-server-sizing-autoscaling, 10-multi-region-global-cost, 11-laravel-cloud-platform-cost, 12-tools-automation
**Entry KUs:** Compute Optimization, Database Cost Optimization, Cache Layer Optimization
**Related skills:** (none directly)
**Related agents:** (none directly)

### Data Engineering & Analytics
**Path:** knowledge/data-engineering-analytics/
**Problems solved:** Event tracking, self-hosted analytics, ETL/ELT pipelines, data warehousing, OLAP modeling, real-time analytics, data exports, dashboards, analytical queries
**Key subdomains:** 01-event-tracking, 02-self-hosted-analytics, 03-etl-elt-pipelines, 04-data-warehousing, 05-olap-modeling, 06-real-time-analytics, 07-data-exports, 08-dashboards-reporting, 09-analytical-queries, 10-observability, 11-case-studies, 12-reference-architectures, 13-reference-data
**Entry KUs:** Event Tracking, ETL/ELT Pipelines, Data Warehousing
**Related skills:** (none directly)
**Related agents:** (none directly)

### Data Storage Systems
**Path:** knowledge/data-storage-systems/
**Problems solved:** Database connections, schema design, indexing, partitioning, sharding, replication, optimization, queries, transactions, multi-tenancy, advanced features
**Key subdomains:** connections, schema, indexes, partitioning, sharding, replication, optimization, queries, transactions, multi-tenancy, advanced
**Entry KUs:** Schema Design, Indexing Strategies, Query Optimization
**Related skills:** laravel-database
**Related agents:** laravel-database, laravel-migration

### DevOps & Infrastructure
**Path:** knowledge/devops-infrastructure/
**Problems solved:** Server provisioning, deployment strategies, CI/CD pipelines, Docker, Kubernetes, serverless Laravel, infrastructure as code, secrets management, database deployment, hosting platforms, Octane performance, security hardening, backup/disaster recovery
**Key subdomains:** 01-server-provisioning, 02-deployment-strategies, 03-ci-cd-pipelines, 04-docker-containerization, 05-kubernetes-orchestration, 06-serverless-laravel, 07-infrastructure-as-code, 08-environment-secrets-management, 09-database-deployment, 10-observability-monitoring, 11-hosting-platforms, 12-laravel-octane-performance, 13-security-hardening, 14-backup-disaster-recovery
**Entry KUs:** Server Provisioning, Deployment Strategies, CI/CD Pipelines
**Related skills:** (none directly)
**Related agents:** (none directly)

### Governance & Compliance Engineering
**Path:** knowledge/governance-compliance-engineering/
**Problems solved:** Access control, audit trails, compliance automation, data classification, data retention, feature flag governance, GDPR, multi-region compliance, OWASP, SLA management
**Key subdomains:** access-control-authorization, audit-trails-activity-logging, compliance-automation-policy-as-code, data-classification-sovereignty, data-retention-anonymization, feature-flag-governance, gdpr-regulatory-compliance, multi-region-multi-tenant-compliance, owasp-compliance, sla-management
**Entry KUs:** Access Control, Audit Trails, GDPR Compliance
**Related skills:** (none directly)
**Related agents:** laravel-identity-architecture

### Laravel Core Application Engineering
**Path:** knowledge/laravel-core-application-engineering/
**Problems solved:** Application architecture, routing, controllers, middleware, Blade views, Livewire/Inertia, form requests, DTOs, API resources, exception handling, service layer, action pattern, feature-based structure
**Key subdomains:** application-architecture, routing, controllers, middleware, blade-view-layer, livewire-inertia, form-requests-validation, dtos, api-resources, exception-handling, service-layer, action-pattern, feature-based-structure
**Entry KUs:** Application Architecture, Routing, Controller Design
**Related skills:** laravel-patterns
**Related agents:** laravel-container

### Laravel Eloquent & Domain Modeling
**Path:** knowledge/laravel-eloquent-domain-modeling/
**Problems solved:** Model design, relationships, query strategy, attributes/casting, serialization, soft deletes/pruning, factories/seeders, domain modeling patterns, performance/integrity, model lifecycle, architectural decisions
**Key subdomains:** model-design, relationships, query-strategy, attributes-and-casting, serialization, soft-deletes-and-pruning, factories-and-seeders, domain-modeling-patterns, performance-and-integrity, model-lifecycle, architectural-decisions
**Entry KUs:** Model Design, Relationships, Query Strategy
**Related skills:** laravel-eloquent
**Related agents:** laravel-eloquent

### Laravel Execution Lifecycle
**Path:** knowledge/laravel-execution-lifecycle/
**Problems solved:** Application bootstrap, service container, service providers, request lifecycle, middleware pipeline, kernel architecture, dependency injection, boot order/timing, caching optimization, long-running processes
**Key subdomains:** application-bootstrap, service-container, service-providers, request-lifecycle, middleware-pipeline, kernel-architecture, dependency-injection, boot-order-timing, caching-optimization, long-running-processes
**Entry KUs:** Application Bootstrap, Service Container, Service Providers
**Related skills:** laravel-core-internals
**Related agents:** laravel-container

### Observability & Production Intelligence
**Path:** knowledge/observability-production-intelligence/
**Problems solved:** Logging, error tracking, APM, distributed tracing, metrics collection, health checks, dashboards, alerting/incident response
**Key subdomains:** 01-logging, 02-error-tracking, 03-apm-performance-monitoring, 04-distributed-tracing, 05-metrics-collection, 06-health-checks, 07-dashboards-visualization, 08-alerting-incident-response, 09-advanced-topics, 10-examples
**Entry KUs:** Logging, Error Tracking, Health Checks
**Related skills:** (none directly)
**Related agents:** (none directly)

### Performance & Runtime Engineering
**Path:** knowledge/performance-runtime-engineering/
**Problems solved:** PHP engine version performance, JIT compilation, OPcache configuration, memory management/GC, PHP-FPM worker management, alternative runtimes, Laravel Octane, benchmarking, profiling, deployment cache invalidation
**Key subdomains:** S01-php-engine-version-performance, S02-jit-compilation, S03-opcache-configuration, S04-memory-management-gc, S05-php-fpm-worker-management, S06-alternative-runtimes, S07-laravel-octane, S08-benchmarking-methodology, S09-profiling-observability, S10-deployment-cache-invalidation, Z0-enterprise-architecture
**Entry KUs:** PHP Engine Performance, OPcache Configuration, Laravel Octane
**Related skills:** (none directly)
**Related agents:** (none directly)

### Platform Engineering & Developer Experience
**Path:** knowledge/platform-engineering-developer-experience/
**Problems solved:** Internal developer platforms, package development, monorepo management, developer tooling, code quality, code generation, development environments, workflow automation, onboarding/standards, CLI tooling
**Key subdomains:** 01-internal-developer-platforms, 02-package-development, 03-monorepo-management, 04-developer-tooling, 05-code-quality, 06-code-generation, 07-development-environments, 08-workflow-automation, 09-onboarding-and-standards, 10-cli-tooling
**Entry KUs:** Package Development, Code Quality, Developer Tooling
**Related skills:** (none directly)
**Related agents:** laravel-artisan

### Real-Time Systems
**Path:** knowledge/real-time-systems/
**Problems solved:** Broadcasting architecture, Laravel Echo, channels, SSE, transport comparison, real-time notifications, real-time dashboards, collaborative editing, scaling, deployment, monitoring, testing
**Key subdomains:** 01-broadcasting-architecture, 03-laravel-echo, 04-channels, 06-sse-server-sent-events, 07-transport-comparison, 08-real-time-notifications, 09-real-time-dashboards, 10-collaborative-editing, 11-scaling-production, 12-deployment, 13-monitoring-observability, 14-testing, 15-advanced-patterns, websocket-servers, security
**Entry KUs:** Broadcasting Architecture, Laravel Echo, Channel Types
**Related skills:** (none directly)
**Related agents:** (none directly)

### Search & Retrieval Systems
**Path:** knowledge/search-retrieval-systems/
**Problems solved:** Laravel Scout, database fulltext search, Meilisearch, Algolia, Typesense, vector search, hybrid search, relevance/ranking, search UX/analytics, synonym management, search caching, real-time indexing, search performance, RAG pipelines
**Key subdomains:** 01-laravel-scout-foundation, 02-database-fulltext-search, 03-meilisearch, 04-algolia, 05-typesense, 06-vector-search-systems, 07-hybrid-search, 08-relevance-and-ranking, 09-search-ux-and-analytics, 10-synonym-and-typology-management, 11-search-caching, 12-real-time-indexing, 13-search-performance, 14-rag-search-pipelines, 15-search-operations, 16-search-system-decision-guides
**Entry KUs:** Laravel Scout Foundation, Database Fulltext Search, Meilisearch Integration
**Related skills:** (none directly)
**Related agents:** (none directly)

### Security & Identity Engineering
**Path:** knowledge/security-identity-engineering/
**Problems solved:** Authentication (Sanctum, Passport), authorization (policies, gates), hardening, threat mitigation, secrets management, audit logging, multi-tenancy
**Key subdomains:** 01-authentication, 02-authorization, 03-hardening, 04-threat-mitigation, 05-secrets, 06-audit-logging, 07-multi-tenancy
**Entry KUs:** Authentication, Authorization, Hardening
**Related skills:** laravel-security, laravel-authentication
**Related agents:** laravel-authentication, laravel-identity-architecture

### Testing & Reliability Engineering
**Path:** knowledge/testing-reliability-engineering/
**Problems solved:** Core testing concepts, feature/HTTP testing, database testing, unit testing, mocking/fakes, browser/E2E testing, architecture testing, mutation testing, snapshot testing, performance/load testing, resilience/chaos engineering, accessibility testing, contract testing, CI/CD pipeline, flaky test prevention, test organization, test data management
**Key subdomains:** 1-core-concepts, 2-feature-http-testing, 3-database-testing, 4-unit-testing, 5-mocking-fakes, 6-browser-e2e-testing, 7-architecture-testing, 8-mutation-testing, 9-snapshot-testing, 10-performance-load-testing, 11-resilience-chaos-engineering, 12-accessibility-testing, 13-contract-testing, 14-ci-cd-pipeline, 15-flaky-test-prevention, 16-test-organization, 17-test-data-management, 18-advanced-techniques, 19-query-performance-diagnostics, 20-migration-guides
**Entry KUs:** Core Concepts, Feature Testing, Database Testing
**Related skills:** laravel-tdd
**Related agents:** (none directly)
