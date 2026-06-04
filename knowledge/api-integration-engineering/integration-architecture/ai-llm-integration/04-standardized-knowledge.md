# ECC Standardized Knowledge — AI/LLM API Integration Patterns (Streaming, SSE, Tool Calling)

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | integration-architecture |
| Knowledge Unit ID | ku-01 |
| Knowledge Unit | AI/LLM API Integration Patterns (Streaming, SSE, Tool Calling) |
| Difficulty | Expert |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K031, K001, K005, K008 |

## Overview (Engineering Value)
AI/LLM API integration introduces patterns distinct from traditional REST consumption: streaming HTTP via Server-Sent Events (SSE), token-aware rate limiting, tool/function calling with structured outputs, and context window management. Laravel's Http facade with streaming options and the emerging Laravel AI SDK provide the transport layer. PHP's synchronous execution model makes SSE bridging and backpressure management key engineering challenges.

## Core Concepts
- **SSE (Server-Sent Events)**: `text/event-stream` delivering tokens incrementally
- **Streaming HTTP**: `Http::withOptions(['stream' => true])` enables chunked response reading
- **Token-Aware Rate Limiting**: Rate limiting by token throughput (TPM/RPM) not request count
- **Tool/Function Calling**: LLM returns structured JSON triggering application function execution
- **Context Window**: Limited token workspace; manage via sliding window strategies

## When To Use
- Chat completion and text generation endpoints (streaming for low latency)
- Structured extraction/classification (non-streaming for complete JSON)
- Any LLM API integration requiring real-time response display
- Multi-turn conversations requiring context management

## When NOT To Use
- Simple classification with known response format (use non-streaming)
- Batch processing where latency is not user-facing
- Integration without token counting capability

## Best Practices
- Use streaming for chat to reduce perceived latency (first token within 500ms)
- Use non-streaming for extraction (complete JSON needed before processing)
- Implement token-aware rate limiting separate from request-count limiting
- Cache system prompts and common prefixes to reduce cost and latency
- Validate tool call arguments before execution

## Architecture Guidelines
- SSE bridging: PHP reads LLM stream → forwards to client via Laravel streamed response
- Token budget tracking across requests to stay within rate limits
- Tool schemas stored centrally for consistency across integration points
- Laravel events decouple LLM response handling from HTTP transport
- Separate timeout configuration: 60-180s for streaming, 30-60s for non-streaming

## Performance Considerations
- First-token latency: 200-2000ms (streaming); full response: 2-30s
- PHP process blocking: streaming holds the PHP process for entire response
- Token counting: 1-10ms per request depending on prompt size
- Concurrent LLM requests need sufficient queue workers

## Security Considerations
- Implement prompt injection detection
- Validate and sanitize LLM-structured outputs (tool call arguments)
- Never expose raw LLM output to users without safety filtering
- Implement request cancellation on user navigation
- Log token usage per request for cost tracking and abuse detection

## Common Mistakes
- Treating streaming like regular HTTP responses (waiting for full body)
- Not handling mid-stream errors (error JSON in data channel)
- Token rate limiting with request-count algorithms only
- Exposing raw LLM output without safety filtering
- Hardcoding model versions instead of configurable routing

## Anti-Patterns
- Blocking UI while waiting for full streaming response
- Single rate limit for both request count and token throughput
- Tool call execution without argument validation
- No context window management in multi-turn conversations

## Examples
```php
$response = Http::withOptions(['stream' => true])
    ->timeout(120)
    ->post('https://api.openai.com/v1/chat/completions', [
        'model' => 'gpt-4',
        'stream' => true,
        'messages' => [/* ... */],
    ]);

foreach (Http::stream($response) as $chunk) {
    // Parse SSE data: {data: {...}\n\n}
    $token = $this->parseSSEChunk($chunk);
    echo $token; // flush to client
}
```

## Related Topics
- **Prerequisites**: Laravel Http facade streaming, SSE protocol
- **Closely Related**: Token-aware rate limiting, retry strategies
- **Advanced**: Multi-model routing, prompt caching, function calling orchestration
- **Cross-Domain**: LLM provider APIs (OpenAI, Anthropic), AI safety

## AI Agent Notes
- Use streaming for chat, non-streaming for extraction/classification
- Implement token-aware rate limiting alongside request-count limits
- Add streaming timeout of 120-180s for LLM API calls

## Verification
- [ ] Streaming vs non-streaming chosen appropriately per endpoint
- [ ] Token-aware rate limiting implemented
- [ ] Tool call arguments validated before execution
- [ ] Timeout configured for streaming (120-180s)
- [ ] Token usage logged for cost tracking
- [ ] Prompt injection detection implemented
