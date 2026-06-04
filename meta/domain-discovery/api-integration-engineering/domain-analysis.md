# Phase 1 Domain Discovery: API Integration Engineering

## Domain Overview

API Integration Engineering is the discipline of designing, building, and maintaining reliable communication channels between software systems via their public APIs and webhook interfaces. Within the Laravel ecosystem, this domain encompasses consuming external HTTP APIs (REST, GraphQL, SOAP), exposing webhook receivers, sending webhooks to downstream systems, and implementing the resilience patterns (retry, circuit breaker, rate limiting, idempotency) required to operate integrations safely in production. The domain has matured significantly with Laravel's built-in HTTP client (Guzzle wrapper), packages like SaloonPHP (structured API client SDKs), and Spatie's webhook client/server packages forming the de facto standard toolchain.

## Domain Scope

**In Scope:**
- External API consumption via HTTP clients (Guzzle, Laravel Http facade, SaloonPHP)
- Webhook receiver implementation (signature verification, payload validation, async processing)
- Webhook sender/dispatcher implementation (signing, retry, backoff strategies)
- Rate limiting for outbound API calls (token bucket, sliding window, Redis-backed)
- Circuit breaker patterns for downstream service protection
- API versioning strategies (URI, header, query param, Accept header)
- Idempotency key implementation for safe retries
- API client SDK design (Connector/Request patterns, DTOs, service classes)
- Error handling and observability for integrations
- Event sourcing for webhook delivery audit trails

**Out of Scope:**
- Building first-party REST APIs (covered in API Development domain)
- Database-level event sourcing for business logic (covered in Event-Driven Architecture)
- Message queue/broker infrastructure (covered in Infrastructure Engineering)
- Frontend API consumption patterns
- API security at the network layer (WAF, DDoS protection)
- GraphQL server implementations

## Major Subdomains

### 1. HTTP Client & API Consumption Patterns
- Laravel's Http facade (macroable, pool/async, retry, timeout, middleware)
- Guzzle integration and customization (handlers, middleware stack)
- Service layer abstraction (service classes, connectors, repositories)
- Authentication flows (Bearer tokens, OAuth2, Basic/Digest, API keys)
- Response handling and error mapping
- Concurrent/pooled requests
- Testing/faking API responses

### 2. Webhook Systems (Incoming)
- Endpoint registration (CSRF exemption, route macros)
- Signature verification (HMAC-SHA256, custom validators)
- Payload storage and integrity checking
- Queue-first processing architecture
- Webhook profiles and event filtering
- Idempotent event handling
- Replay attack prevention (timestamp validation, nonce)

### 3. Webhook Systems (Outgoing)
- Webhook call dispatch and payload formatting
- HMAC signing and signature header injection
- Retry with exponential backoff
- Delivery attempt tracking and final failure events
- Backoff strategy customization (linear, exponential, jitter)
- Webhook endpoint health monitoring

### 4. Resilience & Reliability Patterns
- Circuit breaker (3-state: closed/open/half-open)
- Retry strategies (fixed interval, exponential backoff, jitter)
- Rate limit handling (HTTP 429 detection, backpressure, queuing)
- Bulkhead pattern (isolated connection pools per service)
- Timeout configuration and cascading failure prevention
- Fail-fast vs failover semantics

### 5. Idempotency & Data Consistency
- Idempotency key generation and header passing
- Server-side deduplication (cache-first, DB unique constraints)
- Concurrency control (distributed locking, optimistic locking)
- Idempotency key TTL and storage backends (Redis, DB)
- Response caching for repeated identical requests
- Webhook delivery deduplication

### 6. API Versioning & Compatibility
- URI path versioning (`/v1/`, `/v2/`)
- Header-based versioning (`Accept: application/vnd.api+json;version=2`)
- Query parameter versioning
- Deprecation lifecycle management (RFC 8594 Deprecation, RFC 7231 Sunset)
- Backward compatibility enforcement (additive-only changes)
- Changelog and migration documentation

### 7. API Client SDK Design
- Connector pattern (base URL, default headers, auth)
- Request objects (method, endpoint, body, query params)
- Response DTOs and typed data structures
- Authentication plugins (Bearer, OAuth2, custom)
- Pagination handling (cursor, page-based, offset)
- Caching layer (response caching per endpoint)
- Error handling and exception taxonomy
- SDK generation from OpenAPI specs

