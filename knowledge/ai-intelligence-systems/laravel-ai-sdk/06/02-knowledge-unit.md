# Knowledge Unit: Tool Calling Across Providers

## Metadata

- **ID:** ku-06
- **Subdomain:** Laravel AI SDK
- **Slug:** tool-calling-across-providers
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Tool calling (function calling) varies significantly across LLM providers in schema format, invocation mechanics, parallel execution limits, and response structure. OpenAI uses "function calling" with `tools` parameter; Anthropic uses "tool use" with `tool_choice`; Google Gemini uses "tool configuration" with `function_declarations`. The provider abstraction layer must normalize these differences so that application code can use a unified tool calling interface regardless of the underlying provider.

## Core Concepts

- **Tool Schema Format:** Each provider expects tool schemas in a different JSON structure. The abstraction layer normalizes these.
- **Tool Choice:** How to specify whether the model must, may, or must not call tools â€” `auto`, `required`, `none`, or specific tool name.
- **Tool Call ID:** A unique identifier for each tool call request, used to correlate the result.
- **Parallel Tool Calls:** Some providers support multiple tool calls in one response; others only support one.
- **Tool Result Injection:** How tool results are returned to the model â€” different providers expect different message structures for tool results.
- **Tool Call Finish Reason:** The finish reason indicating a tool call (`tool_calls` for OpenAI, `tool_use` for Anthropic).
- **Streaming with Tools:** How tool calls are represented in streaming responses (delta format varies by provider).

## Mental Models

- **Tool Schema Format:** Each provider expects tool schemas in a different JSON structure. The abstraction layer normalizes these.
- **Tool Choice:** How to specify whether the model must, may, or must not call tools â€” `auto`, `required`, `none`, or specific tool name.
- **Tool Call ID:** A unique identifier for each tool call request, used to correlate the result.


## Internal Mechanics

The internal mechanics of Tool Calling Across Providers follow established patterns within the Laravel AI SDK domain. The implementation leverages the Laravel AI SDK conventions and ecosystem best practices.

- **Abstract tool schemas at the application layer.** Define tools using a provider-agnostic schema format and translate to provider-specific formats in the adapter.
- **Handle parallel tool calls uniformly.** Even if a provider returns one call at a time, the abstraction should return an array for consistency.
- **Normalize finish reasons.** Map provider-specific finish reasons (`tool_calls`, `tool_use`, `function_call`) to a common enum.
- **Test tool calling per provider.** Each provider's implementation has subtle differences that surface in integration tests.
- **Support tool choice mapping.** Map `auto`, `required`, `none` to provider-specific equivalents.

## Patterns

- **Abstract tool schemas at the application layer.** Define tools using a provider-agnostic schema format and translate to provider-specific formats in the adapter.
- **Handle parallel tool calls uniformly.** Even if a provider returns one call at a time, the abstraction should return an array for consistency.
- **Normalize finish reasons.** Map provider-specific finish reasons (`tool_calls`, `tool_use`, `function_call`) to a common enum.
- **Test tool calling per provider.** Each provider's implementation has subtle differences that surface in integration tests.
- **Support tool choice mapping.** Map `auto`, `required`, `none` to provider-specific equivalents.

## Architectural Decisions

- Implement tool schema translation as a **separate service** (`ToolSchemaTranslator`) used by the adapter, not inline in the adapter.
- The tool schema translator should support **bidirectional mapping**: application â†’ provider (for requests) and provider â†’ application (for responses).
- For parallel tool calls, the adapter should **collect all tool calls** from the response and return them as an array, regardless of how the provider delivers them.
- For streaming with tools, the adapter must handle the **delta format** â€” tool calls may arrive in multiple chunks that need to be accumulated.
- Tool results should be passed back to the model using the provider-specific message format (e.g., `role: 'tool'` for OpenAI, `role: 'user'` with `content` for Anthropic).

## Tradeoffs

