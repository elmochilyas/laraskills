---
id: ku-03
title: "Streaming with Tool Calls"
subdomain: "streaming-real-time-ai"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "emerging"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/streaming-real-time-ai/ku-03/04-standardized-knowledge.md"
---

# Streaming with Tool Calls

## Overview

Streaming with tool calls (also called streaming function calling) is the process of receiving tool call requests incrementally while streaming the LLM response. Unlike text-only streaming where each chunk contains text tokens, tool call streaming involves tool call deltas — partial JSON that must be accumulated to form the complete tool call arguments. This is more complex than text streaming because tool call arguments can arrive across multiple chunks, and the client or server must accumulate them until the tool call is complete.

## Core Concepts

- **Tool Call Delta:** A streaming chunk containing a partial tool call — may include tool index, ID, function name, or argument fragment.
- **Tool Call Accumulation:** The process of collecting tool call deltas from the stream until the complete tool call is ready for execution.
- **Parallel Tool Streaming:** Multiple tool calls may be streamed in parallel (interleaved deltas). Each tool call is accumulated independently.
- **Streaming Mode:** How the provider delivers tool calls during streaming — some send tool calls as distinct events, others embed them in content deltas.
- **Tool Call vs. Content Interleaving:** Some models can generate text and tool calls in the same stream (content, then tool call, then more content).
- **Streaming Tool Call Validation:** Validating tool call arguments incrementally as they arrive (or after accumulation).
- **Client-Side Accumulation vs. Server-Side:** Deciding where to accumulate tool call deltas — client-side (real-time UI updates) or server-side (execution before forwarding).

## When To Use

- Agentic systems where users need real-time visibility into tool calls (showing "Searching..." while search executes).
- Streaming chat interfaces where the model uses tools (the user sees tool calls happen in real time).
- Multi-turn streaming agents where tool results influence subsequent tokens.

## When NOT To Use

- Non-streaming applications (standard tool calling is simpler).
- Systems where tool calls are always hidden from the user (accumulate silently on the server).
- When the provider's streaming tool call API is unreliable or poorly documented.

## Best Practices

- **Accumulate tool calls server-side.** The server is better equipped to handle partial deltas, validate arguments, and execute tools.
- **Emit tool call status events.** Send events to the client: "tool_started", "tool_completed", so the UI can show progress.
- **Handle interleaved content + tool calls.** The stream may contain text, then a tool call, then more text. Process each independently.
- **Validate tool call arguments after accumulation.** Don't attempt to validate partial JSON — it will be invalid.
- **Include tool call IDs in status events.** The client needs to correlate tool calls with their results.
- **Set timeouts for tool execution during streaming.** A tool that takes too long blocks the stream.

## Architecture Guidelines

- Implement a **streaming tool call accumulator** that collects deltas and emits complete tool call events.
- The accumulator should handle **multiple concurrent tool calls** — each identified by its `tool_call_id`.
- After tool call accumulation, **pause the stream** (or buffer), execute the tool, and inject the result into the stream context.
- For real-time UI, emit **status events** between tool call start and completion.
- Use a **stream state machine**: streaming → tool_call_pending → tool_executing → tool_completed → streaming (or finished).

## Performance Considerations

- Tool call accumulation adds minimal overhead (<0.1ms per delta).
- Tool execution during streaming adds latency proportional to the tool's execution time. The stream pauses until the tool result is available.
- Parallel tool call streaming: if the provider sends multiple tool call deltas interleaved, accumulation is O(n) per delta.
- Streaming buffer for tool execution: the server may need to buffer tokens generated during tool execution (if the model generates content while waiting for tool results).
- Client-side accumulation reduces server load but increases client complexity.

## Security Considerations

- **Tool call validation:** Accumulated tool call arguments must be validated before execution (same as non-streaming tool calls).
- **Delayed tool execution:** If the stream pauses for tool execution, ensure the connection doesn't time out.
- **Tool result injection:** When injecting tool results back into the stream, apply the same sanitization as context injection.
- **Partial argument leakage:** Never expose partial/accumulating tool call arguments to the client (may be invalid or contain injection patterns).
- **Tool call replay:** Ensure tool call IDs are unique and once a tool is executed, it cannot be re-triggered by replaying deltas.

## Common Mistakes