### 8. Observability & Monitoring
- Integration health checks and ping endpoints
- Delivery logging and audit trails
- Failure alerting and notification
- Rate limit headroom monitoring
- Circuit breaker state visualization
- Webhook delivery tracking (attempts, successes, failures)

### 9. Event Sourcing for Integrations
- Event store for webhook deliveries
- Projectors for delivery status views
- Reactors for post-delivery side effects
- Replay capability for failed webhooks
- CQRS separation for read/write models
- Event versioning for evolving payloads

## Complete Knowledge Inventory

### Tier 1: Core Knowledge (Critical, Foundational)

| ID | Knowledge Item | Source | Confidence |
|---|---|---|---|
| K001 | Laravel Http facade API (get, post, put, patch, delete, pool, concurrent) | Laravel Docs | High |
| K002 | Guzzle HTTP client internals (middleware stack, handlers, PSR-18) | Guzzle Docs | High |
| K003 | HMAC-SHA256 webhook signature generation and verification | Spatie Packages | High |
| K004 | Service class pattern for API encapsulation | Laravel Community | High |
| K005 | Retry strategies (fixed, exponential, jitter) | AWS/GCP Docs, Stripe | High |
| K006 | Idempotency key pattern (Idempotency-Key header, UUID v4) | Stripe API, IETF | High |
| K007 | Circuit breaker pattern (3 states, failure thresholds, half-open probes) | Michael Nygard (Release It!) | High |
| K008 | Rate limiting algorithms (token bucket, sliding window, fixed window) | Redis, Kong, AWS Docs | High |
| K009 | API versioning strategies and lifecycle management | REST API Guidelines | High |
| K010 | SaloonPHP Connector/Request/Response pattern | Saloon Docs | High |

### Tier 2: Important Knowledge

| ID | Knowledge Item | Source | Confidence |
|---|---|---|---|
| K011 | Spatie laravel-webhook-client configuration and customization | Spatie Docs | High |
| K012 | Spatie laravel-webhook-server dispatch and retry customization | Spatie Docs | High |
| K013 | Laravel queue integration for async webhook processing | Laravel Docs | High |
| K014 | OAuth2 client credentials flow for server-to-server auth | OAuth2 RFC | High |
| K015 | Response caching strategies for API calls (Cache facade, Redis) | Laravel Docs | High |
| K016 | DTOs vs Resources pattern for data transformation | Laravel Community | Medium |
| K017 | Concurrency control with pools and async requests | Laravel Docs | High |
| K018 | Webhook payload storage and audit trail design | Industry Practice | Medium |
| K019 | Exponential backoff customization in Spatie webhook-server | Spatie Package | High |
| K020 | CSRF bypass and route configuration for webhook endpoints | Laravel Docs | High |

### Tier 3: Specialized Knowledge

| ID | Knowledge Item | Source | Confidence |
|---|---|---|---|
| K021 | Custom signature validator implementation for non-standard webhooks | Spatie Docs | High |
| K022 | Replay attack prevention (timestamp + nonce windows) | Security Practice | Medium |
| K023 | Grazulex/laravel-apiroute versioning lifecycle package | GitHub | Medium |
| K024 | Circuit breaker integration with queue jobs (Laravel Fuse) | Laravel News, Fuse Docs | Medium |
| K025 | Rate limit plugin for SaloonPHP | Saloon Docs | Medium |
| K026 | Cache plugin for SaloonPHP | Saloon Docs | Medium |
| K027 | Pagination plugin for SaloonPHP (cursor, page, offset) | Saloon Docs | Medium |
| K028 | Laravel Horizon monitoring for integration queues | Laravel Docs | High |
| K029 | Laravel Telescope debugging for HTTP client calls | Laravel Docs | High |
| K030 | OpenAPI/Swagger documentation generation from Laravel | Scribe, l5-swagger | Medium |

### Tier 4: Emerging/Future Knowledge

| ID | Knowledge Item | Source | Confidence |
|---|---|---|---|
| K031 | AI/LLM API integration patterns (streaming, SSE, tool calling) | Industry Trends | Low |
| K032 | Webhook gateway services (Convoy, Svix) vs self-hosted patterns | Vendor Docs | Low |
| K033 | API mesh and service mesh integration patterns | Istio, Linkerd | Low |
| K034 | Event-driven architecture with webhook event sourcing (CQRS/ES) | Spatie Course | Medium |
| K035 | Standard Webhooks specification (signature format, retry, metadata) | standardwebhooks.com | Low |
| K036 | gRPC API integration with PHP | gRPC Docs | Low |
| K037 | Fintech-grade webhook SLAs and SLOs (Stripe, Adyen patterns) | Industry Standards | Low |
| K038 | API client SDK auto-generation from OpenAPI | Postman, Speakeasy | Low |

