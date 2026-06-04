# Metadata

**Domain:** Real-Time Systems
**Subdomain:** WebSocket Servers
**Knowledge Unit:** Reverb Connection Lifecycle & State Management
**Generated:** 2026-06-03

---

# Decision Inventory

* Timeout Tuning Strategy: activity_timeout and ping_interval
* Connection Limit Configuration: per-IP, Message Size, File Descriptors
* Event Loop Engine Selection: ext-uv vs ext-event vs stream_select

---

# Architecture-Level Decision Trees

---

## Timeout Tuning Strategy: activity_timeout and ping_interval

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Reverb's `activity_timeout` and `ping_interval` determine how quickly dead connections are detected and how often heartbeats are sent. Defaults work for many applications, but mobile apps with frequent disconnections and stable dashboards have very different needs.

---

## Decision Criteria

* performance considerations — heartbeat traffic overhead at scale
* architectural considerations — connection pattern (high-churn vs stable)
* security considerations — slow dead connection detection allows stale connections
* maintainability considerations — single tuning point vs per-app configuration

---

## Decision Tree

How should timeouts be tuned?
↓
What is the application's connection pattern?
High-churn (mobile, IoT, short-lived connections) → [activity_timeout=15, ping_interval=30]
Stable long-lived (dashboard, monitoring) → [activity_timeout=60, ping_interval=120]
Mixed or unknown → [activity_timeout=30, ping_interval=60 (defaults)]
↓
Is `stopwaitsecs` (Supervisor) aligned with these values?
YES → [Tuning complete — stopwaitsecs >= 2x activity_timeout]
NO → [Set stopwaitsecs to at least 2x activity_timeout]

---

## Rationale

High-churn connections benefit from shorter timeouts because dead connections must be detected quickly to free resources and avoid stale state in presence channels. Mobile apps with frequent network transitions should detect disconnection within 15-30 seconds. Stable long-lived connections (dashboards, monitoring panels) benefit from longer timeouts because they reduce heartbeat traffic and prevent false timeouts on slow networks. The defaults (30s/60s) are appropriate for mixed usage. The Supervisor `stopwaitsecs` must always be tuned in tandem to ensure graceful shutdown.

---

## Recommended Default

**Default:** `activity_timeout=30`, `ping_interval=60` — appropriate for mixed workloads
**Reason:** Balances timely dead connection detection with reasonable heartbeat traffic

---

## Risks Of Wrong Choice

Too-low timeout disconnects legitimate idle connections. Too-high timeout delays dead connection detection, accumulating stale state and wasting resources.

---

## Related Rules

Always Configure `activity_timeout` and `ping_interval` Appropriately (05-rules.md)

---

## Related Skills

Manage Reverb Connection Lifecycle and State (06-skills.md)

---

## Connection Limit Configuration: per-IP, Message Size, File Descriptors

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Without limits, a single compromised client can exhaust server resources: open unlimited connections, send oversized messages, or consume all file descriptors. Limits must be configured at multiple levels.

---

## Decision Criteria

* performance considerations — resource usage per connection and message
* architectural considerations — OS-level vs application-level limits
* security considerations — DoS prevention; abuse protection
* maintainability considerations — limit tuning based on usage patterns

---

## Decision Tree

How should connection limits be configured?
↓
Is the application internet-facing with untrusted clients?
YES → [Configure all limits: max_connections_per_ip, max_message_size, fd limits]
NO → Is the application internal on a trusted network?
    YES → [Limit message size; per-IP limit may be relaxed]
    NO → [Configure all limits for defense in depth]
↓
What are the specific values?
max_connections_per_ip → [100 (prevents single-source exhaust)]
max_message_size → [10000 bytes (10KB, prevents memory abuse)]
OS file descriptor limit → [ulimit -n 65536 (accommodates 10k+ connections)]
↓
Is `ext-uv` or `ext-event` installed for > 1024 connections?
YES → [No fd limit concern — event loop handles high concurrency]
NO → [Install ext-uv or limit connections to < 1024]

---

## Rationale

Limits must be applied at three layers: application (`max_connections_per_ip`, `max_message_size`), OS (`ulimit -n`), and engine (`ext-uv`). 100 connections per IP prevents a single compromised client from exhausting server resources while allowing legitimate multi-tab usage. 10KB message size prevents memory exhaustion from oversized payloads. Without `ext-uv`, PHP's `stream_select` is limited to 1024 file descriptors, which directly caps concurrent connections.

---

## Recommended Default

**Default:** `max_connections_per_ip=100`, `max_message_size=10000`, `ulimit -n 65536`, install `ext-uv`
**Reason:** Multi-layered protection prevents resource exhaustion at every level

---

## Risks Of Wrong Choice

No per-IP limit allows a DoS from a single client. No message size limit enables memory exhaustion. No `ext-uv` caps connections at 1024.

---

## Related Rules

Always Configure `max_connections_per_ip` (05-rules.md)

---

## Related Skills

Manage Reverb Connection Lifecycle and State (06-skills.md)

---

## Event Loop Engine Selection: ext-uv vs ext-event vs stream_select

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Reverb uses PHP's event loop for handling concurrent connections. The default `stream_select` engine is limited to 1024 connections. `ext-uv` and `ext-event` remove this limit. The engineer must choose the appropriate engine.

---

## Decision Criteria

* performance considerations — event loop scalability and throughput
* architectural considerations — extension availability on the platform
* security considerations — event loop hang detection and mitigation
* maintainability considerations — extension installation and updates

---

## Decision Tree

Which event loop engine should be used?
↓
What is the expected peak concurrent connection count?
< 1024 connections → [stream_select — sufficient; no extension needed]
1,024 - 10,000 connections → [ext-uv — simpler install; good performance]
10,000+ connections → [ext-event — higher performance; more complex install]
↓
Is the platform shared hosting (no extension installation permission)?
YES → [stream_select — limited to 1024 connections; plan for scaling]
NO → Is Docker used?
    YES → [Install ext-uv via Dockerfile; simpler than ext-event]
    NO → [Install ext-uv via PECL: pecl install uv]

---

## Rationale

`ext-uv` is the recommended engine for deployments exceeding 1024 connections because it's a single `pecl install uv` command, well-maintained, and provides excellent performance for Reverb's ReactPHP-based event loop. `ext-event` offers slightly higher performance but requires libevent headers and is more complex to install. `stream_select` is the fallback with no extensions needed but is limited to 1024 concurrent connections due to OS `select()` semantics.

---

## Recommended Default

**Default:** Install `ext-uv` via PECL or Docker for any deployment exceeding 1024 connections
**Reason:** Simple install; removes the 1024 connection cap; well-maintained for PHP event loops

---

## Risks Of Wrong Choice

No extension caps production at 1024 connections, causing connection rejection as traffic grows. `ext-event` is harder to install and maintain than `ext-uv` for marginal performance gain.

---

## Related Rules

Always Install `ext-uv` or `ext-event` for High-Connection Deployments (05-rules.md)

---

## Related Skills

Manage Reverb Connection Lifecycle and State (06-skills.md)
