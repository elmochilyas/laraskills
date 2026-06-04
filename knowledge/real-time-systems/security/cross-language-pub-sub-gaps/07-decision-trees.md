# Metadata

**Domain:** Real-Time Systems
**Subdomain:** Security
**Knowledge Unit:** Cross-Language Pub/Sub Gaps
**Generated:** 2026-06-03

---

# Decision Inventory

* Cross-Language Bridge Method: Gateway vs Direct Redis vs Managed API
* External Event Authentication Strategy
* API Versioning Strategy

---

# Architecture-Level Decision Trees

---

## Cross-Language Bridge Method: Gateway vs Direct Redis vs Managed API

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Non-Laravel services (Python, Node.js, Go) need to publish broadcast events to Laravel-connected clients. The engineer must choose between a Laravel API gateway, direct Redis publishing, or using a managed service HTTP API.

---

## Decision Criteria

* performance considerations — latency overhead of each approach
* architectural considerations — coupling to internal vs external infrastructure
* security considerations — authentication and payload validation
* maintainability considerations — versioning and evolution of broadcast format

---

## Decision Tree

How should external services publish broadcast events?
↓
Is the external service in the same deployment environment (internal microservice)?
YES → Is latency critical (< 10ms)?
    YES → Use [Laravel broadcast gateway endpoint — best balance of stability and speed]
    NO → Use [Laravel broadcast gateway endpoint with queue: 50-200ms added]
NO → Is the external service outside the deployment (third-party)?
    YES → Is a managed WebSocket service used (Pusher, Ably)?
        YES → [Use the managed service's HTTP API — most portable]
        NO → [Laravel broadcast gateway endpoint with API key auth]
    NO → [Evaluate: direct Redis publishing is brittle — prefer gateway]

---

## Rationale

The Laravel broadcast gateway is the recommended approach for all cases because it provides a stable contract with authentication, validation, and versioning. Direct Redis publishing to Reverb's scaling channel couples external services to an internal schema that may change between versions—Reverb v1.7+ uses JSON, but this is an implementation detail. Managed service HTTP APIs (Pusher REST API, Ably REST API) are the most portable bridge and have official SDKs in most languages.

---

## Recommended Default

**Default:** Laravel broadcast gateway endpoint at `/api/v1/broadcast` with API key authentication
**Reason:** Stable contract decoupled from internal infrastructure; provides auth, validation, and versioning

---

## Risks Of Wrong Choice

Direct Redis publishing breaks silently when the internal message format changes. No authentication on the gateway allows unauthorized event injection.

---

## Related Rules

Always Use a Laravel Broadcast Gateway for External Services (05-rules.md)

---

## Related Skills

Bridge Cross-Language Pub/Sub Gaps for Broadcasting (06-skills.md)

---

## External Event Authentication Strategy

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

The broadcast gateway must authenticate external services. Using broadcast credentials (REVERB_KEY, REVERB_SECRET) exposes the entire broadcast system. The engineer must choose an authentication strategy that provides scoped, revocable access.

---

## Decision Criteria

* performance considerations — auth verification overhead per request
* architectural considerations — credential rotation and management
* security considerations — principle of least privilege for external services
* maintainability considerations — credential lifecycle management

---

## Decision Tree

How should external services authenticate to the broadcast gateway?
↓
Is the external service a trusted internal microservice?
YES → [API key stored in service config; validate in gateway middleware]
NO → Is the external service a third-party integration?
    YES → [Scoped API token with limited channel/event permissions]
    NO → Is the service user-facing (webhook simulator, admin tool)?
        YES → [OAuth2 token scoped to the authenticated user]
        NO → [API key with rate limiting as minimum]

---

## Rationale

External services must never use Laravel's broadcast credentials because those grant full control over the broadcasting system. Instead, use scoped API keys or tokens that can be individually revoked without affecting other services. API keys are simplest for service-to-service auth. OAuth2 tokens are appropriate for user-facing tools. Each token should have channel-level scope to limit which channels the external service can publish to.

---

## Recommended Default

**Default:** API key stored in Laravel's config/services.php; validated via middleware on the gateway endpoint
**Reason:** Simple to implement and manage; keys can be rotated independently from broadcast credentials

---

## Risks Of Wrong Choice

Exposing broadcast credentials to external services allows any compromised external service to broadcast arbitrary events. No authentication allows anyone to inject events.

---

## Related Rules

Never Expose Laravel Broadcast Credentials to External Services (05-rules.md)

---

## Related Skills

Bridge Cross-Language Pub/Sub Gaps for Broadcasting (06-skills.md)

---

## API Versioning Strategy

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

The broadcast gateway API will evolve over time. Without versioning, a breaking change breaks all external consumers simultaneously. The engineer must choose a versioning strategy.

---

## Decision Criteria

* performance considerations — routing overhead of version prefixes
* architectural considerations — API surface stability
* security considerations — deprecating old versions
* maintainability considerations — maintaining multiple versions

---

## Decision Tree

How should the broadcast API be versioned?
↓
Will multiple external services with different update cycles use this API?
YES → [URL prefix versioning: /api/v1/broadcast, /api/v2/broadcast]
NO → Is the only consumer a single internal service with coordinated deploys?
    YES → [No versioning needed initially; add if/when second consumer appears]
    NO → [URL prefix versioning for future-proofing]

---

## Rationale

URL prefix versioning (`/api/v1/broadcast`) is the simplest and most explicit versioning strategy. It makes versions immediately visible in logs and monitoring, allows independent deployment of version upgrades, and provides a clean deprecation path (keep v1 running while consumers migrate to v2). Header-based versioning (Accept header) is more REST-purity but harder to debug and monitor. For a single consumer with coordinated deploys, versioning can be deferred until needed.

---

## Recommended Default

**Default:** URL prefix versioning: `/api/v1/broadcast`
**Reason:** Explicit, debuggable, supports gradual migration with overlap periods

---

## Risks Of Wrong Choice

Unversioned API causes cascading failures when a breaking change is deployed. Overly aggressive versioning (v1, v1.1, v1.2) creates maintenance burden without benefit.

---

## Related Rules

Always Version the External Broadcast API (05-rules.md)

---

## Related Skills

Bridge Cross-Language Pub/Sub Gaps for Broadcasting (06-skills.md)
