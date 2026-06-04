---
id: ku-02
title: "Provider Adapters"
subdomain: "llm-provider-abstraction"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "mature"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/llm-provider-abstraction/ku-02/04-standardized-knowledge.md"
---

# Provider Adapters

## Overview

Provider adapters are concrete implementations of the provider abstraction layer (ku-01) that translate between the application's standardized interface and each LLM provider's native API. Each adapter handles provider-specific authentication, request format, response parsing, error mapping, and capability detection. The Laravel AI SDK includes adapters for 14+ providers, with a consistent pattern that makes adding new providers predictable.

## Core Concepts

- **Request Translation:** Converting the standardized `ChatRequest` DTO into the provider-specific JSON payload (different schema per provider).
- **Response Translation:** Parsing the provider-specific JSON response into the standardized `ChatResponse` DTO.
- **Authentication:** Injecting API keys, tokens, or other credentials in the format expected by the provider (header, query param, or body).
- **Endpoint Management:** Constructing the correct API URL for each provider and model.
- **Capability Mapping:** Mapping standardized capabilities (tool calling, streaming, vision, JSON mode) to provider-specific equivalents.
- **Error Mapping:** Converting provider-specific error responses into the application's exception hierarchy.
- **Streaming Adaptation:** Translating provider-specific streaming formats (SSE, server-sent events, WebSocket) into a unified `StreamIterator`.

## When To Use

- Adding support for a new LLM provider in your application.
- Replacing or updating an existing provider adapter to handle API changes.
- Customizing provider behavior (custom endpoint, proxy, authentication flow).

## When NOT To Use

- Using a provider that is already supported by the `laravel/ai` SDK (use the built-in adapter).
- When the provider's API is fundamentally incompatible with the abstraction (rare edge cases).

## Best Practices

- **Map errors comprehensively.** Cover all HTTP status codes and error types the provider returns. Unknown errors should fall into a catch-all category.
- **Validate provider responses.** Check that required fields exist before accessing them. Providers may change their response shape.
- **Handle rate limit headers.** Parse provider-specific rate limit headers and surface them in the response or via events.
- **Log raw request/response** at debug level for troubleshooting. Never log API keys.
- **Test adapters independently** with mock HTTP responses (fixture files for each provider response type).
- **Keep adapters stateless.** All state should be in configuration or request DTOs, not in the adapter instance.

## Architecture Guidelines

- Each adapter should be a **single class** that implements `LLMProvider`. Avoid multiple classes per provider.
- Use **DTOs internally** within the adapter as well — don't work with raw arrays beyond the HTTP layer.
- Implement a **`toNativeRequest()`** method that converts the standard DTO to the provider's format, making translation logic testable in isolation.
- Use **Guzzle middleware** or PSR-18 client decorators for provider-specific HTTP behavior (custom headers, logging).
- For streaming, use a **generator or iterator** that yields standardized `StreamChunk` DTOs, handling provider-specific chunk parsing internally.

## Performance Considerations

- Request/response serialization is the dominant cost in adapters (0.1-0.5ms). Optimize with cached serialization templates where possible.
- Streaming adapters should process chunks incrementally without buffering the entire response.
- Adapter construction should be lightweight — heavy initialization (loading models, fetching config) should be lazy.
- Connection reuse: share HTTP clients across adapter instances (Guzzle pool).
- Response validation should be minimal on the success path — validate structure, not content.

## Security Considerations

- **API key handling:** Adapters should accept API keys via constructor injection, never read from global state or environment directly.
- **Response injection:** Never evaluate or execute provider responses (e.g., no `eval()`, no dynamic method calls based on response content).
- **URL validation:** If the adapter constructs URLs from configuration, validate that the base URL is a valid, expected endpoint.
- **Request logging:** Adapter debug logs must redact API keys and sensitive request content before writing.
- **TLS verification:** Adapters must verify TLS certificates unless explicitly disabled for development (with warnings).

