# Domain Overview

API & CRUD System Engineering governs how Laravel applications expose data and operations to consumers through structured HTTP interfaces. This domain encompasses the entire API design and implementation lifecycle: REST architectural principles, CRUD system architecture patterns, request/response shaping, error standardization, versioning strategies, documentation, testing, and the governance rules that keep APIs consistent as they scale.

Unlike the "Laravel Core Application Engineering" domain — which covers framework mechanics (how routing, controllers, middleware, and API Resources work at the code level) — this domain covers system-level design decisions: what response shape to use, how to structure error messages, which versioning strategy fits the use case, how to document endpoints, and what rules the team agrees to follow so that every endpoint looks like it belongs to the same API.

This domain bridges the gap between framework features and production API practice. Laravel provides the tools (apiResource, FormRequest, JsonResource, JsonApiResource, RateLimiter). This domain provides the architectural framework for deploying those tools consistently at scale.

---

# Domain Scope

## What belongs in this domain

- REST API design principles and resource modeling
- CRUD architecture patterns (Controller, DTO, Action, Service, Repository, Resource layers)
- Resource controller design patterns and thin controller enforcement
- API versioning strategy selection and implementation
- Standard response structure design (envelopes, bare body, JSON:API, RFC 9457)
- Error response taxonomy, structure, and standardization
- API consistency rules and team governance patterns
- Pagination strategy design (offset, cursor, keyset)
- Input validation architecture for APIs (Form Requests, DTO validation)
- API authentication patterns (Sanctum vs Passport decision, API keys, token abilities)
- Rate limiting design at the API level
- API documentation generation and maintenance
- API contract testing and response shape testing
- Idempotency key design and implementation
- Bulk operation and batch endpoint design
- API deprecation lifecycle (Sunset headers, version removal)
- API-specific middleware design (ForceJson, CORS, request ID, response compression)
- Primary key strategy for APIs (UUID, ULID, auto-increment tradeoffs)
- Frontend/API contract negotiation patterns

## What does NOT belong in this domain

- Route definition mechanics (resourceful routing, route groups, route model binding) → Laravel Core Application Engineering
- Route model binding internals (implicit, explicit, scoped, enum) → Laravel Core Application Engineering
- API Resource class mechanics (toArray, whenLoaded, whenCounted) → Laravel Core Application Engineering
- Middleware pipeline mechanics (auth, throttle, bindings) → Laravel Core Application Engineering
- Eloquent model design, relationships, scopes, accessors → Laravel Eloquent & Domain Modeling
- Authentication provider internals (guards, user providers) → Security & Identity Engineering
- OAuth2 server implementation details → Security & Identity Engineering
- Database indexing, schema design, migration commands → Data & Storage Systems
- Queue job implementation, worker configuration → Async & Distributed Systems
- Deployment, server configuration, environment management → DevOps & Infrastructure
- GraphQL schema design, resolvers, subscriptions → separate GraphQL skills
- gRPC service definition, protobuf design → separate gRPC skills

---

# Major Subdomains

## 1. REST API Design

Core REST architectural principles applied to Laravel. Resource naming conventions, HTTP method semantics, correct status code usage, HATEOAS considerations, REST maturity model, and the tradeoffs of strict REST compliance vs pragmatic API design. This subdomain establishes the foundational design vocabulary for all other API work.

## 2. CRUD Architecture

The layered architecture pattern that separates HTTP handling from business logic. Controller delegation patterns, DTO design and construction, Action class isolation, Service orchestration, Repository abstraction, and the decision framework for when to use each layer. This subdomain defines how data flows from HTTP request to database and back.

## 3. Resource Controllers

Resource controller design patterns in Laravel. Multi-action resource controllers vs single-action invokable controllers, the thin controller principle, controller organization by version and domain, dependency injection strategies, controller-level middleware assignment, and the boundary between controller concerns and business logic concerns.

## 4. Response Structures

Standardized response shape design. Envelope vs bare body patterns, data wrapping, pagination metadata, top-level links and meta, sparse fieldsets, JSON:API compliance, RFC 9457 (Problem Details) for errors, and the decision framework for choosing a response format that matches the API's consumer profile.

## 5. Error Handling Design

System-level error response architecture. Error type taxonomy (operational, programmer, infrastructure), standardized error envelope design, domain-specific error codes, exception-to-code mapping strategies, validation error shapes, production-safe error rendering, error tracking integration, and the relationship between HTTP status codes and error semantics.

## 6. API Versioning

Versioning strategy selection and implementation. URL path versioning, header-based versioning, media type negotiation, controller inheritance patterns, resource class versioning, request class versioning, route file organization by version, deprecation header implementation (RFC 8594 Sunset, RFC 9745 Deprecation), and version lifecycle management.

## 7. Authentication & Authorization for APIs

API-specific authentication patterns. Sanctum vs Passport decision framework, token ability design, SPA cookie auth vs token auth, API key patterns for machine-to-machine, signed request patterns, per-endpoint authorization via Policies, rate limiting by auth tier, CORS configuration for API consumers, and API-specific security headers.

## 8. Input Validation Architecture

Validation design for API endpoints. Form Request organization by version and resource, DTO integration (payload() methods, toDto()), custom validation rule design for API contexts, conditional validation patterns, authorization in Form Requests for APIs, validation error shape customization, and the boundary between HTTP validation and domain validation.

## 9. Pagination Strategies

Pagination design for collection endpoints. Offset-based pagination (paginate), cursor pagination (cursorPaginate), keyset pagination tradeoffs, per-page parameter design, max page size enforcement, pagination metadata structure, cursor encoding strategies, performance characteristics of each approach, and when to choose each for different collection types.

