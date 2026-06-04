# Skill: Stream Tool Calls and Agent Loops

## Purpose
Implement streaming tool call accumulation and execution within agent loops, handling interleaved content and tool call deltas across multiple chunks, with status events emitted for real-time user visibility.

## When To Use
- Agentic systems where users need real-time visibility into tool calls
- Streaming chat interfaces where the model uses tools
- Multi-turn streaming agents where tool results influence subsequent tokens
- Applications requiring parallel tool call execution during streaming

## When NOT To Use
- Non-streaming applications (standard tool calling is simpler)
- Systems where tool calls are always hidden from the user (accumulate silently on the server)
- When the provider's streaming tool call API is unreliable or poorly documented

## Prerequisites
- KU-01 (Streaming Fundamentals) — understanding of stream chunks, SSE, TTFT
- KU-02 (WebSockets & Real-Time Communication) — for WebSocket-based tool call streaming
- Agent-architecture/orchestration KU-05 (Tool Calling) — tool definition and execution
- Provider that supports streaming tool calls (OpenAI, Anthropic, Gemini)
- Tool definitions registered and available for execution

## Inputs
- LLM stream iterator (yielding StreamChunk objects)
- Tool definitions (name, description, parameters JSON schema)
- Tool execution callbacks (registered handlers per tool)
- Status event emitter (for real-time client updates)
- Timeout configuration per tool

## Workflow
1. **Initialize the tool call accumulator**: Create a `ToolCallStreamAccumulator` instance that maintains a map of tool call deltas by `tool_call_id`.
2. **Start the streaming loop**: Iterate over the LLM stream, processing each `StreamChunk`.
3. **Process content tokens**: For each chunk, if `$chunk->content` is present, emit it immediately to the client via the stream. Do not buffer content.
4. **Accumulate tool call deltas**: For each chunk, if `$chunk->toolCalls` is present, pass each delta to the accumulator. Deltas contain partial `id`, `name`, and `arguments` fragments that need concatenation.
5. **Check for complete tool calls**: When `$chunk->finishReason === 'tool_calls'`, all tool call deltas are complete. Retrieve fully accumulated tool calls from the accumulator (valid JSON in `arguments`).
6. **Emit tool status events**: Before executing, emit `event: tool_started` with tool name and (sanitized) arguments to the client for UI feedback.
7. **Execute tools**: For each complete tool call, validate arguments against the schema, execute the tool with timeout (default 30s), capture the result. Handle multiple parallel tool calls if present.
8. **Handle tool execution results**: On success, emit `event: tool_completed` with a summary. On timeout, emit `event: tool_timeout`. On error, emit `event: tool_error` with the error message.
9. **Inject results and continue**: Append tool results to the messages array and continue the streaming loop with the updated context. The model may generate more content or additional tool calls.
10. **Complete the stream**: When final `finish_reason === 'stop'` is received with no pending tool calls, emit `event: done` and clean up.

## Validation Checklist
- [ ] Tool call deltas are accumulated server-side (not passed raw to the client)
- [ ] Accumulator handles multiple concurrent tool calls (interleaved deltas)
- [ ] Content tokens are emitted during streaming even when tool calls are being accumulated
- [ ] Tool calls are validated after full accumulation (not on partial deltas)
- [ ] Tool execution during streaming emits status events (started, completed, error)
- [ ] Stream continues after tool results are injected
- [ ] Timeouts are set for tool execution during streaming (to prevent stalled streams)

## Common Failures
- **Partial JSON validation errors**: Attempting to validate tool call arguments before full accumulation. Fix: defer all validation until `finish_reason === 'tool_calls'`.
- **Out-of-order content**: Interleaved content and tool calls rendered incorrectly. Fix: process both `content` and `toolCalls` in the same loop iteration — content is emitted, deltas are accumulated.
- **Stalled stream during tool execution**: Tool execution blocks the stream indefinitely. Fix: set tool timeouts (default 30s), catch timeouts, emit error, continue.
- **Lost tool results**: Tool results not injected back into the conversation context. Fix: append tool results to messages array and continue streaming.
- **Client UI freeze during tool execution**: No status events emitted. Fix: emit `tool_started` before execution and `tool_completed`/`tool_error` after.

## Decision Points
- **Server-side vs. client-side accumulation**: Always accumulate server-side for reliability. Client-side accumulation is only for real-time UI preview (emit status events, not raw deltas).
- **Sequential vs. parallel tool execution**: Parallel for independent tools (search + database lookup). Sequential for dependent tools (search result → summarization).
- **Tool timeout duration**: 30s default for external API calls. 5s for local/quick tools. Higher (60s) for complex tools like web searches.

## Performance Considerations
- Tool call accumulation adds <0.1ms per delta
- Tool execution during streaming pauses the stream for the duration of execution
- Parallel tool execution reduces total pause time but increases complexity
- Status events add minimal overhead (<1ms per event)
- Streaming buffer during tool execution: may need to hold generated tokens if the model continues generating during execution

## Security Considerations
- Accumulated tool call arguments must be validated before execution (injection prevention)
- Never expose partial/accumulating tool call arguments to the client (may contain injection patterns)
- Tool call IDs must be unique; prevent replay attacks by tracking executed tool call IDs
- Tool execution inherits all security considerations of the underlying tool (database access, API calls)
- Sanitize tool results before emitting status events (no raw data leakage)

## Related Rules
- Always accumulate tool call deltas server-side, never forward raw partial JSON to the client
- Never validate tool call arguments on partial deltas — only validate after full accumulation
- Handle interleaved content and tool calls in the same stream iteration
- Pause the stream during tool execution and send status events to the client
- Set timeouts on tool execution during streaming to prevent stalled streams

## Related Skills
- Skill: Implement LLM Response Streaming with SSE (ku-01)
- Skill: Implement WebSocket Streaming for Bidirectional AI Communication (ku-02)
- Skill: Optimize Streaming Performance (ku-04)
- Skill: Build an Agent Loop with Tool Calling (agent-ku-05)

## Success Criteria
- Tool call deltas accumulate correctly across multiple chunks with valid JSON output
- Content tokens rendered continuously during streaming, even when tool calls accumulate
- Multiple parallel tool calls accumulate independently and execute correctly
- Tool execution status events reach the client in real-time
- Stream resumes after tool results are injected with updated context
- Tool execution timeouts prevent stalled streams beyond 30 seconds
- Accumulated tool call arguments pass schema validation before execution