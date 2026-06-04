# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 09-package-landscape
**Knowledge Unit:** package-landscape-decision-framework
**Generated:** 2026-06-03

---

# Decision Inventory

1. HTTP Client Package Selection (Saloon vs Http Facade vs Vendor SDK)
2. Webhook Package Selection (Spatie vs Managed Gateway vs Custom)
3. Circuit Breaker Package Selection (algoyounes vs Fuse vs Custom)

---

# Architecture-Level Decision Trees

---

## HTTP Client Package Selection

---

## Decision Context

Choosing the right HTTP client approach for consuming external APIs.

---

## Decision Criteria

* API complexity
* number of endpoints
* authentication requirements
* team familiarity

---

## Decision Tree

Does the API have an official well-maintained PHP SDK (Stripe, Twilio, Mailgun)?
↓
YES → Use vendor SDK directly — do not wrap in Saloon
  ↓
  Does vendor SDK support Laravel patterns (queues, config, container)?
  ↓
  YES → Vendor SDK is the best choice — minimal maintenance
  NO → Evaluate Saloon wrapper if SDK integration friction is high
NO → Single endpoint, simple auth (Bearer token or none)?
  ↓
  YES → Use Laravel Http facade — no additional package needed
    ↓
    Will this API grow to multiple endpoints later?
    ↓
    YES → Start with Saloon anyway (future-proof at minimal cost)
    NO → Http facade is sufficient for one-off calls
  NO → Multi-endpoint API requiring auth, pagination, error handling?
    ↓
    YES → Use SaloonPHP v4 — structured Connector/Request/Response pattern
    NO → Http facade + manual error handling (keep it simple)
↓
  Rate limiting and caching needed?
  ↓
  YES → Saloon with rate limit plugin + cache plugin
  NO → Saloon without additional plugins (base Connector sufficient)
↓
  Team already familiar with Guzzle?
  ↓
  YES → Saloon wraps Guzzle — familiar middleware concepts
  NO → Saloon abstracts Guzzle fully — learn Connector/Request pattern

---

## Rationale

Vendor SDK is lowest risk for Stripe/Twilio. Http facade is simplest for one-off calls. Saloon provides structure for multi-endpoint APIs with built-in plugin ecosystem for rate limiting, caching, and auth.

---

## Recommended Default

**Default:** SaloonPHP v4 for any integration with >2 endpoints or complex auth; Http facade for single-endpoint/simple calls
**Reason:** Saloon provides structure without significant overhead; Http facade avoids unnecessary complexity for simple cases

---

## Risks Of Wrong Choice

Http facade on complex API creates scattered, untestable HTTP code. Saloon on single endpoint adds 1-3ms overhead for no benefit. Wrapping vendor SDK in Saloon adds maintenance without value.

---

## Related Rules/Skills

* 08-sdk-generation: sdk-generation (SDK building with Saloon)
* ku-aie-005: Package Landscape (full package comparison table)

---

---

## Webhook Package Selection

---

## Decision Context

Choosing the approach for receiving and sending webhooks.

---

## Decision Criteria

* webhook volume
* operational maturity
* budget
* feature requirements

---

## Decision Tree

Is webhook volume <10,000 events per day?
↓
YES → Use self-hosted Spatie (spatie/laravel-webhook-client + spatie/laravel-webhook-server)
  ↓
  Need custom signature validation per provider?
  ↓
  YES → Spatie implements SignatureValidator interface — one class per provider
  NO → Spatie's default HMAC validator covers standard cases
  ↓
  Queue infrastructure available?
  ↓
  YES → Spatie queue-first processing works out of box
  NO → Sync processing (not recommended — risk provider timeout)
NO → Volume >10K/day?
  ↓
  YES → Evaluate managed webhook gateway (Convoy, Svix)
    ↓
  Ops team scaling issue (maintaining self-hosted infrastructure)?
  ↓
  YES → Managed gateway reduces ops burden — worth the cost
  NO → Self-hosted Spatie still viable at 10K-100K/day with proper queue scaling