## Knowledge Classification

### By Criticality
- **Mission-Critical (must know for production):** K001-K010, K013, K015, K018, K020
- **Important (needed for robustness):** K011-K012, K014, K016-K017, K019, K021-K022
- **Nice-to-Have (optimization/scaling):** K023-K029
- **Forward-Looking (R&D):** K030-K038

### By Maturity
- **Mature/Stable:** K001-K015, K018-K020 (well-documented, widely adopted)
- **Growing:** K010 (SaloonPHP v4 gaining adoption), K016 (DTO pattern maturity)
- **Niche:** K023-K027 (specific package knowledge)
- **Emerging:** K031-K038 (limited production track record)

## Dependency Map

```
API Integration Engineering
│
├── HTTP Client Layer
│   ├── Guzzle (underlying transport)
│   │   └── PSR-18, PSR-7, PSR-17
│   ├── Laravel Http Facade (macro, pool, fake)
│   │   └── Retry, Timeout, Middleware
│   └── SaloonPHP (structured client)
│       ├── Connector, Request, Response
│       ├── Plugins (Cache, Rate Limit, Pagination, OAuth2, DTO)
│       └── Laravel Plugin (Pulse, Telescope integration)
│
├── Resilience Layer
│   ├── Retry Engine
│   │   ├── Laravel Http retry()
│   │   ├── Saloon retry plugin
│   │   └── Custom backoff strategies
│   ├── Circuit Breaker
│   │   ├── algoyounes/circuit-breaker
│   │   └── harris21/laravel-fuse (queue jobs)
│   ├── Rate Limiter
│   │   ├── Laravel Cache::lock (Redis)
│   │   ├── Saloon rate limit plugin
│   │   └── Token bucket implementations
│   └── Idempotency
│       ├── square1-io/laravel-idempotency
│       ├── infinitypaul/idempotency-laravel
│       └── Custom middleware implementations
│
├── Webhook Layer
│   ├── Incoming
│   │   ├── spatie/laravel-webhook-client
│   │   │   ├── Signature validation
│   │   │   ├── Webhook profiles
│   │   │   ├── Queued job processing
│   │   │   └── Response customization
│   │   └── Custom receivers (Stripe, GitHub, etc.)
│   ├── Outgoing
│   │   ├── spatie/laravel-webhook-server
│   │   │   ├── HMAC signing
│   │   │   ├── Retry/backoff
│   │   │   └── Event dispatching
│   │   └── Custom dispatchers
│   └── Webhook Gateways (emerging)
│       ├── Convoy
│       └── Svix
│
├── Data Layer
│   ├── DTOs (Data Transfer Objects)
│   ├── API Resources (JsonResource)
│   ├── Response Caching (Redis, Cache)
│   └── Event Store (spatie/laravel-event-sourcing)
│       ├── Projectors
│       ├── Reactors
│       └── Aggregate Roots
│
├── Observability Layer
│   ├── Laravel Telescope (HTTP client debugging)
│   ├── Laravel Horizon (queue monitoring)
│   ├── Laravel Pulse (integration health)
│   ├── Custom logging (integration audit trail)
│   └── Alerting (failed webhooks, circuit breaker trips)
│
└── Versioning & SDK Layer
    ├── API Versioning (URI/header/query)
    │   └── Grazulex/laravel-apiroute
    └── SDK Generation
        ├── Manual (Saloon-based)
        └── Auto-generated (OpenAPI-based)
```

## Missing Knowledge Risk Analysis