## 10. API Documentation

Documentation strategy and tooling. Scramble vs Scribe vs OpenAPI generation, documentation-as-code principles, endpoint annotation strategies, request/response schema extraction, changelog generation, documentation CI validation, and the relationship between testing and documentation accuracy.

## 11. API Testing

Testing strategy for API systems. Feature testing for every endpoint (happy path, auth failure, validation failure), response shape testing (assertJsonStructure, assertExactJson), contract testing against OpenAPI specs, architecture tests for API conventions, idempotency testing, rate limit testing, and bulk operation testing.

## 12. API Lifecycle & Governance

Long-term API management. Deprecation policy design, version retirement planning, API changelog maintenance, team consistency rules (naming, structure, response shapes), ADR-driven architectural decisions, bulk operation and batch endpoint patterns, idempotency key design, CORS policy management, and API auditing.

---

# Complete Knowledge Inventory

## 1. REST API Design

- REST Architectural Constraints (statelessness, cacheability, uniform interface)
- Resource vs Action Orientation
- Resource Naming Conventions (plural nouns, kebab-case, hierarchy)
- HTTP Method Semantics (GET read, POST create, PUT replace, PATCH partial, DELETE remove)
- HTTP Status Code Selection Guide (200, 201, 204, 301, 400, 401, 403, 404, 405, 409, 422, 429, 500)
- Resource Representation Design (what fields, what format, what nesting)
- URL Structure Design (/api/v1/resources, /resources/{id}, nested resources)
- HATEOAS and Hypermedia Controls (links, actions, related resources)
- REST Maturity Model (Level 0-3)
- Content Negotiation (Accept header, Content-Type)
- Conditional Requests (ETag, If-Modified-Since, If-None-Match)
- REST Purity vs Pragmatic Tradeoffs
- Bulk Endpoint URL Design
- Idempotency Semantics (GET, PUT, DELETE idempotent; POST not; PATCH not)
- CORS Design for API Consumption

## 2. CRUD Architecture

- Thin Controller Principle
- Controller → DTO → Action → Response Flow
- Controller → DTO → Service → Response Flow
- Controller → DTO → Repository → Resource Flow
- Data Transfer Object Design (readonly, typed properties, immutability)
- DTO Construction Patterns (from Form Request, from array, from model)
- DTO Nesting and Composition
- Spatie Laravel Data Package Integration
- Action Class Design (single handle/execute method)
- Action Composition (actions calling sub-actions)
- Transactional Actions (DB::transaction wrapping)
- Queued Actions (spatie/laravel-queueable-action)
- Service Class Design (stateless, method-per-operation, entity grouping)
- Service Orchestration (coordinating multiple actions/services)
- Service vs Action Decision Framework
- Repository Pattern Design (interface, binding, testing)
- Repository vs Direct Eloquent Decision Framework
- Repository vs Query Object Decision
- Controller → Service → Repository Transaction Flow
- Layer Isolation Rules (what each layer must NOT do)
- When to Skip Layers (simple CRUD shortcuts)
- Request Lifecycle: Complete Data Flow
- Directory Organization by Feature vs Layer
- Domain-Driven Design Folder Conventions for APIs

## 3. Resource Controllers

- Resource Controller Pattern (index, store, show, update, destroy)
- API Resource Controller (Route::apiResource, --api flag)
- Singleton Resource Controllers (Route::singleton, Route::apiSingleton)
- Nested Resources and Shallow Nesting
- Partial Resource Routes (only, except)
- Single-Action Invokable Controller Pattern
- Controller Constructor vs Method Injection
- Controller Method Injection (Request, FormRequest, services)
- Controller Organization by Version (Api/V1/, Api/V2/)
- Controller Organization by Resource Group (domain grouping)
- Controller Code Limits (lines per method, methods per class)
- Controller Form Request Integration
- Controller Action/Service Delegation
- Controller Response Type Selection (Resource, collection, JsonResponse)
- Controller Middleware Assignment (middleware method, constructor, route)
- Controller Testing Strategies
- Thin Controller Enforcement Rules
- Controller Dependency Visibility (constructor DI makes deps explicit)
- Controller Namespace Organization (App\Http\Controllers\Api\V1\Resource)

## 4. Response Structures

- Envelope Response Design (success, data, error, meta fields)
- Bare Body Response Design (returning resource/collection directly)
- Data Wrapping Configuration (JsonResource::$wrap, withoutWrapping)
- Response Format Decision Framework (when to use envelope vs bare)
- Pagination Metadata Design (current_page, per_page, total, last_page, links)
- Cursor Pagination Metadata (cursor, next_cursor, previous_cursor, has_more)
- Pagination Information Customization (paginationInformation method)
- Top-Level Meta Data (with method, additional method)
- Top-Level Links Design (self, first, prev, next, last, related)
- Conditional Field Inclusion (when, whenHas, whenNotNull, mergeWhen)
- Conditional Relationship Inclusion (whenLoaded)
- Conditional Aggregate Inclusion (whenCounted, whenAggregated)
- Sparse Fieldset Design (fields[type] parameter)
- JSON:API Resource Structure (type, id, attributes, relationships, links)
- JSON:API Compound Documents (included resources)
- JSON:API Resource Collections and Pagination
- RFC 9457 Problem Details Structure (type, title, status, detail, instance)
- Error Response Envelope Design
- Response Versioning (different shapes per version)
- Response Timing and Performance Headers
- Response Compression (Accept-Encoding, Content-Encoding)
- Response Caching Headers (Cache-Control, ETag, Expires)