↓
  Need advanced features (retry analytics, dead-letter queue dashboard, multi-region)?
  ↓
  YES → Managed gateway provides built-in analytics and infrastructure
  NO → Spatie + custom dead-letter queue handles most use cases
↓
  Budget for managed gateway?
  ↓
  YES → Evaluate Svix (mature, good docs) or Convoy (open-source core)
  NO → Spatie self-hosted with dedicated queue workers

---

## Rationale

Spatie is battle-tested for most Laravel webhook use cases up to 10K-100K/day. Managed gateways provide operational relief and advanced analytics at a cost. Self-hosted is cheaper but requires queue infrastructure maintenance.

---

## Recommended Default

**Default:** Spatie for <10K events/day; Svix for >10K/day with ops team scaling concerns
**Reason:** Spatie is cost-effective and well-integrated with Laravel; managed gateways pay for themselves in ops time at higher volumes

---

## Risks Of Wrong Choice

Managed gateway at low volume wastes budget. Spatie at high volume without proper queue scaling causes webhook processing bottlenecks. No signature verification (regardless of package) allows spoofed events.

---

## Related Rules/Skills

* 03-webhooks: incoming/webhook-receiving (Spatie config details)
* ku-aie-005: Package Landscape (full webhook package comparison)

---

---

## Circuit Breaker Package Selection

---

## Decision Context

Choosing the circuit breaker approach for protecting external API calls.

---

## Decision Criteria

* call context (sync vs queue)
* storage backend
* failure tolerance
* monitoring requirements

---

## Decision Tree

Are the API calls made from synchronous context (controllers, services)?
↓
YES → Use algoyounes/laravel-circuit-breaker (sync-first, cache-backed)
  ↓
  Redis available as cache driver?
  ↓
  YES → Redis-backed circuit breaker (fast state checks, 1-5ms)
  NO → Cache/database fallback (slower, but functional)
  ↓
  Multiple downstream services to protect?
  ↓
  YES → One circuit breaker instance per service (stripe, mailgun, etc.)
  NO → Single circuit breaker is sufficient
NO → Are the API calls made from queue jobs (async)?
  ↓
  YES → Use harris21/laravel-fuse (queue-specific circuit breaker)
  ↓
  Jobs should fail fast when service is unavailable?
  ↓
  YES → Fuse releases job immediately on open circuit (no worker wasted)
  NO → Need custom retry-with-circuit-breaker logic
NO → Either context could apply?
  ↓
  Both sync and async contexts?
  ↓
  YES → algoyounes for sync, Fuse for queue — or abstract behind CircuitManager
  NO → Pick the package matching your primary context
↓
  Need custom failure threshold per service?
  ↓
  YES → Both packages support configurable thresholds — configure per service
  NO → Default thresholds (3-5 failures in 30s) acceptable for all
↓
  Monitoring and alerting on state transitions?
  ↓
  YES → Both support event listeners — log transitions for alerting
  NO → State transitions invisible — silent degradation

---

## Rationale

algoyounes is optimized for synchronous HTTP calls with cache-backed state. harris21/laravel-fuse is designed for queue jobs to prevent worker waste on unavailable services. Using both in a dual-context application is valid with proper abstraction.

---

## Recommended Default

**Default:** algoyounes/laravel-circuit-breaker for sync calls; harris21/laravel-fuse for queue jobs — implement CircuitManager abstraction for dual-context apps
**Reason:** Each package is optimized for its context; abstraction layer enables unified monitoring

---

## Risks Of Wrong Choice

No circuit breaker on queue jobs causes workers to grind to a halt during provider outage. Fuse for sync calls adds unnecessary complexity. Single circuit breaker across all services allows one failure to cascade.

---

## Related Rules/Skills

* 04-resilience: circuit-breaker (circuit breaker pattern details)
* ku-aie-005: Package Landscape (full circuit breaker comparison)
