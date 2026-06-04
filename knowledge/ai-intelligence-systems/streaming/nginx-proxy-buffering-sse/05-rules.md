---
id: KU-049
title: "Nginx Proxy Buffering for SSE - Rules"
subdomain: "streaming"
ku-type: "implementation"
date-created: "2026-06-02"
---

## Rules for Nginx Proxy Buffering for SSE

### R1: Apply proxy_buffering off only to streaming locations, never globally
- **Category:** Infrastructure
- **Rule:** Configure `proxy_buffering off` inside a specific `location` block for SSE/streaming endpoints; never apply it at the `http` or `server` level.
- **Reason:** Disabling proxy buffering globally increases CPU and memory usage for all responses. Non-streaming endpoints benefit from buffering (reduced backend load, better throughput).
- **Bad Example:** Adding `proxy_buffering off;` to the top-level `http` block, affecting every proxied response including static assets and API calls.
- **Good Example:** `location /ai/stream { proxy_buffering off; proxy_cache off; proxy_set_header X-Accel-Buffering no; }`
- **Exceptions:** Dedicated streaming servers where every endpoint is a streaming endpoint.
- **Consequences of Violation:** Unnecessary CPU overhead on non-streaming responses, reduced throughput for static assets, and increased nginx memory usage.

### R2: Always disable gzip compression for SSE streaming responses
- **Category:** Performance
- **Rule:** Add `gzip off;` or exclude `text/event-stream` MIME type from gzip compression for SSE endpoints.
- **Reason:** Gzip compression works by buffering content before compressing. SSE streaming relies on immediate data delivery — buffering for compression destroys the real-time nature of streaming.
- **Bad Example:** Default nginx config that applies gzip to all text responses including `text/event-stream`.
- **Good Example:** `gzip_types text/plain text/css application/json;` (excluding `text/event-stream`), or `location /ai/stream { gzip off; }`.
- **Exceptions:** n/a
- **Consequences of Violation:** SSE tokens arrive in compressed batches rather than individually, defeating the purpose of streaming and creating the same UX as buffered responses.

### R3: Match proxy_read_timeout to the longest expected stream duration
- **Category:** Reliability
- **Rule:** Set `proxy_read_timeout` to at least the maximum expected SSE stream duration (typically 120-300 seconds); avoid the 60-second default.
- **Reason:** nginx's default `proxy_read_timeout` of 60 seconds terminates any streaming connection that doesn't send data within that window. Long AI generations, tool calls, or agent loops frequently exceed 60 seconds.
- **Bad Example:** A 90-second AI summarization task that consistently fails with "upstream timed out" (504) at exactly 60 seconds.
- **Good Example:** `proxy_read_timeout 180s;` in the streaming location block, matching the application's `max_execution_time`.
- **Exceptions:** Short-stream-only applications with guaranteed response times under 30 seconds.
- **Consequences of Violation:** Intermittent 504 errors for longer AI responses, confusing UX where long queries fail while short queries succeed, increased support tickets.

### R4: Implement SSE heartbeat events to prevent proxy idle timeouts
- **Category:** Reliability
- **Rule:** Send an SSE comment event (`: heartbeat\n\n`) every 15-30 seconds during streaming to prevent proxies, load balancers, and CDN edge nodes from closing idle connections.
- **Reason:** Many infrastructure components (ALB, CloudFront, Cloudflare, corporate proxies) have idle timeouts (30-300s) that close connections without data. A heartbeat keeps the connection alive.
- **Bad Example:** An SSE stream that only emits tokens during AI generation, with a 90-second tool execution pause causing a proxy timeout mid-response.
- **Good Example:** A timer-based heartbeat function that emits `echo ": heartbeat\n\n"; flush();` every 20 seconds regardless of whether tokens are being generated.
- **Exceptions:** Internal networks where all proxy timeouts are configured to exceed the maximum stream duration.
- **Consequences of Violation:** Mid-stream disconnections during long tool execution pauses, requiring client reconnection and potentially losing stream state.