## 5. Error Handling Design

- Error Type Taxonomy (operational, programmer, infrastructure)
- Standardized Error Response Structure
- Domain-Specific Error Codes (USER_NOT_FOUND, VALIDATION_ERROR, RATE_LIMITED)
- Error Code Namespace Design (hierarchical, scoped to domain)
- HTTP Status Code to Error Mapping
- Exception-to-Code Mapping Strategy
- Validation Error Shape (message, errors object with field-level arrays)
- Authentication Error Responses (401 structure)
- Authorization Error Responses (403 structure)
- Not Found Error Responses (404 structure)
- Conflict Error Responses (409 structure)
- Rate Limit Error Responses (429 structure with Retry-After)
- Server Error Responses (500 structure, production-safe)
- Custom Exception Classes for API Errors
- Global Exception Handler Configuration (bootstrap/app.php withExceptions)
- Error Rendering for API Requests Only (wantsJson, expectsJson)
- Production vs Development Error Detail Level
- Sensitive Data Leak Prevention in Error Responses
- Error Tracking Integration (Sentry, Flare, custom)
- Error Logging Context (user ID, route, request ID, payload)
- Request ID Generation and Propagation
- Error Response Testing Strategies
- RFC 9457 Problem Details Implementation
- JSON:API Error Object Design

## 6. API Versioning

- URL Path Versioning Design (/api/v1/, /api/v2/)
- Header-Based Versioning Design (Accept: application/vnd.api.v2+json)
- Media Type Versioning Design (Content-Type: application/vnd.api.v2+json)
- Query Parameter Versioning (?version=2 — anti-pattern)
- Versioning Strategy Selection Framework
- Controller Inheritance Across Versions (V2 extends V1)
- Resource Class Organization by Version (Resources/V1/, Resources/V2/)
- Form Request Organization by Version
- Route File Organization by Version
- Version-Based Namespace Structure
- Backward-Compatible Changes (adding fields, new endpoints)
- Breaking Change Identification Guide
- Semantic Versioning for APIs (major.minor.patch)
- Deprecation Header Implementation (Deprecation: date)
- Sunset Header Implementation (Sunset: date, RFC 8594)
- Deprecation Link Headers (rel="deprecation", rel="successor-version")
- Deprecation Warning Body (Warning: 299 header)
- Phased Deprecation Timeline (announce, warn, throttle, remove)
- Version Retirement Policy
- Version Documentation Maintenance
- When to Create a New Version (decision criteria)
- When to Avoid Version Bumps

## 7. Authentication & Authorization for APIs

- Sanctum vs Passport Decision Framework
- Sanctum SPA Cookie Authentication Architecture
- Sanctum Token-Based Authentication for Mobile/Third-Party
- Token Ability Design (fine-grained scopes)
- Token Expiration and Rotation Strategies
- API Key Pattern for Machine-to-Machine
- Signed Request Pattern (HMAC signature)
- Per-Resource Authorization via Policies
- Policy Auto-Discovery for API Controllers
- Gate Registration for API-Specific Rules
- Rate Limiting by Authentication Tier (guest, authenticated, premium)
- Rate Limiter Definition (RateLimiter::for)
- Rate Limit Headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)
- CORS Configuration for API Consumers
- CORS Origins, Methods, Headers, Credentials
- API Security Headers (X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security)
- IP-Based Rate Limiting and Blocking
- Email Verification Gate for API Access
- API-Specific Middleware (ForceJsonResponse, EnsureEmailIsVerified)

## 8. Input Validation Architecture

- Form Request Design for API Endpoints
- Form Request Organization by Version and Resource
- Authorization in Form Requests (authorize method for API scoping)
- Validation Rule Array Design (rules method)
- Custom Validation Rule Classes for API Contexts
- Conditional Validation Patterns (sometimes, required_if, required_with)
- After-Validation Hooks (withValidator, after)
- Input Preparation for Validation (prepareForValidation)
- DTO Integration: payload() Method on Form Requests
- DTO Integration: toDto() Method on Form Requests
- Manual Validator Creation for Complex Validation
- Validation Error Shape Customization
- Stopping on First Validation Failure
- Per-Field Error Messages (messages method)
- Validation Attribute Names (attributes method)
- Rule Organization Strategies (by resource, by action)
- Reusable Validation Traits
- Form Request Testing Strategies
- Database Existence Validation (exists, unique on API creates/updates)
- UUID/ULID Format Validation
- Bulk Request Validation Patterns
- Pagination Parameter Validation (per_page max, page min)

## 9. Pagination Strategies

- Offset Pagination Design (page, per_page)
- Offset Pagination Performance Characteristics
- Offset Pagination Limitations (page drift, slow offset at high page numbers)
- Cursor Pagination Design (cursor, limit)
- Cursor Encoding Strategies (base64, encrypted, opaque)
- Cursor Pagination Performance Characteristics (stable, fast at any depth)
- Cursor Pagination Limitations (no page jumping, no total count)
- Keyset Pagination Design (WHERE id > last_seen_id)
- Keyset Pagination Performance
- Pagination Strategy Selection Framework (by collection type, by use case)
- Per-Page Parameter Design (default, max, validation)
- Pagination Metadata Structure Consistency
- Cursor Pagination with Multiple Sort Columns
- Pagination Link Header Design (first, prev, next, last)
- Pagination with Complex Filters
- Pagination with Sparse Fieldsets
- Total Count Performance (count(*) optimization)
- Zero-Result Pagination Responses
- Infinite Scroll Pagination Design
- Offset-to-Cursor Migration Strategy

