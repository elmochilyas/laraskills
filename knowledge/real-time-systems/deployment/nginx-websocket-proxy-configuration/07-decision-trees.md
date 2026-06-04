# Metadata

**Domain:** Real-Time Systems
**Subdomain:** Scaling & Production Architecture
**Knowledge Unit:** Nginx WebSocket Proxy Configuration
**Generated:** 2026-06-03

---

# Decision Inventory

* Location Block Structure: Single vs Split /app/ and /apps/
* Proxy Buffering Strategy: On vs Off
* Proxy Timeout Configuration

---

# Architecture-Level Decision Trees

---

## Location Block Structure: Single vs Split /app/ and /apps/

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Reverb exposes two path types: `/app/` for WebSocket connections and `/apps/` for HTTP API endpoints (connection counts, health checks). Engineers must decide whether to use a single catch-all location or separate location blocks with different configurations.

---

## Decision Criteria

* performance considerations — matching efficiency; configuration duplication
* architectural considerations — WebSocket upgrade headers are only needed for /app/
* security considerations — API endpoint access control
* maintainability considerations — DRY vs explicit configuration

---

## Decision Tree

How should location blocks be structured?
↓
Does the deployment use Reverb's HTTP API endpoints (/apps/)?
YES → [Split location blocks: /app/ with upgrade headers, /apps/ with HTTP settings]
NO → Is there potential future use of HTTP API endpoints?
    YES → [Split location blocks for future-proofing]
    NO → [Single /app/ location block — simpler]

---

## Rationale

Split location blocks are strongly recommended because `/app/` requires WebSocket upgrade headers (`proxy_set_header Upgrade $http_upgrade`, `proxy_set_header Connection "Upgrade"`) while `/apps/` uses standard HTTP proxying. A single catch-all location applies upgrade headers to HTTP API calls, which is harmless but semantically incorrect. More importantly, separate blocks allow different timeouts, buffering, and access control per path.

---

## Recommended Default

**Default:** Separate `/app/` and `/apps/` location blocks in the Nginx server block
**Reason:** Correct WebSocket upgrade headers for the WebSocket path; standard HTTP proxying for API paths; allows independent configuration per path

---

## Risks Of Wrong Choice

Missing the `/apps/` location silently breaks Reverb HTTP API calls (connection counts, health checks). Applying upgrade headers to all paths is harmless but may confuse debugging.

---

## Related Rules

Always Configure Both `/app/` and `/apps/` Location Blocks (05-rules.md)

---

## Related Skills

Configure Nginx as a WebSocket Proxy for Reverb (06-skills.md)

---

## Proxy Buffering Strategy: On vs Off

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Nginx buffers responses by default before sending them to clients. For streaming protocols (WebSocket, SSE), buffering delays delivery, causes bursty output, and can cause connections to hang. The engineer must choose whether to disable proxying.

---

## Decision Criteria

* performance considerations — memory usage per connection with/without buffering
* architectural considerations — streaming vs request-response protocols
* security considerations — slow client DoS without buffering
* maintainability considerations — debugging buffering issues

---

## Decision Tree

Should proxy buffering be disabled?
↓
Is Nginx proxying WebSocket or SSE traffic?
YES → [proxy_buffering off — required for streaming protocols]
NO → Is Nginx proxying standard HTTP API traffic?
    YES → [proxy_buffering on (default) — standard for HTTP]
    NO → [Evaluate based on protocol requirements]

---

## Rationale

Proxy buffering must be disabled for all streaming protocols (WebSocket, SSE) because the connection is long-lived and data must flow continuously. With buffering enabled, Nginx collects response data before sending it to the client, introducing latency and potentially causing the connection to hang when buffer thresholds are reached. For standard HTTP API calls, buffering improves efficiency by reducing the number of write syscalls.

---

## Recommended Default

**Default:** `proxy_buffering off` for WebSocket and SSE endpoints; default `on` for HTTP API endpoints
**Reason:** Streaming protocols require real-time delivery; buffering introduces unacceptable latency

---

## Risks Of Wrong Choice

Buffering enabled for WebSocket/SSE causes delayed delivery, bursty output, and connection hangs. Buffering disabled for HTTP APIs increases write syscalls slightly.

---

## Related Rules

Always Disable Proxy Buffering (05-rules.md)

---

## Related Skills

Configure Nginx as a WebSocket Proxy for Reverb (06-skills.md)

---

## Proxy Timeout Configuration

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Default Nginx `proxy_read_timeout` (60s) kills idle connections prematurely. WebSocket connections may remain idle for longer periods between events. The engineer must choose timeout values that match expected session duration.

---

## Decision Criteria

* performance considerations — connection churn from premature termination
* architectural considerations — alignment with Reverb's activity_timeout and ping_interval
* security considerations — timeout prevents resource exhaustion from dead connections
* maintainability considerations — single timeout value vs multiple timeouts

---

## Decision Tree

How should proxy timeouts be configured?
↓
What is the expected maximum idle time between WebSocket messages?
< 60 seconds → [proxy_read_timeout 120s — safety margin above default]
60-300 seconds → [proxy_read_timeout 600s — standard for interactive apps]
300+ seconds → [proxy_read_timeout 3600s — long-lived connections]
↓
Is `proxy_send_timeout` also configured?
YES → Verify it matches proxy_read_timeout
NO → [Configure proxy_send_timeout to match proxy_read_timeout]

---

## Rationale

The proxy timeout must exceed Reverb's `activity_timeout` + `ping_interval` combined to prevent Nginx from killing connections before Reverb detects disconnection. For most applications, 3600s (1 hour) is a safe default that accommodates even very long idle periods without excessive connection churn. The send timeout should match the read timeout for symmetry.

---

## Recommended Default

**Default:** `proxy_read_timeout 3600s` and `proxy_send_timeout 3600s`
**Reason:** Accommodates any reasonable idle period; prevents premature disconnections; single value simplifies configuration

---

## Risks Of Wrong Choice

Too-low timeout (default 60s) causes frequent premature disconnections, triggering unnecessary reconnection storms. Excessive timeout (86400s) accumulates stale connections if the application doesn't clean them up.

---

## Related Rules

Always Set `proxy_read_timeout` to Match Expected Session Duration (05-rules.md)

---

## Related Skills

Configure Nginx as a WebSocket Proxy for Reverb (06-skills.md)