| Knowledge Gap | Risk Level | Impact | Mitigation |
|---|---|---|---|
| Guzzle middleware stack internals | Medium | Inability to customize low-level HTTP behavior (logging, retry, auth injection) | Study PSR-18 and Guzzle handler stack docs |
| SaloonPHP v3-to-v4 breaking changes | High | Project upgrades may break if migration path unknown | Read Saloon v4 upgrade guide; pin versions |
| Webhook signature edge cases (non-standard providers) | Medium | Failed integrations with providers that use custom signing (e.g., Tookan, GitHub) | Implement custom SignatureValidator per provider |
| Distributed lock mechanics for idempotency | Medium | Race conditions under concurrent webhook delivery | Study Redis Redlock, Laravel Cache::lock |
| OAuth2 client credentials with PKCE | Low | Unable to integrate OAuth2-only APIs | Study OAuth2 RFC 6749, Saloon OAuth2 plugin |
| gRPC integration from PHP | Low (long tail) | Cannot integrate gRPC-first APIs | Consider gRPC PHP extension or proxy bridge |
| Webhook gateway (Convoy/Svix) patterns | Low (emerging) | Premature adoption of unproven architecture | Monitor market; keep self-hosted fallback |
| Event sourcing for webhook audit trails | Medium | Lack of replay capability for failed webhooks | Prototype with spatie/laravel-event-sourcing |
| AI/LLM streaming API integration | Medium (growing) | Cannot build AI-powered integrations | Study Server-Sent Events (SSE), streaming HTTP |
| Standard Webhooks spec adoption | Low | Interoperability gaps with providers | Track standardwebhooks.com specification updates |

## Research Findings

### Key Finding 1: SaloonPHP Has Become the De Facto Standard
SaloonPHP v4 is the dominant structured API integration framework in the Laravel ecosystem. Its Connector/Request pattern provides a clean, testable abstraction. The Laravel plugin integrates with Telescope, Pulse, and Horizon. The ecosystem of plugins (Cache, Rate Limit, Pagination, OAuth2, DTO) covers most integration needs.

### Key Finding 2: Spatie's Webhook Packages Are the Default Choice
`spatie/laravel-webhook-client` and `spatie/laravel-webhook-server` form the standard webhook toolchain. Key features: HMAC-SHA256 signing, configurable signature validation, queue-first processing, exponential backoff with configurable strategies, profile-based event filtering, webhook_calls storage table.

### Key Finding 3: Circuit Breaker for Queue Jobs Is an Emerging Pattern
The `harris21/laravel-fuse` package (released at Laracon India 2026) solves the specific problem of queue workers grinding to a halt when external services fail. Before Fuse, circuit breaker packages existed (algoyounes/circuit-breaker) but targeted synchronous calls only.

### Key Finding 4: Idempotency Has Mature Package Support
Two notable packages address idempotency in Laravel: `square1-io/laravel-idempotency` (cache-based, lock-backed concurrency control, middleware-driven) and `infinitypaul/idempotency-laravel` (similar pattern with telemetry). Both follow Stripe's Idempotency-Key header pattern.

### Key Finding 5: API Versioning Lifecycle Management Is Now Tooled
`Grazulex/laravel-apiroute` provides complete version lifecycle management with RFC 8594 (Deprecation) and RFC 7231 (Sunset) header compliance, multi-strategy versioning (URI, header, query, Accept), and Artisan commands for version management.

### Key Finding 6: Direct Inline API Calls in Controllers Remain a Major Antipattern
Multiple sources converge on the same recommendation: API calls should never be made directly in controllers. The recommended patterns are queue jobs (for async/background), service classes (for synchronous), and Saloon connectors (for structured, testable integrations).

### Key Finding 7: Webhook Security Best Practices Are Well-Defined
The security model for webhooks is established: raw-body HMAC-SHA256 verification, timestamp validation for replay prevention, timing-safe comparison (hash_equals), idempotency key deduplication, queue-first processing (respond 200 fast, process async), and rate limiting on receiving endpoints.

### Key Finding 8: Laravel HTTP Client Testing Is Comprehensive
The `Http::fake()` method allows stubbing responses for any URL pattern, with support for response sequences, status codes, headers, and body content. Saloon extends this with request recording for accurate test fixtures.

## Future Expansion Opportunities