## 10. API Documentation

- Scramble Integration (static analysis, zero annotations)
- Scribe Integration (annotation-based, Postman collections)
- OpenAPI Specification Generation and Validation
- Endpoint Documentation Content (method, URL, auth, request body, response, errors)
- Request Body Schema Documentation
- Response Schema Documentation
- Error Response Documentation
- Authentication Documentation
- Changelog Generation from Git History
- Documentation CI Validation (spec matches code)
- Postman Collection Generation
- API Version Documentation Strategy
- Deprecation Notes in Documentation
- Documentation Search and Navigation
- Rate Limit and Pagination Documentation
- SDK Generation from OpenAPI Specs
- When to Use Scramble vs Scribe vs Custom OpenAPI

## 11. API Testing

- Feature Test Structure for API Endpoints
- Happy Path Testing (200/201 response, correct shape)
- Authentication Failure Testing (401 response)
- Authorization Failure Testing (403 response)
- Validation Failure Testing (422 response, shape)
- Not Found Testing (404 response)
- Response Shape Testing (assertJsonStructure, assertExactJson)
- Response Status Code Testing
- Response Header Testing
- Pagination Response Testing
- Error Response Shape Testing
- Contract Testing with OpenAPI Spec (Spectator)
- Architecture Tests for API Conventions (Pest arch tests)
- Layer Isolation Rules in Tests
- Form Request Unit Testing
- DTO Unit Testing
- Action/Service Unit Testing
- Rate Limiting Testing
- CORS Behavior Testing
- API Version Behavior Testing
- Idempotency Key Testing
- Bulk Operation Testing (partial success scenarios)
- Test Data Factory Design for API Tests
- API Test Organization by Resource and Version

## 12. API Lifecycle & Governance

- Deprecation Policy Design (timeline, communication, tracking)
- Version Retirement Process (announcement, migration period, shutdown)
- API Changelog Maintenance
- Backward Compatibility Policy
- Breaking Change Identification Process
- Team API Consistency Rules (naming, structure, response shape, error format)
- ADR (Architecture Decision Record) Process for API Changes
- API Audit and Review Process
- Bulk Operation Design (POST /bulk, batch limits, partial success)
- Idempotency Key Design (Idempotency-Key header, storage, atomicity)
- Idempotency Key TTL and Expiration
- Idempotency Key Error Handling (duplicate with different body → 422)
- CORS Policy Governance (allowed origins, methods, headers)
- Request Size Limits and Enforcement
- Rate Limit Tier Design (guest, authenticated, premium)
- API Usage Tracking and Analytics
- API Consumer Notification Strategy
- API Breaking Change Communication Template
- API Style Guide Documentation
- Monitoring and Alerting for API Errors
- API Response Time Budgets and SLAs

---

# Knowledge Classification

## Foundation
- REST Architectural Constraints • Resource vs Action Orientation
- HTTP Method Semantics • HTTP Status Code Selection (core codes)
- Thin Controller Principle • Resource Controller Pattern
- Single-Action Invokable Controller Pattern
- Envelope Response Design • Bare Body Response Design
- Pagination Metadata Design (offset, current_page, total)
- Standardized Error Response Structure
- Sanctum vs Passport Decision Framework
- Form Request Design for API Endpoints
- Feature Test Structure for API Endpoints

## Intermediate
- Resource Naming Conventions • URL Structure Design
- DTO Design and Construction Patterns
- Controller → DTO → Action → Response Flow
- Service Class Design (stateless, entity grouping)
- Action Class Design (single handle/execute)
- API Resource Controller (Route::apiResource)
- Partial Resource Routes (only, except)
- Conditional Field Inclusion (when, whenLoaded)
- Top-Level Meta Data and Links
- Validation Rule Array Design • Custom Validation Rules
- Pagination Metadata Customization
- Error Code Design (domain-specific, hierarchical)
- URL Path Versioning Design
- Sanctum Token Authentication (token-based)
- Per-Resource Authorization via Policies
- Per-Page Parameter Design and Validation
- Feature Testing for Auth, Validation, Not Found
- CORS Configuration for API Consumers
- Content Negotiation (Accept header)

## Advanced
- HATEOAS and Hypermedia Controls
- REST Maturity Model • REST Purity vs Pragmatic Tradeoffs
- Spatie Laravel Data Package Integration
- DTO Nesting and Composition
- Service vs Action Decision Framework
- Repository Pattern Design • Repository vs Direct Eloquent Decision
- Controller → DTO → Service → Repository → Resource Flow
- Controller Inheritance Across Versions
- Resource and Request Organization by Version
- JSON:API Resource Structure (type, id, attributes, relationships)
- JSON:API Compound Documents (included)
- RFC 9457 Problem Details Implementation
- Exception-to-Code Mapping Strategy
- Global Exception Handler for APIs
- Cursor Pagination Design and Encoding
- Keyset Pagination Design
- Pagination Strategy Selection Framework
- Token Ability Design (fine-grained scopes)
- Rate Limiter Definition and Tier Design
- Rate Limit Headers (X-RateLimit-*)
- Conditional Validation Patterns (sometimes, etc.)
- DTO Integration: payload() and toDto() on Form Requests
- Architecture Tests for API Conventions (Pest arch tests)
- Contract Testing with OpenAPI Spec (Spectator)
- Idempotency Key Design and Implementation
- Bulk Operation Design (batch limits, partial success)
- Deprecation Header and Sunset Header Implementation
- API-Only Middleware Design (ForceJson, EnsureEmailIsVerified)
- Scramble and Scribe Integration for Documentation

