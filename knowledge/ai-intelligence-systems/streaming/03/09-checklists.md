# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** streaming
**Knowledge Unit:** ku-03
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Accumulate tool calls server-side.
- [ ] Emit tool call status events.
- [ ] Handle interleaved content + tool calls.
- [ ] Include tool call IDs in status events.
- [ ] Set timeouts for tool execution during streaming.
- [ ] Accumulator handles multiple concurrent tool calls (interleaved deltas).
- [ ] Content tokens are emitted during streaming even when tool calls are being accumulated.
- [ ] Stream continues after tool results are injected.
- [ ] Rules for Streaming with Tool Calls
- [ ] Accumulator handles multiple concurrent tool calls (interleaved deltas)
- [ ] Content tokens are emitted during streaming even when tool calls are being accumulated
- [ ] Stream continues after tool results are injected
- [ ] **Accumulate tool call deltas**: For each chunk, if `$chunk->toolCalls` is present, pass each delta to the accumulator. Deltas contain partial `id`, `name`, and `arguments` fragments that need concatenation.
- [ ] **Check for complete tool calls**: When `$chunk->finishReason === 'tool_calls'`, all tool call deltas are complete. Retrieve fully accumulated tool calls from the accumulator (valid JSON in `arguments`).
- [ ] **Complete the stream**: When final `finish_reason === 'stop'` is received with no pending tool calls, emit `event: done` and clean up.
- [ ] Accumulated tool call arguments pass schema validation before execution
- [ ] Content tokens rendered continuously during streaming, even when tool calls accumulate
- [ ] Multiple parallel tool calls accumulate independently and execute correctly

---

# Architecture Checklist

- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization
- [ ] Implement auto-scaling and queue-based processing for peak loads
- [ ] Implement defense layers: input validation, output guarding, and content filtering

---

# Implementation Checklist

- [ ] Accumulate tool calls server-side.
- [ ] Emit tool call status events.
- [ ] Handle interleaved content + tool calls.
- [ ] Include tool call IDs in status events.
- [ ] Set timeouts for tool execution during streaming.
- [ ] Validate tool call arguments after accumulation.
- [ ] **Accumulate tool call deltas**: For each chunk, if `$chunk->toolCalls` is present, pass each delta to the accumulator. Deltas contain partial `id`, `name`, and `arguments` fragments that need concatenation.
- [ ] **Check for complete tool calls**: When `$chunk->finishReason === 'tool_calls'`, all tool call deltas are complete. Retrieve fully accumulated tool calls from the accumulator (valid JSON in `arguments`).
- [ ] **Complete the stream**: When final `finish_reason === 'stop'` is received with no pending tool calls, emit `event: done` and clean up.
- [ ] **Emit tool status events**: Before executing, emit `event: tool_started` with tool name and (sanitized) arguments to the client for UI feedback.
- [ ] **Execute tools**: For each complete tool call, validate arguments against the schema, execute the tool with timeout (default 30s), capture the result. Handle multiple parallel tool calls if present.
- [ ] **Handle tool execution results**: On success, emit `event: tool_completed` with a summary. On timeout, emit `event: tool_timeout`. On error, emit `event: tool_error` with the error message.

---

# Performance Checklist

- [ ] Client-side accumulation reduces server load but increases client complexity.
- [ ] Parallel tool call streaming: if the provider sends multiple tool call deltas interleaved, accumulation is O(n) per delta.
- [ ] Streaming buffer for tool execution: the server may need to buffer tokens generated during tool execution (if the model generates content while waiting for tool results).
- [ ] Tool call accumulation adds minimal overhead (<0.1ms per delta).
- [ ] Tool execution during streaming adds latency proportional to the tool's execution time. The stream pauses until the tool result is available.
- [ ] Status events add minimal overhead (<1ms per event)

---

# Security Checklist

- [ ] Delayed tool execution:
- [ ] Partial argument leakage:
- [ ] Tool call replay:
- [ ] Tool call validation:
- [ ] Tool result injection:
- [ ] Accumulated tool call arguments must be validated before execution (injection prevention)
- [ ] Never expose partial/accumulating tool call arguments to the client (may contain injection patterns)
- [ ] Sanitize tool results before emitting status events (no raw data leakage)

---

# Reliability Checklist

- [ ] Assuming tool calls arrive in a single chunk â€” most providers split tool calls across multiple deltas.
- [ ] Attempting to validate tool call arguments before they're fully accumulated (partial JSON is always invalid).
- [ ] Exposing raw tool call deltas to the client â€” the client receives malformed JSON fragments.
- [ ] Not handling the case where the model generates text after a tool call (interleaved content is common).
- [ ] Not pausing the stream during tool execution â€” tokens generated during tool execution are lost or arrive out of order.

---

# Testing Checklist

- [ ] Accumulated tool call arguments pass schema validation before execution
- [ ] Accumulator handles multiple concurrent tool calls (interleaved deltas)
- [ ] Accumulator handles multiple concurrent tool calls (interleaved deltas).
- [ ] Content tokens are emitted during streaming even when tool calls are being accumulated
- [ ] Content tokens are emitted during streaming even when tool calls are being accumulated.
- [ ] Content tokens rendered continuously during streaming, even when tool calls accumulate
- [ ] Multiple parallel tool calls accumulate independently and execute correctly
- [ ] Stream continues after tool results are injected
- [ ] Stream continues after tool results are injected.
- [ ] Stream resumes after tool results are injected with updated context

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [No Token Count Tracking During Streaming]
- [ ] [Stream Continuing Beyond User's Token Budget]
- [ ] [No Early Stop When Token Budget Exceeded]
- [ ] [Token Count Not Displayed to User]
- [ ] [No Capped Token Limit for Streaming Requests]
- [ ] Blocking Stream for Tools:
- [ ] Client-Side Accumulation Only:
- [ ] Ignoring Tool Errors in Stream:
- [ ] No Tool Call Visibility:
- [ ] One-Stream-Per-Tool:

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