Standard approach vs Custom implementation is the primary tradeoff in this KU. Standard implementations offer faster development and community support but may have overhead. Custom implementations provide tailored solutions at the cost of maintenance burden.

## Performance Considerations

- Schema translation adds 0.1-0.5ms per tool. Cache translated schemas where possible.
- Parallel tool call execution: the adapter should not wait for tool execution â€” it returns the calls, and the application layer executes them.
- Streaming with tools: tool call deltas may be interleaved with content deltas. Accumulate tool calls from the full stream.
- Schema translation caching: tool schemas rarely change within a session. Cache the translated version per provider.
- Tool call ID generation: use UUIDs (fast, unique). Avoid sequential IDs that could collide across parallel calls.

## Production Considerations

- **Tool schema validation:** Ensure tool schemas don't contain malicious content (e.g., injection via description fields).
- **Tool call validation:** Validate that tool call arguments are valid JSON and match the schema before execution.
- **Provider-specific limits:** Some providers limit the number of tools (e.g., 128 for OpenAI). Validate before sending.
- **Tool result size:** Large tool results may exceed context window limits. Implement size limits and truncation.
- **Tool call replay:** Ensure tool call IDs are unique per session to prevent replay attacks.

## Common Mistakes

- Assuming all providers use the same tool schema format â€” they don't. OpenAI uses JSON Schema; Anthropic uses a different structure.
- Not handling the case where a provider returns zero tool calls (model chose not to call any tool).
- Ignoring parallel tool call limits â€” some providers only support one tool call per response.
- Not mapping tool choice correctly â€” `tool_choice: 'auto'` in OpenAI is different from `tool_choice: 'any'` in Anthropic.
- Forgetting that tool results need special format handling â€” not all providers use `role: 'tool'`.

## Failure Modes

- **One-to-One Schema Copy:** Copying a provider's native tool schema format to other providers. Translate schemas appropriately.
- **Tool Choice Hardcoding:** Hardcoding `tool_choice: 'auto'` without considering that different providers handle this differently.
- **Ignoring Streaming Tool Calls:** Only supporting tool calls in non-streaming mode. Streaming agents need tool call support.
- **Tool Result Dumping:** Returning the full raw tool result to the model without formatting. Format tool results for the model's consumption.
- **Global Tool Registry:** Using the same tool registry for all providers without considering provider-specific limitations.

## Ecosystem Usage

### Tool Schema Translation
```php
class ToolSchemaTranslator {
    public function toOpenAI(Tool $tool): array {
        return [
            'type' => 'function',
            'function' => [
                'name' => $tool->name,
                'description' => $tool->description,
                'parameters' => $tool->parameters, // JSON Schema
            ],
        ];
    }

    public function toAnthropic(Tool $tool): array {
        return [
            'name' => $tool->name,
            'description' => $tool->description,
            'input_schema' => $tool->parameters, // JSON Schema
        ];
    }
}
```

### Unified Tool Call Response
```php
class ChatResponse {
    /** @return ToolCall[] */
    public function toolCalls(): array {
        return match($this->provider) {
            'openai' => array_map(
                fn($tc) => ToolCall::fromOpenAI($tc),
                $this->native['choices'][0]['message']['tool_calls'] ?? []
            ),
            'anthropic' => array_map(
                fn($tc) => ToolCall::fromAnthropic($tc),
                $this->native['content']
                    ->filter(fn($c) => $c['type'] === 'tool_use')
                    ->toArray()
            ),
            default => [],
        };
    }
}
```

## Related Knowledge Units

- ku-01 (Provider Abstraction Layer Design): The interface that includes tool calling.
- ku-02 (Provider Adapters): Adapters implement tool calling per provider.
- agent-architecture-orchestration/ku-05: Agent-level tool call execution.
- streaming-real-time-ai/ku-02: Streaming with tool calls.

## Research Notes

Source: Domain analysis for AI and Intelligence Systems (Laravel/PHP ecosystem)
Source: Laravel AI SDK documentation and ecosystem package references