## Expert
- Content Negotiation with Vendor Media Types
- Conditional Requests (ETag, If-Modified-Since, If-None-Match)
- Layer Isolation Rules and Enforcement
- Sparse Fieldset Design (fields[type] parameter)
- Bulk Request Validation Patterns
- Multi-Column Cursor Pagination
- Cursor Pagination Performance Optimization
- Idempotency Key Atomicity (Redis SETNX, DB unique constraints)
- Signed Request Pattern (HMAC)
- IP-Based Rate Limiting and Blocking
- Custom Exception Classes for API Errors
- RFC 9457 Extensions (custom fields in problem details)
- Version Retirement Policies
- Version-Based Auto-Discovery Patterns
- Phased Deprecation Timeline Design
- OpenAPI Specification Validation in CI
- Multi-Column Sort in Cursor Pagination
- Offset-to-Cursor Migration Strategy
- Rate Limit Headers Customization (X-RateLimit-* semantics)
- Test Data Factory Design for Complex API Tests

## Enterprise
- REST Maturity Model Level 3 (Hypermedia as Engine of Application State)
- API Governance Program Design
- Team API Style Guide Maintenance
- ADR-Driven API Change Management
- Multi-Team API Consistency Enforcement
- API Version Lifecycle Across Multiple Products
- Deprecation Tracking and Consumer Notification Systems
- API Usage Analytics and Rate Limit Optimization
- API Response Time SLAs and Error Budgets
- API Auditing and Compliance
- Multi-Api-Gateway Version Strategy
- SDK Generation Pipeline from OpenAPI Specs
- Documentation CI/CD (spec validation, auto-deploy)
- Cross-Team API Contract Negotiation

---

# Dependency Map

```
REST API Design
    ↓
CRUD Architecture ───────────── Resource Controllers
    ↓                                     ↓
Input Validation ───→ Response Structures ←─── Authentication & Authorization
Architecture             ↓                              ↓
                     Error Handling               API Versioning
                     Design                            ↓
                          ↓                     API Lifecycle &
                     Pagination               Governance
                     Strategies                      ↓
                          ↓                    API Documentation
                     API Testing ←────────────────────⇄
```

Detailed subdomain dependencies:

- **REST API Design** depends on: nothing (foundational)
- **CRUD Architecture** depends on: REST API Design
- **Resource Controllers** depends on: REST API Design, CRUD Architecture
- **Response Structures** depends on: REST API Design, CRUD Architecture
- **Error Handling Design** depends on: Response Structures
- **API Versioning** depends on: REST API Design, Resource Controllers, Response Structures
- **Authentication & Authorization for APIs** depends on: REST API Design, Error Handling Design
- **Input Validation Architecture** depends on: CRUD Architecture, Error Handling Design
- **Pagination Strategies** depends on: Response Structures, Error Handling Design
- **API Documentation** depends on: all of the above (must come after design decisions)
- **API Testing** depends on: all of the above (tests validate design)
- **API Lifecycle & Governance** depends on: all of the above (governance codifies decisions)

---

# Missing Knowledge Risk Analysis

The following areas are consistently misunderstood, skipped, or applied incorrectly by Laravel developers:

**1. Response format inconsistency.** The most common API failure. Different endpoints return different shapes (sometimes envelope, sometimes bare, sometimes arrays, sometimes objects). Frontend teams cannot write reusable fetch logic because every endpoint requires custom handling. The root cause is the absence of a team-wide response contract that is enforced from day one.

**2. Error responses as an afterthought.** Developers invest heavily in success response design and then throw errors together ad-hoc. A 404 returns one shape, a 422 returns another, a 500 returns HTML. Mobile apps crash because they cannot parse the inconsistent error format. The error response is part of the API contract — it deserves the same design rigor as the success response.

**3. Versioning retrofit pain.** The single most expensive API mistake. Teams launch without versioning ("we'll add it later"), then face a production-breaking schema change with no migration path for consumers. Retrofitting versioning requires renaming routes, maintaining compatibility shims, and negotiating migration timelines under pressure. /api/v1/ costs nothing on day one.

**4. Controller → DTO → Action → Service over-engineering.** Teams adopt the full layered architecture for every endpoint, including simple CRUD that does `Model::create($validated)`. The result is dozens of empty DTOs, one-line actions, and passthrough services that add ceremony without value. The layering should be proportional to complexity.

**5. Repository pattern by default.** Developers add a repository layer to every project because it "feels more enterprise," without understanding the tradeoff. Repositories add abstraction cost (interfaces, bindings, tests) for a benefit (data source swapability, test isolation) that most projects never need. Eloquent is the repository.

**6. Envelope vs bare body confusion.** Teams choose an envelope pattern without understanding the tradeoffs. The `success` boolean duplicates the HTTP status code. The wrapper adds nesting that complicates frontend deserialization. Bare body responses are simpler but provide no room for top-level metadata or error details. The choice should be explicit and deliberate.

**7. Cursor pagination complexity.** Developers reach for cursor pagination because "offset is slow" without understanding the tradeoffs. Cursor pagination cannot provide total counts or support arbitrary page jumping. It is ideal for infinite scroll but wrong for admin tables that need "Jump to page 50." The pagination strategy should match the consumer's UI pattern.

**8. Deprecation without communication.** Teams create new API versions silently, leaving old consumers to fail mysteriously. The `Deprecation` and `Sunset` headers are known but rarely implemented. Consumers discover breaking changes in production because there was no deprecation warning in staging.

