---
id: ku-03
title: "Streaming with Tool Calls - Rules"
subdomain: "streaming-real-time-ai"
ku-type: "implementation"
date-created: "2026-06-02"
---

## Rules for Streaming with Tool Calls

### R1: Always accumulate tool call deltas server-side, never forward raw partial JSON to the client
- **Category:** Architecture
- **Rule:** Implement a `ToolCallStreamAccumulator` on the server that collects partial tool call deltas across chunks and emits complete tool calls only when fully accumulated.
- **Reason:** Tool call arguments arrive as fragmented JSON across multiple stream chunks. Forwarding raw deltas to the client forces the client to handle accumulation logic, duplicates work, and risks exposing malformed data.
- **Bad Example:** Passing `$chunk->toolCalls` directly to the frontend as-is, expecting the client to concatenate partial argument strings.
- **Good Example:** A server-side accumulator that merges deltas by `tool_call_id`, appends `arguments` fragments, and only emits the complete tool call (with valid JSON) when `finish_reason === 'tool_calls'`.
- **Exceptions:** When building a real-time UI that needs to show tool call progress, emit status events (not raw deltas) for display purposes.
- **Consequences of Violation:** Client crashes from invalid JSON parsing, tool calls with missing arguments, and inconsistent behavior across different client implementations.

### R2: Never validate tool call arguments on partial deltas — only validate after full accumulation
- **Category:** Security
- **Rule:** Defer all tool argument validation (type checks, enum values, bounds) until the tool call is fully accumulated and the finish reason signals completion.
- **Reason:** Partial JSON is structurally invalid by definition. Attempting to validate incomplete arguments produces false positives (validation failures) and may throw exceptions from malformed data.
- **Bad Example:** Calling `json_decode($partialArgs)` and validating against a schema inside the accumulation loop for every delta.
- **Good Example:** Accumulating all deltas first, then on `finish_reason === 'tool_calls'` decode the complete `arguments` JSON and run validation.
- **Exceptions:** Syntax-level checks (e.g., detecting that the partial JSON isn't entirely malformed) can run during accumulation for early error detection.
- **Consequences of Violation:** False validation failures that reject valid tool calls, runtime exceptions from invalid JSON operations, and wasted LLM retries.

### R3: Handle interleaved content and tool calls in the same stream iteration
- **Category:** Reliability
- **Rule:** Process text chunks and tool call deltas in the same stream loop iteration; emit text content immediately and accumulate tool calls simultaneously.
- **Reason:** Many models interleave text content and tool calls (text, then tool call, then more text). Processing them separately breaks the output order and causes rendering issues.
- **Bad Example:** A streaming loop that handles only text OR tool calls per iteration, or stops processing text when a tool call delta arrives.
- **Good Example:** A loop that checks both `$chunk->content` (emit immediately) and `$chunk->toolCalls` (pass to accumulator) in every iteration without blocking either.
- **Exceptions:** Providers that guarantee tool calls as separate, non-interleaved events (rare — check provider documentation).
- **Consequences of Violation:** Text appears after tool calls in the wrong order, or text is lost entirely when tool calls are present in the stream.

### R4: Pause the stream during tool execution and send status events to the client
- **Category:** UX
- **Rule:** When a complete tool call is accumulated, pause token emission, execute the tool, and send a status event (`tool_started`, `tool_completed` or `tool_error`) to the client before resuming.
- **Reason:** Without status events, the client UI appears frozen during tool execution. Users cannot distinguish between "the AI is thinking" and "the tool is running."
- **Bad Example:** Silently executing a database query tool during streaming while the client shows no indication of activity.
- **Good Example:** Emitting `event: tool_started\n` with the tool name and arguments, executing the tool, then emitting `event: tool_completed\n` with the result summary before resuming text token emission.
- **Exceptions:** Sub-50ms tool executions where the latency is below the perceptual threshold.
- **Consequences of Violation:** Users experience unexplained pauses and may assume the streaming connection dropped, causing them to refresh or abandon the session.

### R5: Set timeouts on tool execution during streaming to prevent stalled streams
- **Category:** Reliability
- **Rule:** Enforce a maximum execution time (default 30s) per tool call during streaming and handle timeout by emitting a `tool_timeout` error event to the stream.
- **Reason:** A long-running or hanging tool execution blocks the entire stream, preventing content tokens from reaching the client. The client has no feedback about why the stream stalled.
- **Bad Example:** A tool that makes an external HTTP call with no timeout, blocking the streaming agent loop for several minutes.
- **Good Example:** Configuring `$tool->timeout(15)` for each tool, catching `TimeoutException`, emitting an error SSE event, and continuing the stream without the tool result.
- **Exceptions:** Tools whose execution time is critical to the response (e.g., web search) may have higher timeouts with user-facing progress indicators.
- **Consequences of Violation:** Stalled streaming sessions that hold PHP-FPM workers indefinitely, cascading connection pool exhaustion and application-wide unavailability.