- Attempting to validate tool call arguments before they're fully accumulated (partial JSON is always invalid).
- Not handling the case where the model generates text after a tool call (interleaved content is common).
- Exposing raw tool call deltas to the client — the client receives malformed JSON fragments.
- Not pausing the stream during tool execution — tokens generated during tool execution are lost or arrive out of order.
- Assuming tool calls arrive in a single chunk — most providers split tool calls across multiple deltas.

## Anti-Patterns

- **Client-Side Accumulation Only:** Relying entirely on the client to accumulate tool call deltas. The server should handle accumulation for reliability.
- **No Tool Call Visibility:** Executing tools silently during streaming without the client knowing what's happening.
- **Blocking Stream for Tools:** Pausing the entire stream while a tool executes, including not sending already-generated tokens.
- **Ignoring Tool Errors in Stream:** If a tool fails during streaming, the error should be sent to the client and the stream should continue or fail gracefully.
- **One-Stream-Per-Tool:** Opening separate streams for content and tool calls. One stream handles everything.

## Examples

### Tool Call Stream Accumulator
```php
class ToolCallStreamAccumulator {
    /** @var array<string, array> Accumulating tool calls by ID */
    private array $toolCalls = [];

    public function accumulate(StreamChunk $chunk): ?array {
        if (empty($chunk->toolCalls)) return null;

        foreach ($chunk->toolCalls as $delta) {
            $id = $delta['id'];
            if (!isset($this->toolCalls[$id])) {
                $this->toolCalls[$id] = [
                    'id' => $id,
                    'name' => $delta['name'] ?? '',
                    'arguments' => '',
                ];
            }
            if (isset($delta['name'])) {
                $this->toolCalls[$id]['name'] .= $delta['name'];
            }
            if (isset($delta['arguments'])) {
                $this->toolCalls[$id]['arguments'] .= $delta['arguments'];
            }
        }

        // Check if all tool calls are complete
        // (finish_reason === 'tool_calls' signals completion)
        return $chunk->finishReason === 'tool_calls'
            ? array_values($this->toolCalls)
            : null;
    }
}
```

### Streaming Agent Loop with Tools
```php
class StreamingAgentLoop {
    public function stream(Request $request): void {
        $accumulator = new ToolCallStreamAccumulator();

        foreach ($this->llm->stream($messages) as $chunk) {
            if (connection_aborted()) break;

            $completeToolCalls = $accumulator->accumulate($chunk);

            // Send content tokens immediately
            if ($chunk->content) {
                $this->emitToken($chunk->content);
            }

            // When tool calls are complete, execute and continue
            if ($completeToolCalls) {
                $this->emitToolStatus('executing', $completeToolCalls);
                $results = $this->executeTools($completeToolCalls);
                $this->emitToolStatus('completed', $completeToolCalls);

                // Stream the next iteration with tool results
                $messages = array_merge($messages, ...$results);
                $this->stream($request); // recursive for simplicity
                return;
            }

            if ($chunk->finishReason === 'stop') break;
        }
    }
}
```

## Related Topics

- ku-01 (Streaming Fundamentals): Base streaming concepts.
- ku-02 (WebSockets & Real-Time Communication): Streaming tool calls over WebSocket.
- agent-architecture-orchestration/ku-05: Tool calling in agent loops.
- llm-provider-abstraction/ku-06: Provider-specific tool call streaming formats.

## AI Agent Notes

- When asked to implement streaming with tool calls, first understand: which provider, whether tool call streaming is supported, and the delta format.
- For streaming tool call bugs, check: delta accumulation logic, interleaved content handling, and tool execution during streaming.
- Prefer reading the provider's tool call stream format documentation before writing accumulation code.
- When generating streaming tool call code, include: delta accumulator, partial content emission, tool execution with status events, and stream continuation.

## Verification

- [ ] Tool call deltas are accumulated server-side (not passed raw to the client).
- [ ] Accumulator handles multiple concurrent tool calls (interleaved deltas).
- [ ] Content tokens are emitted during streaming even when tool calls are being accumulated.
- [ ] Tool calls are validated after full accumulation (not on partial deltas).
- [ ] Tool execution during streaming emits status events (started, completed, error).
- [ ] Stream continues after tool results are injected.
- [ ] Timeouts are set for tool execution during streaming (to prevent stalled streams).