**9. Idempotency awareness gap.** POST endpoints are not idempotent by HTTP semantics. In production, network retries, double-click submissions, and webhook replays create duplicate resources. Most Laravel APIs have no idempotency key mechanism, leaving duplicate prevention to the mercy of client behavior.

**10. Documentation drift.** Documentation is written once during development and never updated. By the time the API reaches production, the docs describe endpoints that no longer exist, request bodies that have changed, and error responses that differ from reality. Automated documentation generation (Scramble) and CI spec validation are the fix, but few teams implement them.

**11. Bulk operation design.** Teams implement bulk operations as loops inside transactions, failing the entire batch when one item fails. Partial success is not designed for. The response does not communicate per-item status. Clients cannot tell which operations succeeded and which failed.

**12. API testing scope gap.** Teams test the happy path but skip error response shape testing, authorization failure testing, and rate limit testing. An endpoint that returns 200 with wrong-shape data passes tests. Contract testing and negative-path testing are consistently under-prioritized.

---

# Research Findings

## Recurring Expert Recommendations

- **Version from day one.** Every expert source emphasizes this as the single most important API decision. `/api/v1/` costs nothing upfront. Retrofitting versioning after consumers exist is significantly more expensive than building it in from the start.

- **Never return raw Eloquent models.** The most consistently repeated recommendation across all sources. Raw model responses expose database columns (including sensitive fields), change shape when the schema changes, and break API contracts silently. Always use API Resources.

- **Controllers must be thin.** Validate via FormRequest, delegate to Action/Service, return via Resource. Target: under 10-15 lines per method. Controllers that exceed this threshold should be refactored.

- **Form Requests for all validation, never in controllers.** Inline validation in controllers couples validation logic to the HTTP handler, makes it unreusable, and grows controllers beyond maintainable size. Form Requests automatically return 422 JSON for API requests.

- **Errors must have a consistent shape.** Every error response must return the same JSON structure. The error format is part of the API contract. Consumers should never have to parse a 200, 404, and 422 differently — they should all return the same envelope.

- **Use correct HTTP status codes.** Returning 200 for everything (including errors) makes APIs effectively unusable by automated clients. Use 201 for creation, 204 for deletion, 422 for validation, 401 for auth, 403 for authorization, 404 for not found, 429 for rate limiting.

- **Rate limit everything public.** Rate limiting is not optional for production APIs. Different tiers for guest, authenticated, and premium users. Expose rate limit headers so consumers can back off intelligently.

- **Choose response format deliberately.** Evaluate envelope vs bare body vs JSON:API vs RFC 9457 based on consumer profile — public APIs favor JSON:API or envelopes, internal APIs favor bare body with structured errors.

- **Prefer URL path versioning.** URL versioning (`/api/v1/`) is explicit, cache-friendly, simple to implement, and the majority recommendation. Header-based versioning is theoretically cleaner but harder to test, debug, and cache.

- **Use ULID/UUID for public-facing IDs.** Auto-increment IDs leak business intelligence (record count, creation velocity). ULIDs are time-sortable and safe to generate without database round-trips. Laravel has first-party ULID support via `HasUlids` trait.

- **Documentation must be generated, not written.** Static documentation drifts. Scramble generates OpenAPI specs from code automatically, keeping docs always accurate. If docs are separate from code, they will inevitably fall out of sync.

- **Idempotency is a server responsibility.** POST endpoints should support `Idempotency-Key` headers. The check + processing must be atomic. This prevents duplicate resources from network retries and client errors.

## Recurring Architectural Patterns

- **Route → Middleware → FormRequest → Controller → DTO → Action/Service → Repository → Resource → Response.** The canonical data flow emerging in every production-grade Laravel API study. Each layer has one responsibility.

- **URL-prefix versioning with controller inheritance.** `/api/v1/` prefix, V2 controllers extend V1 controllers, overriding only changed methods. Resources and Requests organized by version directory.

- **Envelope response with success/data/error/meta.** The most common production response pattern. Customizable via a shared `ApiResponse` trait or base controller with `success()`/`error()` methods.

- **Sanctum for first-party, Passport for third-party.** The dominant auth architecture in production Laravel APIs. Sanctum handles SPA cookie auth and personal access tokens. Passport is reserved for full OAuth2 server requirements.

- **Rate limiting by auth tier.** Three-tier rate limiting is the most deployed pattern: guest (10/min), authenticated (60/min), premium (600/min). Limits defined in `RateLimiter::for()` and applied via `throttle` middleware per route group.

- **Error code namespacing by domain.** Error codes are structured hierarchically: `USER_NOT_FOUND`, `PAYMENT_DECLINED`, `VALIDATION_ERROR`. This allows consumers to write programmatic error handlers per domain.

- **Single-action controllers for complex endpoints.** Resource controllers for standard CRUD, invokable single-action controllers for complex or non-standard endpoints. Directory structure mirrors this: `UsersController` (resource) for standard, `Users/RegisterController` (invokable) for auth.

- **Bulk endpoints with partial success responses.** POST `/api/users/bulk` returns `{ results: [{ status, data, error }] }` with individual per-item status codes. 200 if all succeed, 200 with some errors (partial success), 422 if all fail.

- **Deprecation via middleware.** A reusable middleware reads config for deprecated routes and attaches `Deprecation`, `Sunset`, and `Warning` headers. Applied to route groups when a version enters deprecation phase.

## Recurring Tradeoffs

