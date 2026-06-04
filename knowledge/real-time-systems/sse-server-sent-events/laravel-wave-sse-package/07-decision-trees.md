# Metadata

**Domain:** Real-Time Systems
**Subdomain:** SSE (Server-Sent Events)
**Knowledge Unit:** Laravel Wave SSE Package
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Category |
|---|----------|----------|
| 1 | Wave vs Reverb for Echo-compatible broadcasting | architectural |
| 2 | Wave event buffer configuration | performance |
| 3 | Wave horizontal scaling approach | architectural |

---

# Architecture-Level Decision Trees

---

## Wave vs Reverb

---

## Decision Context

Choosing between Wave (SSE) and Reverb (WebSocket) for Echo-compatible broadcasting.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Need bidirectional client events (whispers, typing indicators)?
↓
YES → **Reverb** — Wave is SSE-only, unidirectional
NO → Need guaranteed delivery or message persistence?
    ↓
    YES → **Reverb** — Wave is fire-and-forget over HTTP
    NO → Infrastructure supports WebSocket (sticky sessions, open ports)?
        ↓
        YES → Prefer first-party supported package?
            ↓
            YES → **Reverb**
            NO → **Wave** — simpler HTTP-only infrastructure
        NO → **Wave** — SSE works through any HTTP proxy

---

## Rationale

Wave eliminates WebSocket infrastructure entirely, using standard HTTP streaming. This is valuable when firewalls block WebSocket ports, shared hosting doesn't support long-running processes, or infrastructure simplicity is paramount. However, Wave is a community package with unidirectional limitations.

---

## Recommended Default

**Default:** Reverb for production-critical, bidirectional applications; Wave for HTTP-only environments
**Reason:** Reverb is first-party, actively maintained, and supports full Echo API including client events.

---

## Risks Of Wrong Choice

Wave for bidirectional features silently fails (client events don't work over SSE). Reverb in HTTP-only environments may require infrastructure changes.

---

## Related Rules

Test Echo Compatibility Thoroughly with Wave, Have a Fallback Plan

---

## Related Skills

Integrate Laravel Wave SSE Package, Set Up Reverb for Self-Hosted WebSocket

---

---

## Wave Event Buffer Configuration

---

## Decision Context

How to configure Wave's event buffer for reconnect replay.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Need event replay on client reconnection?
↓
YES → Expected disconnect frequency high (mobile users, unstable networks)?
    ↓
    YES → **Longer buffer TTL (30-60s)** — allow time for reconnect
    NO → **Short buffer TTL (5-15s)** — minimize memory usage
NO → **No buffer or TTL=0** — fire-and-forget, no replay

---

## Rationale

Wave buffers broadcast events in Redis for replay when clients reconnect. The buffer TTL determines how long events are retained. Longer TTL increases Redis memory usage but provides more reliable delivery across disconnections.

---

## Recommended Default

**Default:** 15-second event buffer TTL
**Reason:** Most clients reconnect within seconds; 15s provides a reasonable replay window without excessive Redis memory usage.

---

## Risks Of Wrong Choice

No buffer means all events are lost on disconnect. Too-long buffer consumes Redis memory proportional to event volume.

---

## Related Rules

Configure Event Buffer with Appropriate TTL

---

## Related Skills

Integrate Laravel Wave SSE Package

---

---

## Wave Horizontal Scaling

---

## Decision Context

How to scale Wave across multiple application servers.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Multiple application servers running Wave?
↓
YES → Redis available for pub/sub?
    ↓
    YES → **Use Redis pub/sub** — cross-server event fan-out
    NO → All clients connect to same server?
        ↓
        YES → No scaling needed
        NO → Events only reach clients on originating server
            ↓
            YES → **Deploy Redis** or use single server
NO → Single server deployment — no cross-server concerns

---

## Rationale

Wave's channel subscription registry is in-memory per server. Without Redis pub/sub, events broadcast on one server only reach clients connected to that server. Redis is required for cross-server event distribution.

---

## Recommended Default

**Default:** Redis pub/sub for multi-server Wave deployments
**Reason:** Required for cross-server event distribution; same pattern as Reverb horizontal scaling.

---

## Risks Of Wrong Choice

Multi-server Wave without Redis creates isolated broadcasting — clients on different servers never see each other's events.

---

## Related Rules

Always Configure Redis for Horizontal Scaling

---

## Related Skills

Scale Reverb Horizontally with Redis Pub/Sub
