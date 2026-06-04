# Knowledge Unit: Streaming with Tool Calls

## Metadata

- **ID:** ku-03
- **Subdomain:** Streaming & Real-Time AI
- **Slug:** streaming-with-tool-calls
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Streaming with tool calls (also called streaming function calling) is the process of receiving tool call requests incrementally while streaming the LLM response. Unlike text-only streaming where each chunk contains text tokens, tool call streaming involves tool call deltas â€” partial JSON that must be accumulated to form the complete tool call arguments. This is more complex than text streaming because tool call arguments can arrive across multiple chunks, and the client or server must accumulate them until the tool call is complete.

## Core Concepts

- **Tool Call Delta:** A streaming chunk containing a partial tool call â€” may include tool index, ID, function name, or argument fragment.
- **Tool Call Accumulation:** The process of collecting tool call deltas from the stream until the complete tool call is ready for execution.
- **Parallel Tool Streaming:** Multiple tool calls may be streamed in parallel (interleaved deltas). Each tool call is accumulated independently.
- **Streaming Mode:** How the provider delivers tool calls during streaming â€” some send tool calls as distinct events, others embed them in content deltas.
- **Tool Call vs. Content Interleaving:** Some models can generate text and tool calls in the same stream (content, then tool call, then more content).
- **Streaming Tool Call Validation:** Validating tool call arguments incrementally as they arrive (or after accumulation).
- **Client-Side Accumulation vs. Server-Side:** Deciding where to accumulate tool call deltas â€” client-side (real-time UI updates) or server-side (execution before forwarding).

## Mental Models

- **Tool Call Delta:** A streaming chunk containing a partial tool call â€” may include tool index, ID, function name, or argument fragment.
- **Tool Call Accumulation:** The process of collecting tool call deltas from the stream until the complete tool call is ready for execution.
- **Parallel Tool Streaming:** Multiple tool calls may be streamed in parallel (interleaved deltas). Each tool call is accumulated independently.


## Internal Mechanics

The internal mechanics of Streaming with Tool Calls follow established patterns within the Streaming & Real-Time AI domain. The implementation leverages the Laravel AI SDK conventions and ecosystem best practices.

- **Accumulate tool calls server-side.** The server is better equipped to handle partial deltas, validate arguments, and execute tools.
- **Emit tool call status events.** Send events to the client: "tool_started", "tool_completed", so the UI can show progress.
- **Handle interleaved content + tool calls.** The stream may contain text, then a tool call, then more text. Process each independently.
- **Validate tool call arguments after accumulation.** Don't attempt to validate partial JSON â€” it will be invalid.
- **Include tool call IDs in status events.** The client needs to correlate tool calls with their results.
- **Set timeouts for tool execution during streaming.** A tool that takes too long blocks the stream.

## Patterns

- **Accumulate tool calls server-side.** The server is better equipped to handle partial deltas, validate arguments, and execute tools.
- **Emit tool call status events.** Send events to the client: "tool_started", "tool_completed", so the UI can show progress.
- **Handle interleaved content + tool calls.** The stream may contain text, then a tool call, then more text. Process each independently.
- **Validate tool call arguments after accumulation.** Don't attempt to validate partial JSON â€” it will be invalid.
- **Include tool call IDs in status events.** The client needs to correlate tool calls with their results.
- **Set timeouts for tool execution during streaming.** A tool that takes too long blocks the stream.

## Architectural Decisions

- Implement a **streaming tool call accumulator** that collects deltas and emits complete tool call events.
- The accumulator should handle **multiple concurrent tool calls** â€” each identified by its `tool_call_id`.
- After tool call accumulation, **pause the stream** (or buffer), execute the tool, and inject the result into the stream context.
- For real-time UI, emit **status events** between tool call start and completion.
- Use a **stream state machine**: streaming â†’ tool_call_pending â†’ tool_executing â†’ tool_completed â†’ streaming (or finished).

## Tradeoffs

Standard approach vs Custom implementation is the primary tradeoff in this KU. Standard implementations offer faster development and community support but may have overhead. Custom implementations provide tailored solutions at the cost of maintenance burden.

## Performance Considerations

- Tool call accumulation adds minimal overhead (<0.1ms per delta).
- Tool execution during streaming adds latency proportional to the tool's execution time. The stream pauses until the tool result is available.
- Parallel tool call streaming: if the provider sends multiple tool call deltas interleaved, accumulation is O(n) per delta.
- Streaming buffer for tool execution: the server may need to buffer tokens generated during tool execution (if the model generates content while waiting for tool results).
- Client-side accumulation reduces server load but increases client complexity.

## Production Considerations

- **Tool call validation:** Accumulated tool call arguments must be validated before execution (same as non-streaming tool calls).
- **Delayed tool execution:** If the stream pauses for tool execution, ensure the connection doesn't time out.
- **Tool result injection:** When injecting tool results back into the stream, apply the same sanitization as context injection.
- **Partial argument leakage:** Never expose partial/accumulating tool call arguments to the client (may be invalid or contain injection patterns).
- **Tool call replay:** Ensure tool call IDs are unique and once a tool is executed, it cannot be re-triggered by replaying deltas.

## Common Mistakes

- Attempting to validate tool call arguments before they're fully accumulated (partial JSON is always invalid).
- Not handling the case where the model generates text after a tool call (interleaved content is common).
- Exposing raw tool call deltas to the client â€” the client receives malformed JSON fragments.
- Not pausing the stream during tool execution â€” tokens generated during tool execution are lost or arrive out of order.
- Assuming tool calls arrive in a single chunk â€” most providers split tool calls across multiple deltas.

## Failure Modes

- **Client-Side Accumulation Only:** Relying entirely on the client to accumulate tool call deltas. The server should handle accumulation for reliability.
- **No Tool Call Visibility:** Executing tools silently during streaming without the client knowing what's happening.
- **Blocking Stream for Tools:** Pausing the entire stream while a tool executes, including not sending already-generated tokens.
- **Ignoring Tool Errors in Stream:** If a tool fails during streaming, the error should be sent to the client and the stream should continue or fail gracefully.
- **One-Stream-Per-Tool:** Opening separate streams for content and tool calls. One stream handles everything.

## Ecosystem Usage

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

## Related Knowledge Units

- ku-01 (Streaming Fundamentals): Base streaming concepts.
- ku-02 (WebSockets & Real-Time Communication): Streaming tool calls over WebSocket.
- agent-architecture-orchestration/ku-05: Tool calling in agent loops.
- llm-provider-abstraction/ku-06: Provider-specific tool call streaming formats.

## Research Notes

Source: Domain analysis for AI and Intelligence Systems (Laravel/PHP ecosystem)
Source: Laravel AI SDK documentation and ecosystem package references

