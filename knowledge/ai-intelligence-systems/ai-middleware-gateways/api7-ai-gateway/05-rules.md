---
id: KU-029 (AI Middleware)
title: "API7 AI Gateway - Rules"
subdomain: "ai-middleware-gateways"
ku-type: "implementation"
date-created: "2026-06-02"
---

## Rules for API7 AI Gateway

### R1: Implement layered inspection — API7 gateway-level and Laravel middleware-level together
- **Category:** Security
- **Rule:** Configure API7's prompt inspection plugin for network-layer content filtering and Laravel's agent middleware for application-layer context-aware security; never rely on only one layer.
- **Reason:** API7 sees the raw HTTP request without application context (user roles, session state). Laravel middleware has application context but can be bypassed if code is modified. Both layers together provide defense-in-depth.
- **Bad Example:** Deploying API7's prompt inspection plugin as the only content filtering measure, with no Laravel-side middleware.
- **Good Example:** API7 blocks injection patterns at the network layer; Laravel agent middleware adds user-specific policy enforcement and PII redaction.
- **Exceptions:** Simple pass-through applications where API7 handles all security.
- **Consequences of Violation:** Application-context-dependent attacks bypass API7's generic inspection; network-layer-only attacks bypass Laravel middleware if application code has a vulnerability.

### R2: Implement semantic cache invalidation based on source data version, not just TTL
- **Category:** Reliability
- **Rule:** Include a source data version hash in the semantic cache key and invalidate cached responses when the underlying data changes; never rely solely on TTL-based cache expiration.
- **Reason:** TTL-based invalidation serves stale responses until the TTL expires. For applications whose data changes frequently (e.g., product catalog, knowledge base), users receive outdated AI responses.
- **Bad Example:** Semantic cache configured with a 1-hour TTL — product price changes take up to an hour to reflect in cached AI responses.
- **Good Example:** Cache key includes `md5($sourceData)`: `cache:semantic:{query_hash}:{source_version_hash}` — any data change immediately produces a new cache entry.
- **Exceptions:** Static knowledge base content that never changes between deployments.
- **Consequences of Violation:** Users receive stale or incorrect AI responses containing outdated information, eroding trust in the application.

### R3: Route requests through API7 in both development and production to ensure behavioral parity
- **Category:** Reliability
- **Rule:** Configure the development environment to send AI requests through the same API7 gateway (or a local dev instance) that production uses; never bypass the gateway during development.
- **Reason:** API7 plugins modify requests (add headers, transform bodies, cache responses) in ways that cannot be replicated in a gateway-less dev environment. Issues surface only after production deployment.
- **Bad Example:** Development environment sends requests directly to providers while production routes through API7; a prompt inspection plugin change breaks requests in production only.
- **Good Example:** Docker Compose includes a local API7 instance with the same plugin configuration as production.
- **Exceptions:** When API7 is a managed cloud service with no local development equivalent.
- **Consequences of Violation:** Production-only failures from gateway interactions that were never tested in development, requiring emergency rollbacks.