## Common Mistakes

- Not handling all provider-specific error codes — unhandled errors surface as generic HTTP exceptions.
- Hardcoding model names in the adapter — models should be configurable via request DTOs.
- Assuming all providers' streaming formats are identical — each provider has unique SSE event types.
- Not handling finish reasons correctly — `stop`, `length`, `tool_calls`, `content_filter` have different representations across providers.
- Forgetting to implement `supports($capability)` correctly — claiming support for features the provider doesn't offer.

## Anti-Patterns

- **Adapter Monolith:** One adapter class that handles multiple providers with if/else branches. One class per provider.
- **Lowest Common Denominator:** Implementing only features that all providers support. Use capability detection to expose advanced features.
- **Magic Response Parsing:** Using dynamic property access on responses. Explicitly map every field.
- **Silent Fallbacks:** Falling back to a different provider inside an adapter when a feature is unsupported. The application should decide fallback behavior.
- **Adapter-Dependent Business Logic:** Embedding business rules (pricing, routing) inside adapter code. Adapters translate requests/responses only.

## Examples

### OpenAI Adapter (Minimal)
```php
class OpenAIChatAdapter implements LLMProvider {
    public function __construct(
        private Client $http,
        private string $apiKey,
        private string $model,
    ) {}

    public function chat(ChatRequest $request): ChatResponse {
        $response = $this->http->post('https://api.openai.com/v1/chat/completions', [
            'headers' => ['Authorization' => "Bearer {$this->apiKey}"],
            'json' => $this->toNativeRequest($request),
        ]);

        return $this->toStandardResponse($response);
    }

    private function toNativeRequest(ChatRequest $request): array {
        return [
            'model' => $request->model ?? $this->model,
            'messages' => array_map(fn($m) => [
                'role' => $m->role,
                'content' => $m->content,
            ], $request->messages),
            'tools' => $request->tools ? $this->formatTools($request->tools) : null,
            'max_tokens' => $request->maxTokens,
            'temperature' => $request->temperature,
        ];
    }
}
```

### Streaming Adapter Pattern
```php
class OpenAITextStreamAdapter implements LLMProvider {
    public function stream(ChatRequest $request): StreamIterator {
        $stream = $this->http->post('https://api.openai.com/v1/chat/completions', [
            'headers' => ['Authorization' => "Bearer {$this->apiKey}"],
            'json' => $this->toNativeRequest($request) + ['stream' => true],
            'stream' => true,
        ]);

        return new StreamIterator($stream->getBody(), function ($line) {
            return StreamChunk::fromOpenAIEvent($line);
        });
    }
}
```

## Related Topics

- ku-01 (Provider Abstraction Layer Design): The interface that adapters implement.
- ku-03 (Provider-Specific Features): Handling features beyond the common interface.
- ku-04 (Error Handling & Retry): Provider-specific error mapping.
- ku-06 (Tool Calling): Provider-specific tool calling formats.
- ai-middleware-gateway/ku-04: Request/response transformation at the gateway.

## AI Agent Notes

- When asked to implement a new provider adapter, first read: the provider interface (ku-01), an existing adapter for reference, and the provider's API documentation.
- For adapter bugs, check: request format, response parsing, error mapping, and streaming format.
- Prefer reading the `toNativeRequest` and response parsing methods — these are where most bugs live.
- When generating an adapter, start with the chat method, then add streaming, then error mapping, then advanced features.

## Verification

- [ ] Adapter implements the full provider interface (chat, stream, embeddings, supports).
- [ ] Request translation is tested with fixture-based tests for each message type.
- [ ] Response translation handles all expected fields and provider-specific edge cases.
- [ ] Error mapping covers all provider-specific error codes and HTTP statuses.
- [ ] Streaming adapter produces standardized `StreamChunk` DTOs.
- [ ] API keys are injected via constructor (never read from global state).
- [ ] Raw request/response logging is available at debug level (with API key redaction).