1. **AI/LLM Integration Patterns** - Streaming HTTP responses, SSE parsing, token-aware rate limiting, and tool-calling integration with Laravel's AI SDK
2. **Webhook Gateway Services** - Managed webhook infrastructure (Convoy, Svix) with fan-out, retry, and observability features replacing self-hosted solutions
3. **Standard Webhooks Specification** - Industry-wide webhook standard (signature format, retry-After header, metadata envelope) gaining adoption
4. **GraphQL API Integration** - Consuming GraphQL APIs with query builders and typed responses
5. **gRPC Integration** - PHP gRPC extension maturing for high-performance RPC integrations
6. **OpenAPI/SDK Generation** - Auto-generating Laravel API client SDKs from OpenAPI specs using Speakeasy, Postman, or similar tools
7. **Event Sourcing for Integrations** - Full replay capability, delivery audit trails, and CQRS separation for high-reliability webhook delivery
8. **Multi-tenant Integration Isolation** - Per-tenant API credentials, rate limit buckets, and circuit breakers in SaaS platforms
9. **Webhook UI Management** - Admin panels for managing webhook endpoints, viewing delivery logs, manual retry, and secret rotation
10. **Integration Health Dashboards** - Real-time visibility into API latency, error rates, rate limit headroom, and circuit breaker states

## Sources Consulted

### Tier 1: Primary Sources
- Laravel 13.x HTTP Client Documentation (laravel.com/docs/13.x/http-client)
- SaloonPHP Official Documentation (docs.saloon.dev)
- Spatie laravel-webhook-client GitHub Repository (github.com/spatie/laravel-webhook-client)
- Spatie laravel-webhook-server GitHub Repository (github.com/spatie/laravel-webhook-server)
- Laravel Fuse Circuit Breaker Package (harris21/laravel-fuse)
- algoyounes/circuit-breaker Package (github.com/algoyounes/circuit-breaker)
- square1-io/laravel-idempotency Package (github.com/square1-io/laravel-idempotency)
- infinitypaul/idempotency-laravel Package (github.com/infinitypaul/idempotency-laravel)
- Grazulex/laravel-apiroute Package (github.com/Grazulex/laravel-apiroute)

### Tier 2: Official Documentation & Standards
- Guzzle HTTP Client Documentation (docs.guzzlephp.org)
- Stripe Idempotent Requests API Reference (docs.stripe.com/api/idempotent_requests)
- RESTful Web API Design (Microsoft Azure Architecture Center)
- OAuth2 RFC 6749 / OpenID Connect
- RFC 8594 (Deprecation HTTP Header)
- RFC 7231 (Sunset HTTP Header)
- Stripe Webhook Retry Schedule Documentation
- Laravel Horizon Documentation
- Laravel Telescope Documentation

### Tier 3: Community Resources & Articles
- "Laravel API Integration with Third Party Services: The 2026 Enterprise Guide" - Larasoft
- "Simplify External API Integrations in Laravel Using Service Modules" - Shreif ElAgamy
- "How to Integrate and Consume an API in Laravel" - Sospeter Mong'are (dev.to)
- "Laravel HTTP Client: Best Practices & Features" - Dev Talk
- "Laravel API Development: Production-Ready Best Practices" - Hafiz.dev
- "Laravel API Best Practices: Security, Versioning & Performance" - Zestminds
- "Saloon vs Guzzle vs SDK vs Http Facade for Laravel API Integration" - Ash Allen
- "API Integration Best Practices Guide 2026" - Springverify
- "API Retry Mechanism: How It Works + Best Practices" - BoldSign
- "API Throttling: Algorithms, Patterns & Mistakes" - Redis Blog
- "Webhook Best Practices: Retry Logic, Idempotency, and Error Handling" - Henry Hang (dev.to)
- "How to Implement Webhooks in Laravel" - OneUptime
- "Webhook Signature Verification in Laravel" - Gun Gun Priatna (QadrLabs)
- "Sending and Receiving Webhooks in Laravel Apps" - Freek Van der Herten
- "Webhook Integration Patterns: From Direct Processing to Event-Driven Architecture" - WebhookVault
- "Webhook Event Handling: Best Practices, Patterns & Examples" - DocsForDevs
- "Webhook Idempotency Patterns: Preventing Duplicate Processing" - HookWatch
- "Protecting Webhooks in Laravel Applications From Replay Attacks" - Aaron Eisenberg
- "Idempotency Keys for Resilient API Integrations" - Didit
- "Building a Production-Ready Webhook System for Laravel" - Reddit r/PHP
- "Idempotency - what is it, and how can it help our Laravel APIs?" - Paul Conroy

### Tier 4: Books & Courses
- "Consuming APIs In Laravel" (Book) - Ash Allen, 440+ pages
- "Clean Code in Laravel" (Book) - mayahi.net
- "Event Sourcing in Laravel" (Course) - Spatie / Brent Roose
- "Release It! Design and Deploy Production-Ready Software" (Book) - Michael Nygard