| Tradeoff | Context | Guidance |
|---|---|---|
| Envelope vs Bare Body | Response structure | Envelopes for public APIs (room for metadata, errors); bare body for internal/mobile (simpler parsing) |
| URL vs Header Versioning | Version strategy | URL for simplicity and cacheability; header for URL purity at cost of dev experience |
| Sanctum vs Passport | Auth strategy | Sanctum for 90% of projects (first-party apps); Passport only for third-party OAuth2 |
| Offset vs Cursor Pagination | Collection design | Offset for admin UIs (page jumping, totals); cursor for infinite scroll (stable, fast) |
| Full Layered Architecture vs Simple CRUD | Architecture depth | Full layers for complex business logic; direct Model::create for simple CRUD |
| Repository vs Direct Eloquent | Data access | Repositories for multiple data sources or complex query abstraction; Eloquent directly for standard apps |
| Multi-Action vs Single-Action Controllers | Controller design | Resource controllers for standard CRUD; invokable for complex individual endpoints |
| Generated Docs vs Written Docs | Documentation | Scramble (generated) stays accurate but has less control; Scribe (annotated) has more control but drifts |
| DTO vs Array | Data transport | DTOs when data crosses 2+ layers; arrays for single-layer controller-to-Model passes |
| Strict REST vs Pragmatic API | Design philosophy | REST purity for public APIs with multiple consumers; pragmatic shortcuts for internal/mobile APIs |

## Recurring Misconceptions

- **"API Resources are just formatters."** API Resources are contracts with external consumers. They decouple the database schema from the API response. Changing a database column should not require updating the frontend — the Resource absorbs the change.

- **"Versioning is for big APIs only."** Versioning matters as soon as the first consumer depends on the API, regardless of API size. A mobile app in the App Store cannot be updated on your release schedule.

- **"200 with `success: false` is fine."** Returning 200 for errors breaks HTTP semantics, defeats caching proxies, and confuses automated tooling. Status codes exist to categorize responses — use them.

- **"Repositories are always necessary for good architecture."** Eloquent's Active Record pattern is a valid data access strategy. Repositories add value when queries are complex or data sources are multiple, not as a default layer.

- **"Controllers should be in the same directory as web controllers."** API controllers belong in `app/Http/Controllers/Api/`, separate from web controllers. They have different concerns, different middleware, and different response patterns.

- **"Documentation is a one-time effort."** Documentation must be maintained alongside the code. Generated documentation (Scramble) solves this by extracting schemas from code. Written documentation requires CI validation or it will drift.

- **"Cursor pagination is always better than offset."** Cursor pagination has significant limitations: no total count, no page jumping, complex sort logic. It is ideal for infinite scroll but wrong for paginated admin tables.

- **"Bulk operations should be atomic."** Wrapping a bulk endpoint in a single transaction fails all items on one bad input. Partial success (per-item status) is the correct pattern for batch operations.

- **"Deprecation headers are optional."** `Deprecation` and `Sunset` headers are the standard mechanism (RFC 8594, RFC 9745) for communicating API lifecycle changes. Without them, consumers discover breaking changes in production.

- **"Idempotency is a client concern."** Idempotency prevents duplicate resources from network retries, double-clicks, and webhook replays. It is a server responsibility, implemented via `Idempotency-Key` headers and atomic storage.

---

# Future Expansion Opportunities

## High Value

1. **AI SDK API Patterns** — Laravel 13's AI SDK introduces new API design patterns for RAG pipelines, chat completions, and agent endpoints. These have unique requirements (streaming, context management, token tracking) that may warrant dedicated coverage.

2. **Laravel 13 Native JSON:API Evolution** — As first-party JSON:API resources mature, additional patterns around sparse fieldsets, includes, and compound documents will emerge, requiring deeper coverage as consumer adoption grows.

3. **OpenAPI 3.1 Specification Compliance** — As more tools adopt OpenAPI 3.1 (JSON Schema 2020-12), API documentation and contract testing patterns will shift. Coverage of OpenAPI 3.1 specifics for Laravel APIs will become valuable.

4. **Multi-Tenant API Design** — API patterns for multi-tenant Laravel applications: tenant-aware versioning, tenant isolation in rate limiting, tenant-scoped authentication, and per-tenant response customization.

## Medium Value

5. **API Gateway and API Management Integration** — Laravel APIs behind API gateways (Kong, AWS API Gateway, Laravel Echo): gateway-specific rate limiting, caching, transformation, and authentication patterns.

6. **Webhook Delivery API Design** — API patterns for webhook delivery: signing payloads, retry policies, event versioning, delivery tracking, and consumer verification.

7. **Streaming and Server-Sent Events API Patterns** — Real-time API design with Laravel: SSE for event streams, chunked responses for large datasets, progress tracking for long operations.

8. **API Metrics and Observability** — API-specific monitoring: endpoint-level latency tracking, error rate dashboards, consumer usage analytics, SLA compliance monitoring.

## Lower Priority

9. **HTMX + API Hybrid Patterns** — APIs that serve both JSON consumers and HTMX hypermedia responses from the same endpoints.

10. **Platform Engineering for APIs** — Internal developer platforms for API teams: API scaffolding tools, shared middleware packages, standard testing templates, and API style guide enforcement.

---

# Sources Consulted

## Tier 1 — Framework Truth

