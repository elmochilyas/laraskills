---
id: ku-01
title: "Streaming Fundamentals - Rules"
subdomain: "streaming-real-time-ai"
ku-type: "foundation"
date-created: "2026-06-02"
---

## Rules for Streaming Fundamentals

### R1: Always flush output buffer immediately on first token
- **Category:** Performance
- **Rule:** Never buffer the entire LLM response before sending to the client — always flush the first chunk as soon as it arrives to minimize Time-to-First-Token (TTFT).
- **Reason:** Perceived latency is dominated by TTFT. Users perceive a 200ms TTFT + streaming as faster than a 2s complete response, even if total generation time is identical.
- **Bad Example:** Collecting all `StreamChunk` objects into an array and returning a single JSON response after the stream finishes.
- **Good Example:** Calling `ob_implicit_flush(true)` and `flush()` after emitting the first event chunk in the streaming loop, then flushing at regular intervals (every N tokens or every 50ms).
- **Exceptions:** Batch/background processing where the client expects a complete response (API-to-API calls, webhook delivery).
- **Consequences of Violation:** Users see a blank screen for 2-10 seconds, then receive the entire response at once, defeating the UX purpose of streaming entirely.

### R2: Always detect and terminate stream on client disconnection
- **Category:** Cost Management
- **Rule:** Call `connection_aborted()` in every streaming loop iteration and break immediately if the client has disconnected.
- **Reason:** Streaming connections are long-lived. Without disconnection detection, the LLM continues generating tokens (and accruing cost) for disconnected clients, with no benefit to anyone.
- **Bad Example:** A streaming foreach loop that processes every chunk without checking `connection_aborted()`.
- **Good Example:** `foreach ($stream as $chunk) { if (connection_aborted()) break; ... }` with a finally block that cleans up provider-side stream resources.
- **Exceptions:** Internal async processes where disconnection is handled by the queued job lifecycle.
- **Consequences of Violation:** Unbounded cost from orphaned streaming sessions, degraded server capacity as phantom connections hold PHP-FPM workers.

### R3: Prefer SSE over WebSockets for unidirectional server-to-client streaming
- **Category:** Architecture
- **Rule:** Choose Server-Sent Events (SSE) as the default streaming transport when the client only needs to receive data from the server; reserve WebSockets for bidirectional communication.
- **Reason:** SSE uses standard HTTP, works through existing proxies and load balancers, has native browser `EventSource` API support with auto-reconnection, and is simpler to implement and scale than WebSockets.
- **Bad Example:** Implementing a full Laravel Reverb WebSocket server for a chat interface where the user only reads incoming AI responses.
- **Good Example:** Returning `response()->stream(...)` with `Content-Type: text/event-stream` headers for a streaming AI chat endpoint, using `EventSource` on the client side.
- **Exceptions:** Collaborative editing, live transcription with user corrections, multi-user agent sessions where the client must send data simultaneously.
- **Consequences of Violation:** Unnecessary infrastructure complexity, increased operational cost (Reverb server), and more complex client-side reconnection logic.

### R4: Always configure nginx buffering off for SSE streaming endpoints
- **Category:** Infrastructure
- **Rule:** Set `X-Accel-Buffering: no` in the streaming response header and add `proxy_buffering off;` for the streaming route in the nginx configuration.
- **Reason:** nginx buffers proxy responses by default (typically 4KB), which delays all token delivery until the buffer fills or the response completes — defeating the purpose of streaming.
- **Bad Example:** A streaming SSE endpoint behind default nginx config where tokens arrive in bursts every 4KB or only after the response completes.
- **Good Example:** Laravel response emits header `X-Accel-Buffering: no` and `Cache-Control: no-cache`, plus nginx location block has `proxy_buffering off; proxy_cache off;`.
- **Exceptions:** Internal API-to-API streaming where buffering is acceptable and throughput is prioritized over latency.
- **Consequences of Violation:** Users experience no improvement over non-streaming responses; tokens arrive in bursts or only at response completion, wasting the streaming implementation effort.

### R5: Set explicit streaming timeouts at every infrastructure layer
- **Category:** Reliability
- **Rule:** Configure `max_execution_time` in PHP, `proxy_read_timeout` in nginx, and provider-side timeout to match the longest expected stream duration (typically 120-300 seconds).
- **Reason:** Streaming connections are long-lived by nature. Default timeouts (30s PHP, 60s nginx) will terminate streams mid-response for long generations or complex agent loops.
- **Bad Example:** A summarization agent that takes 90 seconds on a 10K-token document crashes at 60 seconds due to default nginx `proxy_read_timeout`.
- **Good Example:** Setting `proxy_read_timeout 180s` in nginx, `set_time_limit(180)` in the streaming controller, and configuring provider timeout to 180s.
- **Exceptions:** Short-response streaming (simple chat replies under 10 seconds) can use default timeouts.
- **Consequences of Violation:** Intermittent mid-stream disconnections that are hard to debug, user-facing errors that appear non-deterministic, and a poor reliability reputation.

### R6: Always send metadata events alongside content tokens in the stream
- **Category:** Observability
- **Rule:** Emit structured SSE events for metadata (finish reason, token usage, errors) as distinct event types, not just content tokens.
- **Reason:** The client needs metadata to know when the stream is complete, how many tokens were consumed, and whether errors occurred. Without metadata events, the client must guess completion status or rely on connection closure.
- **Bad Example:** A stream that sends only JSON `{"content": "...\n"}` lines without `event:` types or completion metadata.
- **Good Example:** Events with types `event: token\n`, `event: error\n`, `event: done\n` where `done` includes usage data and finish reason.
- **Exceptions:** Prototype-level streaming where the client only needs raw text tokens and completion is signaled by connection close.
- **Consequences of Violation:** Clients cannot distinguish between a completed response and a dropped connection; token usage data is lost, preventing cost tracking.

### R7: Implement a unified streaming response DTO for both streaming and non-streaming code paths
- **Category:** Maintainability
- **Rule:** Create a single response DTO (`StreamChunk` or similar) that can be emitted as a stream or collected into a complete response, avoiding separate code paths.
- **Reason:** Maintaining two separate response pipelines (one for streaming, one for complete) doubles maintenance burden and increases the risk of behavior divergence.
- **Bad Example:** A `ChatController` with separate methods `streamChat()` that emits SSE, and `chat()` that returns JSON, both with duplicated logic.
- **Good Example:** A unified `StreamHandler` that processes `StreamChunk` objects and either emits them via SSE or accumulates them into a complete `AgentResponse`.
- **Exceptions:** When provider APIs have fundamentally different formats for streaming vs. non-streaming that cannot be unified.
- **Consequences of Violation:** Code duplication leads to subtle bugs where streaming and non-streaming behaviors diverge; fixes must be applied in two places.
