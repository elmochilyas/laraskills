# Knowledge Unit: Provider Abstraction Layer Design

## Metadata

- **ID:** ku-01
- **Subdomain:** Laravel AI SDK
- **Slug:** provider-abstraction-layer-design
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

The Provider Abstraction Layer (PAL) is the architectural layer that isolates application code from the specific APIs and SDKs of individual LLM providers (OpenAI, Anthropic, Google, Mistral, etc.). It defines a consistent interface for chat completions, embeddings, tool calling, and streaming, while allowing provider-specific capabilities to be accessed through extension points. In the Laravel AI ecosystem, the `laravel/ai` SDK serves as this abstraction layer, supporting 14+ providers through a unified interface.

## Core Concepts

- **Provider Interface:** A common contract (interface or abstract class) that all provider adapters implement. Methods: `chat()`, `embeddings()`, `stream()`, `tools()`.
- **Provider Adapter:** A concrete implementation of the provider interface for a specific provider. Handles authentication, request formatting, response parsing, and error mapping.
- **Request DTO:** A standardized data transfer object for LLM requests (messages, model, parameters, tools). Provider-agnostic.
- **Response DTO:** A standardized response object (content, tool calls, token usage, finish reason). Provider-agnostic.
- **Client Configuration:** Per-provider configuration (API key, base URL, organization, default model, timeout, retry policy).
- **Feature Detection:** Mechanism for determining which provider-specific features are available (tool calling, streaming, vision, structured output).
- **Fallback Chain:** Automatic retry with alternative providers when the primary provider fails.

## Mental Models

- **Provider Interface:** A common contract (interface or abstract class) that all provider adapters implement. Methods: `chat()`, `embeddings()`, `stream()`, `tools()`.
- **Provider Adapter:** A concrete implementation of the provider interface for a specific provider. Handles authentication, request formatting, response parsing, and error mapping.
- **Request DTO:** A standardized data transfer object for LLM requests (messages, model, parameters, tools). Provider-agnostic.


## Internal Mechanics

The internal mechanics of Provider Abstraction Layer Design follow established patterns within the Laravel AI SDK domain. The implementation leverages the Laravel AI SDK conventions and ecosystem best practices.

- **Design the interface for the 80% use case.** Cover common operations (chat, embed, stream). Expose provider-specific features through an extension mechanism (e.g., `getProvider()->nativeCall()`).
- **Use DTOs for request/response.** DTOs provide type safety, serialization, and are testable without real provider calls.
- **Implement a factory pattern** for creating provider instances from configuration. `LLMProvider::factory()->make('openai', $config)`.
- **Handle provider errors uniformly.** Map provider-specific exceptions (OpenAI's `RateLimitError`, Anthropic's `OverloadedError`) to a common exception hierarchy.
- **Version the provider interface** â€” when adding new capabilities, use interface segregation (separate interfaces for chat, embeddings, streaming).

## Patterns

- **Design the interface for the 80% use case.** Cover common operations (chat, embed, stream). Expose provider-specific features through an extension mechanism (e.g., `getProvider()->nativeCall()`).
- **Use DTOs for request/response.** DTOs provide type safety, serialization, and are testable without real provider calls.
- **Implement a factory pattern** for creating provider instances from configuration. `LLMProvider::factory()->make('openai', $config)`.
- **Handle provider errors uniformly.** Map provider-specific exceptions (OpenAI's `RateLimitError`, Anthropic's `OverloadedError`) to a common exception hierarchy.
- **Version the provider interface** â€” when adding new capabilities, use interface segregation (separate interfaces for chat, embeddings, streaming).

## Architectural Decisions

- The abstraction layer should be **stateless**. All state (conversation history, session) lives in the application layer.
- Use a **registry pattern** for provider instances â€” register provider adapters by name, retrieve by configuration.
- Implement a **decorator pattern** for cross-cutting concerns: retry, logging, caching, rate limiting wrap the provider interface.
- The provider adapter should handle **authentication** (API key injection, token refresh) transparently to the caller.
- For Laravel, providers are registered as **service container bindings** with configuration from the `config/ai.php` file.

