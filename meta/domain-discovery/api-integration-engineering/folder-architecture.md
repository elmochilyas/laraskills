# Domain Knowledge Folder Architecture: API Integration Engineering

```
api-integration-engineering/
│
├── README.md
│   # Domain overview, scope, quick-start links to key resources
│
├── 01-foundations/
│   ├── http-client-basics.md
│   │   # Laravel Http facade, Guzzle internals, PSR-18/PSR-7
│   │   # Retry, timeout, middleware stack, macros, fake testing
│   │
│   ├── service-layer-patterns.md
│   │   # Service classes, repository pattern, action classes
│   │   # DTO vs Resource patterns, data transformation
│   │
│   ├── authentication-flows.md
│   │   # Bearer tokens, Basic/Digest auth, API key strategies
│   │   # OAuth2 client credentials, PKCE, refresh tokens
│   │   # Saloon authentication plugins
│   │
│   └── error-handling.md
│       # Response status mapping, exception taxonomy
│       # Graceful degradation, fallback responses
│       # Client vs server error differentiation
│
├── 02-saloonphp/
│   ├── getting-started.md
│   │   # Installation, Connector setup, Request definition
│   │   # Laravel plugin integration (Telescope, Pulse)
│   │
│   ├── connectors.md
│   │   # Base URL, default headers, config/timeout
│   │   # Authentication, middleware, custom send methods
│   │
│   ├── requests.md
│   │   # Method, endpoint, body, query params, headers
│   │   # Request DTOs, data casting, body types
│   │
│   ├── responses.md
│   │   # Response objects, DTO casting, error handling
│   │   # Custom response classes
│   │
│   ├── plugins/
│   │   ├── caching.md
│   │   │   # Cache plugin config, TTL, cache invalidation
│   │   │
│   │   ├── rate-limiting.md
│   │   │   # Rate limit plugin, limit stores, backpressure
│   │   │
│   │   ├── pagination.md
│   │   │   # Cursor pagination, page-based, offset-based
│   │   │   # Custom paginator implementations
│   │   │
│   │   ├── oauth2.md
│   │   │   # Client credentials, authorization code
│   │   │   # Token refresh, grant customization
│   │   │
│   │   └── dto.md
│   │       # Data Transfer Object plugin, data mapping
│   │
│   ├── concurrency.md
│   │   # Pool requests, async/await patterns
│   │   # Response collection and aggregation
│   │
│   ├── testing.md
│   │   # Request recording, fixture replay
│   │   # Fake responses, response sequences
│   │
│   └── building-sdks.md
│       # SDK structure, versioning, distribution
│       # OpenAPI generation, connector factories
│
├── 03-webhooks/
│   ├── overview.md
│   │   # Webhook fundamentals, delivery models
│   │   # At-least-once vs exactly-once semantics
│   │
│   ├── incoming/
│   │   ├── spatie-webhook-client.md
│   │   │   # Installation, config, route registration
│   │   │   # CSRF bypass, signature validation
│   │   │   # Webhook profiles, event filtering
│   │   │   # Queued job processing, response customization
│   │   │
│   │   ├── signature-verification.md
│   │   │   # HMAC-SHA256 validation, timing-safe comparison
│   │   │   # Custom SignatureValidator implementation
│   │   │   # Non-standard provider signatures
│   │   │
│   │   ├── replay-protection.md
│   │   │   # Timestamp validation, tolerance windows
│   │   │   # Nonce/idempotency key deduplication
│   │   │   # Replay attack prevention strategies
│   │   │
│   │   ├── custom-receivers.md
│   │   │   # Stripe, GitHub, Slack, Shopify patterns
│   │   │   # Provider-specific signature implementations
│   │   │
│   │   └── processing-patterns.md
│   │       # Queue-first architecture, job design
│   │       # Transaction safety, error handling
│   │       # Rate limiting on receiving endpoints
│   │
│   └── outgoing/
│       ├── spatie-webhook-server.md
│       │   # Installation, config, WebhookCall dispatch
│       │   # Payload formatting, URL configuration
│       │
│       ├── signing.md
│       │   # HMAC signing, custom signer interface
│       │   # Signature header naming conventions
│       │
│       ├── retry-and-backoff.md
│       │   # Retry attempt configuration
│       │   # Exponential backoff strategy, customization
│       │   # FinalWebhookCallFailedEvent handling
│       │   # Dashboard/manual retry support
│       │
│       └── delivery-tracking.md
│           # Delivery logs, attempt history
│           # Success/failure callbacks
│           # Webhook endpoint health monitoring
│
├── 04-resilience/
│   ├── circuit-breaker/
│   │   ├── concepts.md
│   │   │   # Closed/Open/Half-Open states, thresholds
│   │   │   # Failure counting, time windows
│   │   │
│   │   ├── sync-circuit-breaker.md
│   │   │   # algoyounes/circuit-breaker package
│   │   │   # Named circuits, lifecycle callbacks
│   │   │   # Guzzle middleware integration
│   │   │   # CircuitManager usage patterns
│   │   │
│   │   └── queue-circuit-breaker.md
│   │       # harris21/laravel-fuse package
│   │       # Queue job middleware, failure rate tracking
│   │       # Auto half-open probe, job release strategy
│   │
│   ├── rate-limiting/
│   │   ├── strategies.md
│   │   │   # Token bucket, sliding window, fixed window
│   │   │   # Redis-backed limit stores
│   │   │   # Per-service vs global limit buckets
│   │   │
│   │   ├── 429-handling.md
│   │   │   # Rate limit detection, Retry-After header parsing
│   │   │   # Backpressure and queuing strategies
│   │   │   # Saloon rate limit plugin usage
│   │   │
│   │   └── queue-based-throttling.md
│   │       # Batched API calls via queue jobs
│   │       # Laravel Cache::lock for distributed throttling
│   │       # Job batching and chunked processing
│   │
│   ├── retry-strategies/
│   │   ├── patterns.md
│   │   │   # Fixed interval, exponential backoff, jitter
│   │   │   # Retry budget, max attempts, circuit breaker integration
│   │   │
│   │   └── laravel-retry.md
│   │       # Http::retry() usage and limitations
│   │       # Queue job retry ($tries, backoff, maxExceptions)
│   │       # Custom retry middleware for HTTP client
│   │       # Retry decision logic (retriable vs non-retriable errors)
│   │
│   └── idempotency/
│       ├── concepts.md
│       │   # HTTP method idempotency (GET/PUT/DELETE vs POST/PATCH)
│       │   # Idempotency-Key header standard
│       │   # UUID v4 key generation, storage, TTL
│       │
│       ├── square1-laravel-idempotency.md
│       │   # Middleware-driven, cache-backed, lock-based concurrency
│       │   # Configuration, enforced verbs, duplicate behavior
│       │
│       ├── infinitypaul-idempotency.md
│       │   # Robust cache, distributed locks, telemetry
│       │   # Alert system, payload validation
│       │
│       └── custom-implementation.md
│           # Middleware from scratch, DB unique constraints
│           # Redis storage, response caching
│           # Concurrency control patterns
│
├── 05-api-versioning/
│   ├── strategies.md
│   │   # URI path, header, query parameter, Accept header
│   │   # Trade-offs and scenario appropriateness
│   │
│   ├── lifecycle-management.md
│   │   # Active → Deprecated → Sunset → Removed
│   │   # RFC 8594 Deprecation, RFC 7231 Sunset headers
│   │   # Migration windows, backward compatibility guarantees
│   │
│   └── laravel-apiroute.md
│       # Grazulex/laravel-apiroute package
│       # Multi-strategy configuration
│       # Artisan commands, analytics, fallback
│       # Version-specific controllers and routes
│
├── 06-integration-architecture/
│   ├── gateway-pattern.md
│   │   # API gateway for external services abstraction
│   │   # Request transformation, protocol bridging
│   │   # Aggregation, fan-out, response composition
│   │   # Laravel as headless orchestrator
│   │
│   ├── service-modules.md
│   │   # Module-based integration architecture
│   │   # Repository + Factory + DTO composition
│   │   # Per-service package structure
│   │
│   ├── event-driven-integration.md
│   │   # Webhook event sourcing with spatie/laravel-event-sourcing
│   │   # Projectors for delivery views, Reactors for side effects
│   │   # CQRS for integration read/write models
│   │   # Event versioning and replay capability
│   │
│   └── multi-tenant-integrations.md
│       # Per-tenant API credentials, isolated connections
│       # Tenant-aware rate limiting and circuit breakers
│       # Secret management, encryption at rest
│
├── 07-observability/
│   ├── logging.md
│   │   # Integration audit trails, payload logging
│   │   # Structured logging, log channels per integration
│   │   # Sensitive data redaction
│   │
│   ├── monitoring.md
│   │   # Laravel Pulse integration cards
│   │   # Horizon queue monitoring for webhook jobs
│   │   # Telescope debugging for HTTP calls
│   │   # Custom health checks per integration
│   │
│   ├── alerting.md
│   │   # Failed webhook notification strategies
│   │   # Circuit breaker state change alerts
│   │   # Rate limit headroom warnings
│   │   # Delivery latency threshold alerts
│   │
│   └── dashboard.md
│       # Webhook delivery log viewer (UI)
│       # Manual retry capabilities
│       # Integration health status page
│
├── 08-sdk-generation/
│   ├── manual-sdk-build.md
│   │   # Structuring SDKs with Saloon
│   │   # Package distribution, versioning
│   │   # Documentation generation
│   │
│   ├── openapi-generation.md
│   │   # OpenAPI spec import/export
│   │   # Auto-generating from Postman collections
│   │   # Speakeasy, Fern, and other generators
│   │
│   └── testing-sdks.md
│       # Contract testing, integration tests
│       # Mock server patterns, sandbox environments
│       # CI/CD pipeline for SDK releases
│
├── 09-package-landscape/
│   ├── comparison-matrix.md
│   │   # SaloonPHP vs raw Guzzle vs Http facade vs vendor SDKs
│   │   # Webhook packages comparison (Spatie, custom, gateway services)
│   │   # Circuit breaker packages (algoyounes, Fuse, custom)
│   │   # Idempotency packages (square1, infinitypaul, custom)
│   │   # Versioning packages (laravel-apiroute, custom)
│   │
│   ├── dependency-management.md
│   │   # composer.json version constraints
│   │   # Package interoperability, version conflicts
│   │   # Laravel version compatibility matrices
│   │
│   └── migration-guides/
│       ├── v3-to-v4-saloon.md
│       ├── circuit-breaker-addition.md
│       ├── http-facade-to-saloon.md
│       └── inline-to-service-module.md
│
├── 10-case-studies/
│   ├── stripe-integration.md
│   │   # Payment webhooks, idempotent API calls
│   │   # Custom SignatureValidator, retry handling
│   │
│   ├── github-webhooks.md
│   │   # Event types, HMAC verification
│   │   # Event-driven processing with Laravel events
│   │
│   ├── payment-gateway-aggregator.md
│   │   # Multi-provider abstraction
│   │   # Circuit breaker per provider
│   │   # Rate limiting per gateway
│   │
│   └── saas-integration-marketplace.md
│       # Third-party app integrations architecture
│       # Tenant-aware webhook management
│       # OAuth2 installation flows
│
└── emerging-topics/
    ├── ai-llm-integrations.md
    │   # Streaming responses, token-aware rate limits
    │   # SSE parsing, function calling patterns
    │   # Laravel AI SDK integration
    │
    ├── webhook-gateways.md
    │   # Convoy, Svix, and managed webhook infrastructure
    │   # Self-hosted vs managed decision framework
    │
    ├── standard-webhooks.md
    │   # standardwebhooks.com specification
    │   # Signature format, retry semantics, metadata envelopes
    │
    ├── graphql-integration.md
    │   # Consuming GraphQL, query builders, typed responses
    │   # Batching and caching patterns
    │
    ├── grpc-integration.md
    │   # PHP gRPC extension, protobuf definitions
    │   # Streaming RPCs, bidirectional patterns
    │
    └── fintech-patterns.md
        # Stripe/Adyen integration patterns
        # Webhook SLAs, SLOs, business continuity
        # Payment reconciliation via webhooks
```

### Explanation

- **01-foundations/**: Core HTTP client and service layer knowledge required before any integration work
- **02-saloonphp/**: Complete SaloonPHP coverage including all plugins and SDK building
- **03-webhooks/**: Split into incoming (receiving) and outgoing (sending), with Spatie packages as core
- **04-resilience/**: All reliability patterns (circuit breaker, rate limiting, retry, idempotency)
- **05-api-versioning/**: Strategies and lifecycle management tooling
- **06-integration-architecture/**: Higher-level patterns (gateway, event sourcing, multi-tenant)
- **07-observability/**: Monitoring, logging, alerting infrastructure for integrations
- **08-sdk-generation/**: Building and distributing API client SDKs
- **09-package-landscape/**: Decision matrices and migration guides between packages
- **10-case-studies/**: Real-world integration patterns from known providers
- **emerging-topics/**: Forward-looking knowledge areas (AI, gateways, gRPC, fintech)

Each document should follow a consistent structure: overview, implementation steps, code examples, configuration reference, testing patterns, and known pitfalls.
