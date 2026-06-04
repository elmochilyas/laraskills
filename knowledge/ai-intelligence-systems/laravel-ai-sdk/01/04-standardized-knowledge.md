---
id: ku-01
title: "Provider Abstraction Layer Design"
subdomain: "llm-provider-abstraction"
ku-type: "foundation"
date-created: "2026-06-02"
domain-maturity: "mature"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/llm-provider-abstraction/ku-01/04-standardized-knowledge.md"
---

# Provider Abstraction Layer Design

## Overview

The Provider Abstraction Layer (PAL) is the architectural layer that isolates application code from the specific APIs and SDKs of individual LLM providers (OpenAI, Anthropic, Google, Mistral, etc.). It defines a consistent interface for chat completions, embeddings, tool calling, and streaming, while allowing provider-specific capabilities to be accessed through extension points. In the Laravel AI ecosystem, the `laravel/ai` SDK serves as this abstraction layer, supporting 14+ providers through a unified interface.

## Core Concepts

- **Provider Interface:** A common contract (interface or abstract class) that all provider adapters implement. Methods: `chat()`, `embeddings()`, `stream()`, `tools()`.
- **Provider Adapter:** A concrete implementation of the provider interface for a specific provider. Handles authentication, request formatting, response parsing, and error mapping.
- **Request DTO:** A standardized data transfer object for LLM requests (messages, model, parameters, tools). Provider-agnostic.
- **Response DTO:** A standardized response object (content, tool calls, token usage, finish reason). Provider-agnostic.
- **Client Configuration:** Per-provider configuration (API key, base URL, organization, default model, timeout, retry policy).
- **Feature Detection:** Mechanism for determining which provider-specific features are available (tool calling, streaming, vision, structured output).
- **Fallback Chain:** Automatic retry with alternative providers when the primary provider fails.

## When To Use

- Multi-provider applications that need to switch between providers without code changes.
- Applications that want to avoid vendor lock-in with any single LLM provider.
- Systems that use different providers for different tasks (chat, embedding, summarization).
- Production systems that need provider failover for reliability.

## When NOT To Use

- Single-provider, single-model applications where switching providers is not anticipated.
- Prototypes where adding abstraction overhead is premature.
- Applications that need deep provider-specific features that aren't representable in a common interface.

## Best Practices

- **Design the interface for the 80% use case.** Cover common operations (chat, embed, stream). Expose provider-specific features through an extension mechanism (e.g., `getProvider()->nativeCall()`).
- **Use DTOs for request/response.** DTOs provide type safety, serialization, and are testable without real provider calls.
- **Implement a factory pattern** for creating provider instances from configuration. `LLMProvider::factory()->make('openai', $config)`.
- **Handle provider errors uniformly.** Map provider-specific exceptions (OpenAI's `RateLimitError`, Anthropic's `OverloadedError`) to a common exception hierarchy.
- **Version the provider interface** — when adding new capabilities, use interface segregation (separate interfaces for chat, embeddings, streaming).

## Architecture Guidelines

- The abstraction layer should be **stateless**. All state (conversation history, session) lives in the application layer.
- Use a **registry pattern** for provider instances — register provider adapters by name, retrieve by configuration.
- Implement a **decorator pattern** for cross-cutting concerns: retry, logging, caching, rate limiting wrap the provider interface.
- The provider adapter should handle **authentication** (API key injection, token refresh) transparently to the caller.
- For Laravel, providers are registered as **service container bindings** with configuration from the `config/ai.php` file.

## Performance Considerations

- Provider abstraction adds <0.1ms per call (interface dispatch, DTO construction). Negligible.
- The real cost is in serialization/deserialization. Optimize DTO serialization (use array access, avoid reflection-heavy serialization).
- Connection pooling: the abstraction should reuse HTTP connections across calls (Guzzle pool or curl handle reuse).
- Provider fallback adds latency equal to retry timeout. Configure timeouts aggressively for fast failover.
- Lazy provider instantiation: don't create provider instances until they're needed (register closures, not instances).

## Security Considerations

- **API key isolation:** The abstraction layer must never log or expose API keys. Configuration should be injected, not stored in the adapter.
- **Input validation:** The abstraction layer should validate request DTOs before sending to the provider (prevent malformed requests).
- **Output sanitization:** Response DTOs should be validated before returning to the application (prevent injection from provider responses).
- **Provider trust:** The abstraction layer should not implicitly trust provider responses. Validate finish reasons, token counts, and content.
- **Secrets in transit:** The abstraction layer must use TLS for all provider connections.

## Common Mistakes

- Making the abstraction layer too thin — just passing through to the provider SDK without value-add (error mapping, retry, logging).
- Making the abstraction layer too thick — trying to hide all provider differences results in a least-common-denominator interface.
- Leaking provider-specific types into the application — the application should never import OpenAI-specific classes.
- Not handling provider-specific error codes — generic "provider error" loses information needed for debugging.
- Forgetting to implement provider feature detection — the application calls `tool_calling()` on a provider that doesn't support it.

## Anti-Patterns

- **Provider Leakage:** Returning provider-specific types or exceptions to the application layer. All provider-specific code must be encapsulated in the adapter.
- **God Interface:** One interface with 30 methods, most of which throw `UnsupportedException` for most providers. Use segregated interfaces.
- **Fake Provider Abstraction:** A wrapper over a single provider that claims to be provider-agnostic but has deep assumptions about that provider's behavior.
- **Config Sprawl:** Each provider adapter requiring different configuration keys. Normalize configuration to a common schema.
- **Abstraction Inversion:** The application layer depending on concrete provider implementations instead of the interface.

## Examples

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

## Related Topics

- ku-02 (Provider Adapters): Concrete implementations of the provider interface.
- ku-03 (Provider-Specific Features): Handling capabilities not in the common interface.
- ku-04 (Error Handling & Retry): Provider error mapping and retry strategies.
- ku-05 (Configuration & Environment): Provider configuration management.
- ai-middleware-gateway/ku-01: Gateway builds on the provider abstraction layer.

## AI Agent Notes

- When asked to add a new provider, first read the existing provider adapters to match the pattern.
- For abstraction-related bugs, check: DTO mapping completeness, error mapping, and feature detection.
- Prefer reading the provider interface before individual adapter implementations — the contract reveals the design.
- When generating provider adapter code, include DTOs, error mapping, and at least one test with a mock provider.

## Verification

- [ ] Provider interface covers the 80% use case (chat, stream, embeddings) with DTOs.
- [ ] Provider adapters exist for all supported providers with consistent error mapping.
- [ ] Application code depends only on the provider interface, not concrete adapters.
- [ ] Provider-specific features are accessible through an extension mechanism.
- [ ] Provider factory creates instances from configuration with proper validation.
- [ ] Cross-cutting concerns (retry, logging, caching) are implemented as decorators.
- [ ] Configuration is normalized across providers with sensible defaults.