- Laravel 13.x Documentation: Controllers, API Resources (JsonResource, JsonApiResource, ResourceCollection), Validation (Form Requests, custom rules), HTTP Responses, Routing (apiResource, singleton, nesting), Rate Limiting, Authentication (Sanctum, Passport), Pagination, Error Handling, CORS
- Laravel Framework Source Code: `src/Illuminate/Routing/ResourceRegistrar.php`, `src/Illuminate/Http/Resources/Json/JsonResource.php`, `src/Illuminate/Http/Resources/JsonApi/JsonApiResource.php`, `src/Illuminate/Http/Resources/Json/ResourceCollection.php`
- Laravel Framework Source Code: `src/Illuminate/Validation/`, `src/Illuminate/Auth/`, `src/Illuminate/RateLimiting/`, `src/Illuminate/Routing/Middleware/ThrottleRequests.php`
- Laravel 13 Release Notes and Upgrade Guide (JSON:API resources, PHP attributes, typed config, AI SDK)
- Laravel Sanctum Documentation — Token abilities, SPA authentication, mobile token patterns
- Laravel Passport Documentation — OAuth2 server, scopes, client credentials, refresh tokens

## Tier 2 — Expert Production Usage

- Toptal Blog: "Laravel API Tutorial 2026: Creating & Testing a RESTful API" — Production CRUD API patterns
- Treesha Infotech (Ritesh Patel): "Laravel API Development: Best Practices for 2026" — Controller-to-DTO-to-Action-to-Response pattern, API resource versioning
- Tushar Modi: "Laravel 13 REST API Best Practices (2026)" — Complete production checklist, versioning, testing
- Richard Joseph Porter: "Laravel API Development Best Practices Guide" — Sanctum vs Passport decision, error handling, rate limiting
- Kokil Shrestha: "Laravel API Best Practices 2026" — Consistent response format, API Resources, error handling
- Muhammad Arslan (DEV.to): "Enterprise Laravel API Development" — Service-repository architecture, cursor pagination, versioning
- Steve McDougall (JustSteveKing): "Building Modern Laravel APIs: Foundations and Project Structure" — ULIDs, invokable controllers, Problem+JSON errors, RFC 9457, Sunset middleware
- Steve McDougall (JustSteveKing): "Why your Laravel controllers should be almost empty" — Thin controller principles, service/action/repository/resource layers
- Michael K. Laweh (klytron.com): "How I Structure Large Laravel Projects" — Service layer with interfaces, transformer classes, configuration-driven architecture
- Shah Alam (Medium): "Stop Writing Fat Controllers: Laravel Service + Action Pattern Guide" — Complete layered architecture with DTOs, services, actions, repositories
- Benjamin Crozat: "20 Laravel best practices for 2026" — Thin controllers, invokable controllers, middleware for cross-cutting concerns
- Laravel Daily — Bad practices series (status codes, error responses, validation)
- Coder Manjeet (Towards Dev): "Laravel Best Practices 2026" — Hands-on CRUD patterns, thin controllers, Form Requests
- Habibur Rahman (Medium): "Global Exception Handling and API Response Setup in Laravel 12" — Error response standardization
- Jeishanul Islam (DEV.to): "Advanced Error Handling & Monitoring in Laravel APIs" — Error taxonomy, structured error contracts, contextual logging

## Tier 3 — Production Repositories

- orebarranco/laravel-api-starter-kit — Production-grade Laravel API scaffolding: thin controllers, DTOs, actions, JSON:API, Sanctum, versioning, centralized exception handling, Pest with 100% coverage
- abishekrsrikaanth/laravel-api-guardian — Error handling package with JSend, RFC 7807, JSON:API, GraphQL formats, circuit breaker pattern, error monitoring dashboard
- Laravel Jetstream — First-party authentication scaffolding with Sanctum (API token patterns, SPA auth)
- Laravel Breeze — First-party starter kit (API routes, sanctum integration)
- Laravel Scribe — API documentation generation (annotation-based, Postman collections, OpenAPI)
- dedoc/scramble — OpenAPI documentation from static analysis (zero annotations)
- spatie/laravel-data — DTO package with validation, transformation, nesting, TypeScript generation
- spatie/laravel-queueable-action — Action queuing pattern for API background operations
- Laravel Framework (illuminate/auth, illuminate/validation, illuminate/routing, illuminate/http) — First-party API infrastructure
- Pulse-Link architecture (Steve McDougall reference) — Invokable controllers, Problem+JSON, ULIDs, V1 prefix, Sunset middleware

## Tier 4 — Community Intelligence

- Reddit r/laravel — Architecture pattern debates (service vs action, repository necessity), response format discussions, versioning strategy arguments
- GitHub Discussions (laravel/framework, spatie/laravel-data) — Feature requests, pattern debates, tradeoff discussions
- GitHub Issues — Error handling patterns, validation architecture, pagination edge cases
- DEV.to Community (abdulsalamamtech, mmurtuzah, itxshakil, emongmarcc) — Architectural patterns, enterprise API guides
- Stack Overflow — Response format questions, versioning strategy confusion, error handling patterns, pagination selection
- Postman Blog — API error handling best practices (RFC 9457, error structure, status code usage)
- Speakeasy API Blog — Error design, RFC 9457, error code conventions, documentation
- Greeden Blog — Laravel API Resource design, DTO integration, unified error responses, frontend integration
- Medium (Shah Alam, Adriana Eka Prayudha, Habibur Rahman) — Production architecture guides, error handling patterns, layered architecture
- Tushar Modi Blog — Laravel 13 REST API checklist, Sanctum vs Passport, API versioning, testing
- Community consensus: version from day one, use API resources, thin controllers, consistent error shapes, rate limit everything, prefer URL versioning, ULIDs for public IDs
