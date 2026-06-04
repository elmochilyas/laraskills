# Metadata

**Domain:** Real-Time Systems
**Subdomain:** SSE (Server-Sent Events)
**Knowledge Unit:** SSE Implementation in Laravel
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Category |
|---|----------|----------|
| 1 | SSE vs WebSocket for server-to-client push | architectural |
| 2 | Connection duration ceiling strategy | performance |
| 3 | Native SSE vs Wave package | architectural |

---

# Architecture-Level Decision Trees

---

## SSE vs WebSocket

---

## Decision Context

Choosing between SSE and WebSocket for a server-to-client real-time feature.

---

## Decision Criteria

* architectural
* performance
* maintainability

---

## Decision Tree

Need bidirectional communication (client can also send data)?
↓
YES → Need binary data streaming?
    ↓
    YES → **WebSocket** — binary frames, full-duplex
    NO → Can client use HTTP POST for sending data?
        ↓
        YES → **SSE + POST pattern** — simpler infrastructure
        NO → **WebSocket**
NO → Infrastructure supports WebSocket (sticky sessions, ports)?
    ↓
    YES → **SSE** preferred — simpler, HTTP-only, auto-reconnect
    NO → **SSE** — works through any HTTP proxy/CDN

---

## Rationale

SSE is pure HTTP streaming — no upgrade handshake, no special proxy configuration beyond disabling buffering. WebSocket requires protocol upgrade, sticky sessions for load balancing, and WebSocket-aware infrastructure. For server-to-client-only use cases, SSE is the simpler choice.

---

## Recommended Default

**Default:** SSE for server-to-client push, WebSocket for bidirectional
**Reason:** SSE uses standard HTTP infrastructure; EventSource auto-reconnects; no sticky sessions or special ports needed.

---

## Risks Of Wrong Choice

WebSocket for server-to-client-only adds infrastructure complexity without benefit. SSE for bidirectional requires workarounds (SSE + POST pattern).

---

## Related Rules

Always Set X-Accel-Buffering: no Behind Nginx, Use Max Duration Ceiling for SSE

---

## Related Skills

Implement SSE in Laravel

---

---

## Connection Duration Ceiling Strategy

---

## Decision Context

How long to keep an SSE connection open before forcing reconnection.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Using PHP-FPM (not FrankenPHP or Swoole)?
↓
YES → Each SSE connection holds a PHP-FPM worker?
    ↓
    YES → **Set MAX_DURATION (30-60s)** — prevents worker pool exhaustion
    NO → Worker pool sized for SSE connections?
        ↓
        YES → Longer durations possible; still set ceiling for safety
        NO → **Set MAX_DURATION** — free workers for HTTP requests
NO → Using FrankenPHP or Swoole/Octane?
    ↓
    YES → **Longer durations possible** — not limited by PM.max_children

---

## Rationale

Each SSE connection occupies one PHP-FPM worker for its entire duration. Without a connection ceiling, long-lived SSE connections exhaust the worker pool (`pm.max_children`), causing HTTP requests to queue. EventSource auto-reconnects, making reconnection transparent to the client.

---

## Recommended Default

**Default:** 60-second connection ceiling for PHP-FPM deployments
**Reason:** Prevents worker exhaustion while EventSource's auto-reconnect provides continuous event delivery.

---

## Risks Of Wrong Choice

No ceiling exhausts PHP-FPM workers, blocking HTTP requests. Too-short ceiling (<30s) causes excessive reconnection overhead.

---

## Related Rules

Always Set Connection Duration Ceiling for PHP-FPM

---

## Related Skills

Implement SSE in Laravel

---

---

## Native SSE vs Wave Package

---

## Decision Context

Whether to implement SSE natively or use `qruto/laravel-wave` for Echo-compatible SSE.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Need Echo-compatible client code (`.listen()`, `.notification()`)?
↓
YES → Need bidirectional client events (whispers, typing)?
    ↓
    YES → **WebSocket needed** — Wave is unidirectional only
    NO → **Wave** — Echo-compatible SSE, no frontend code changes
NO → Simple server-to-client streaming?
    ↓
    YES → **Native SSE** — simpler, no package dependency
    NO → Complex channel subscription pattern?
        ↓
        YES → **Wave** — channel abstraction built-in
        NO → **Native SSE**

---

## Rationale

Native SSE provides direct control but requires manual channel management, auth, and client code. Wave provides Echo compatibility, allowing existing WebSocket frontend code to work over SSE without changes.

---

## Recommended Default

**Default:** Native SSE for simple streaming; Wave for Echo-compatible SSE
**Reason:** Native SSE has zero dependencies; Wave is useful when migrating from WebSocket or maintaining Echo-based client code.

---

## Risks Of Wrong Choice

Wave is a community package — maintenance risk, may lag behind Echo API changes. Native SSE requires building channel subscription and auth logic from scratch.

---

## Related Rules

Have a Fallback Plan for Community Package Dependencies

---

## Related Skills

Implement SSE in Laravel, Integrate Laravel Wave SSE Package