## Tradeoffs

Standard approach vs Custom implementation is the primary tradeoff in this KU. Standard implementations offer faster development and community support but may have overhead. Custom implementations provide tailored solutions at the cost of maintenance burden.

## Performance Considerations

- Provider abstraction adds <0.1ms per call (interface dispatch, DTO construction). Negligible.
- The real cost is in serialization/deserialization. Optimize DTO serialization (use array access, avoid reflection-heavy serialization).
- Connection pooling: the abstraction should reuse HTTP connections across calls (Guzzle pool or curl handle reuse).
- Provider fallback adds latency equal to retry timeout. Configure timeouts aggressively for fast failover.
- Lazy provider instantiation: don't create provider instances until they're needed (register closures, not instances).

## Production Considerations

- **API key isolation:** The abstraction layer must never log or expose API keys. Configuration should be injected, not stored in the adapter.
- **Input validation:** The abstraction layer should validate request DTOs before sending to the provider (prevent malformed requests).
- **Output sanitization:** Response DTOs should be validated before returning to the application (prevent injection from provider responses).
- **Provider trust:** The abstraction layer should not implicitly trust provider responses. Validate finish reasons, token counts, and content.
- **Secrets in transit:** The abstraction layer must use TLS for all provider connections.

## Common Mistakes

- Making the abstraction layer too thin â€” just passing through to the provider SDK without value-add (error mapping, retry, logging).
- Making the abstraction layer too thick â€” trying to hide all provider differences results in a least-common-denominator interface.
- Leaking provider-specific types into the application â€” the application should never import OpenAI-specific classes.
- Not handling provider-specific error codes â€” generic "provider error" loses information needed for debugging.
- Forgetting to implement provider feature detection â€” the application calls `tool_calling()` on a provider that doesn't support it.

## Failure Modes

- **Provider Leakage:** Returning provider-specific types or exceptions to the application layer. All provider-specific code must be encapsulated in the adapter.
- **God Interface:** One interface with 30 methods, most of which throw `UnsupportedException` for most providers. Use segregated interfaces.
- **Fake Provider Abstraction:** A wrapper over a single provider that claims to be provider-agnostic but has deep assumptions about that provider's behavior.
- **Config Sprawl:** Each provider adapter requiring different configuration keys. Normalize configuration to a common schema.
- **Abstraction Inversion:** The application layer depending on concrete provider implementations instead of the interface.

## Ecosystem Usage

### Provider Interface
```php
interface LLMProvider {
    public function chat(ChatRequest $request): ChatResponse;
    public function stream(ChatRequest $request): StreamIterator;
    public function embeddings(EmbeddingRequest $request): EmbeddingResponse;
    public function supports(string $capability): bool;
}

class OpenAIChatAdapter implements LLMProvider {
    public function chat(ChatRequest $request): ChatResponse {
        $nativeRequest = $this->toNativeRequest($request);
        $nativeResponse = $this->client->chat($nativeRequest);
        return ChatResponse::fromNative($nativeResponse);
    }
}
```

### Provider Factory
```php
class LLMProviderFactory {
    public function make(string $provider, array $config): LLMProvider {
        return match($provider) {
            'openai' => new OpenAIChatAdapter($config['api_key'], $config['model']),
            'anthropic' => new AnthropicChatAdapter($config['api_key'], $config['model']),
            'mistral' => new MistralChatAdapter($config['api_key'], $config['model']),
            default => throw new UnsupportedProviderException($provider),
        };
    }
}
```

## Related Knowledge Units

- ku-02 (Provider Adapters): Concrete implementations of the provider interface.
- ku-03 (Provider-Specific Features): Handling capabilities not in the common interface.
- ku-04 (Error Handling & Retry): Provider error mapping and retry strategies.
- ku-05 (Configuration & Environment): Provider configuration management.
- ai-middleware-gateway/ku-01: Gateway builds on the provider abstraction layer.

## Research Notes

Source: Domain analysis for AI and Intelligence Systems (Laravel/PHP ecosystem)
Source: Laravel AI SDK documentation and ecosystem package references

