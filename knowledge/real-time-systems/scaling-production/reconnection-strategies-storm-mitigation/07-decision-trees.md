# Metadata

**Domain:** Real-Time Systems
**Subdomain:** Scaling & Production Architecture
**Knowledge Unit:** Reconnection Strategies & Storm Mitigation
**Generated:** 2026-06-03

---

# Decision Inventory

* Jitter Strategy Selection
* Circuit Breaker Threshold Configuration
* Auth Endpoint Rate Limiting Strategy

---

# Architecture-Level Decision Trees

---

## Jitter Strategy Selection

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Engineers must choose a jitter strategy for client-side reconnection backoff. Without jitter, all clients reconnect in synchronized waves even with exponential backoff, producing repeated peak loads that overwhelm the server.

---

## Decision Criteria

* performance considerations — spreading reconnection load across time to avoid peak overload
* architectural considerations — client-side logic complexity and configuration surface area
* security considerations — preventing coordinated retry storms from compromised clients
* maintainability considerations — simplicity of implementation and debugging

---

## Decision Tree

What jitter strategy should be used for client reconnection?
↓
Is connection count > 500 concurrent clients?
YES → [Full Jitter: sleep(random(0, min(cap, base * 2^n)))]
NO → Is connection count > 50 concurrent clients?
    YES → [Full Jitter: sleep(random(0, min(cap, base * 2^n)))]
    NO → [No jitter needed — storm is unlikely]

---

## Rationale

Full jitter (`random(0, backoffValue)`) is the safest default because it completely eliminates synchronization between clients. Exponential backoff alone produces waves where all clients retry at the same exponential intervals. Even equal jitter (±50% of backoff) can produce overlapping retry windows. Full jitter spreads reconnection uniformly across the backoff interval. For low-traffic applications with <50 connections, a reconnection storm is statistically unlikely and the complexity of jitter may not be justified.

---

## Recommended Default

**Default:** Full jitter: `sleep(random(0, min(cap, base * 2^n)))`
**Reason:** Completely eliminates synchronized retry waves regardless of client count; simple to implement with a single `Math.random()` call

---

## Risks Of Wrong Choice

No jitter leads to synchronized reconnection waves that repeatedly overwhelm the server. Equal jitter (±50%) can still produce overlapping retry windows when thousands of clients share the same base backoff calculation.

---

## Related Rules

Always Implement Jitter with Exponential Backoff (05-rules.md)

---

## Related Skills

Mitigate Reconnection Storms with Jitter, Rate Limiting, and Rolling Deployments (06-skills.md)

---

## Circuit Breaker Threshold Configuration

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

When the auth endpoint returns 429 (rate limited) or 503 (service unavailable), clients must decide how long to wait before retrying. Without a circuit breaker, they continue retrying at aggressive intervals, preventing the server from recovering.

---

## Decision Criteria

* performance considerations — giving the server time to recover vs reconnecting quickly
* architectural considerations — client-side state management for circuit breaker
* security considerations — preventing retry storm amplification
* maintainability considerations — threshold tuning and monitoring

---

## Decision Tree

How should the circuit breaker behave on auth endpoint errors?
↓
Is the error a 429 (rate limit) or 503 (service unavailable)?
YES → Double the backoff multiplier; track consecutive failures
NO → [Normal backoff with jitter]
↓
Have 3+ consecutive failures occurred?
YES → [Triple backoff multiplier; emit alert event to monitoring]
NO → [Double backoff multiplier; reset on successful auth]

---

## Rationale

The circuit breaker must distinguish between transient errors (single failure) and systemic overload (consecutive failures). A single 429 may be a harmless spike, but consecutive failures indicate the server is struggling. Doubling the backoff after the first failure gives the server breathing room. Tripling after 3+ failures provides stronger backpressure. The multiplier resets to 1 after a successful auth response, allowing normal reconnection speed once the server recovers.

---

## Recommended Default

**Default:** Double backoff multiplier on first 429/503; triple on 3+ consecutive failures; reset on success
**Reason:** Provides proportional backpressure; gentle enough for transient spikes but aggressive enough to prevent storm amplification

---

## Risks Of Wrong Choice

Too-aggressive backoff keeps clients disconnected long after the server has recovered. Too- lenient backoff prevents server recovery by maintaining high retry volume.

---

## Related Rules

Always Implement a Circuit Breaker for Auth Endpoint Errors (05-rules.md)

---

## Related Skills

Mitigate Reconnection Storms with Jitter, Rate Limiting, and Rolling Deployments (06-skills.md)

---

## Auth Endpoint Rate Limiting Strategy

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

The `/broadcasting/auth` endpoint is the choke point during reconnection storms. Without rate limiting, thousands of simultaneous auth requests overwhelm PHP-FPM, the database, and queue workers. The engineer must choose a rate limit threshold and scope.

---

## Decision Criteria

* performance considerations — auth endpoint throughput determines max sustainable reconnect rate
* architectural considerations — middleware stack, throttle configuration
* security considerations — DoS prevention, abuse protection
* maintainability considerations — tuning threshold per traffic patterns

---

## Decision Tree

How should the auth endpoint be rate limited?
↓
Is the application expecting > 1000 concurrent connections?
YES → Per-IP throttle: 100 requests per minute per IP
NO → Is the application expecting > 100 concurrent connections?
    YES → Global throttle: 60 requests per minute
    NO → [Standard throttle: 30 requests per minute]

---

## Rationale

Per-IP rate limiting is the most precise strategy: it prevents individual abusive clients from monopolizing auth capacity while allowing legitimate traffic from different IPs. For smaller deployments, a global throttle is simpler and sufficient. The threshold must account for both the reconnect wave (all clients reconnect once) and the auth endpoint's backend capacity (PHP-FPM, database query time for channel authorization).

---

## Recommended Default

**Default:** `throttle:60,1` middleware on `/broadcasting/auth` (60 requests per minute per IP)
**Reason:** Balances protection against abuse with allowing legitimate reconnection; works for most deployment sizes

---

## Risks Of Wrong Choice

Too-low limit rejects legitimate reconnect attempts, leaving clients disconnected. Too-high limit fails to protect the backend during storms, causing cascading failure.

---

## Related Rules

Always Apply `throttle` Middleware to the Auth Endpoint (05-rules.md)

---

## Related Skills

Mitigate Reconnection Storms with Jitter, Rate Limiting, and Rolling Deployments (06-skills.md)
