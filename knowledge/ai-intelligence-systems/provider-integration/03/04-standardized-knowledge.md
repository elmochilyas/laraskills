---
id: ku-03
title: "Provider-Specific Features"
subdomain: "llm-provider-abstraction"
ku-type: "capability"
date-created: "2026-06-02"
domain-maturity: "mature"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/llm-provider-abstraction/ku-03/04-standardized-knowledge.md"
---

# Provider-Specific Features

## Overview

Provider-specific features are capabilities offered by individual LLM providers that go beyond the common chat/embed/stream interface. Examples include vision/image inputs, structured output (JSON mode), context caching, prompt caching, response moderation labels, parallel tool calling limits, and system fingerprinting. The provider abstraction layer must expose these features without leaking provider-specific types or forcing all providers to implement features they don't support.

## Core Concepts

- **Capability Detection:** The `supports(string $capability): bool` method on the provider interface. Allows the application to check if a feature is available before using it.
- **Feature Flags:** A mechanism for the application to request provider-specific features in a provider-agnostic way (e.g., `$request->withOption('response_format', 'json_schema', $schema)`).
- **Extension Methods:** Provider-specific methods on the adapter that can be accessed when the application knows it's using a specific provider.
- **Capability Matrix:** A mapping of providers to supported capabilities, used for routing decisions and feature detection.
- **Graceful Degradation:** When a requested feature is not supported by the selected provider, fall back to a supported alternative or fail with a clear message.
- **Cross-Provider Equivalents:** Different providers may have equivalent features under different names (e.g., OpenAI's JSON mode vs. Anthropic's structured output).

## When To Use

- Applications that need specific provider capabilities (vision, structured output, caching).
- Multi-provider setups where different providers are used for different capabilities.
- Building adapters for new providers — documenting their unique capabilities.
- Migrating between providers — understanding feature parity gaps.

## When NOT To Use

- Applications using only the common chat/embed/stream interface (no need for provider-specific features).
- When the provider-specific feature can be implemented at the application layer (e.g., client-side JSON validation instead of structured output).

## Best Practices

- **Define standard capability names** across providers using an enum or constants. Use `Capability::Vision`, `Capability::StructuredOutput`, `Capability::ParallelToolCalls`.
- **Always call `supports()` before using a capability.** Never assume a provider supports a feature.
- **Provide fallback implementations** for common features. If a provider doesn't support JSON mode, validate JSON output client-side.
- **Document capability gaps** in adapter README or configuration. Teams should know which providers lack which features.
- **Test capabilities in CI.** A provider may add or remove support for a feature with an API update.

## Architecture Guidelines

- Capability detection should be **fast and deterministic** — return a boolean from a static/serverside matrix, not a runtime API call.
- For optional capabilities, pass them as **named options** in the request DTO: `$request->withOption('response_format', 'json')`.
- Implement provider-specific features as **traits or decorators** that extend the base adapter (e.g., `OpenAIVisionTrait`, `AnthropicContextCachingTrait`).
- The capability matrix should be **configurable** — an application may disable a capability for a provider even if it's technically supported.
- For the `laravel/ai` SDK, use the **extension mechanism** (`->using('feature_name', $options)`) to pass provider-specific options.

## Performance Considerations

- Capability detection adds <0.01ms — negligible. Cache the result per provider instance.
- Some provider-specific features (context caching, prompt caching) are explicitly designed to improve performance — use them.
- Vision inputs add significant latency and token cost (images are tokenized). Use only when necessary.
- Structured output may add latency (provider post-processes the response). Test with and without for your use case.
- Capability fallback (e.g., client-side JSON validation) adds application-layer overhead vs. provider-native support.

## Security Considerations

- **Vision input security:** Processing user-submitted images may expose the application to inappropriate content. Apply content moderation to images.
- **Structured output validation:** Even with provider JSON mode, validate the output server-side. The provider's guarantee is not absolute.
- **Context caching security:** Cached prompts may be accessible across sessions. Ensure cache keys are scoped to the user/session.
- **Feature misuse:** Some capabilities (e.g., high token limits, parallel tool calls) can be abused. Apply rate limits per capability.
- **Capability-based routing:** Ensure capability-based routing decisions don't leak which providers are in use (security through obscurity).

## Common Mistakes

- Calling a provider-specific method without checking `supports()` first — runtime error on unsupported providers.
- Not implementing capability detection for new adapters — `supports()` returns false for everything by default.
- Assuming capability names are standardized across providers — each provider may call the same feature differently.
- Forgetting that enabling a capability may change the response format (e.g., structured output changes finish_reason).
- Not testing capabilities with real provider responses — mock tests may not reflect actual behavior.

## Anti-Patterns

- **Capability Creep:** Adding support for every minor provider-specific feature. Focus on features that provide clear value.
- **Feature Leakage:** Exposing provider-specific feature names in the application layer (e.g., `$request->anthropicBeta()`). Use generic option names.
- **False Equivalence:** Claiming a provider supports a capability when the implementation is functionally different (e.g., "streaming" with different chunk semantics).
- **Capability Silo:** Only one developer knows which capabilities each provider supports. Document the capability matrix.
- **All-or-Nothing Capabilities:** Treating capabilities as binary (supported/not supported) when they may have varying levels of support.

## Examples

### Capability Enum & Detection
```php
enum Capability: string {
    case Vision = 'vision';
    case StructuredOutput = 'structured_output';
    case ParallelToolCalls = 'parallel_tool_calls';
    case ContextCaching = 'context_caching';
    case JsonMode = 'json_mode';
}

class OpenAIChatAdapter implements LLMProvider {
    private const CAPABILITIES = [
        Capability::Vision,
        Capability::StructuredOutput,
        Capability::ParallelToolCalls,
        Capability::JsonMode,
    ];

    public function supports(string $capability): bool {
        return in_array($capability, self::CAPABILITIES, true);
    }
}
```

### Using Provider-Specific Features
```php
$request = new ChatRequest(
    messages: $messages,
    options: [
        'response_format' => [
            'type' => 'json_schema',
            'schema' => $userSchema,
        ],
    ],
);

if (!$provider->supports(Capability::StructuredOutput)) {
    // Fallback: request plain text and validate JSON client-side
    $request = $request->withoutOption('response_format');
    $response = $provider->chat($request);
    $data = $this->validateAndParseJson($response->content);
} else {
    $response = $provider->chat($request);
    $data = $response->structuredContent;
}
```

## Related Topics

- ku-01 (Provider Abstraction Layer Design): How the interface supports feature extensions.
- ku-02 (Provider Adapters): Implementing capabilities in adapters.
- ku-07 (Vision & Multimodal): The vision capability in detail.
- ku-08 (Structured Output): JSON mode and structured output capability.
- ai-middleware-gateway/ku-04: Capability-based routing at the gateway.

## AI Agent Notes

- When asked about provider feature parity, first reference the capability matrix for the relevant providers.
- For capability-related bugs, check: `supports()` implementation, option passing, and fallback logic.
- Prefer reading the capability matrix configuration before individual feature implementations.
- When generating code that uses provider-specific features, always include a `supports()` check and a fallback path.

## Verification

- [ ] Capability detection (`supports()`) is implemented for all provider adapters.
- [ ] Capability names are standardized (enum or constants) across providers.
- [ ] Provider-specific features are accessed via generic options, not provider-specific methods.
- [ ] Fallback implementations exist for common capabilities when providers don't support them.
- [ ] Capability matrix is documented and tested in CI.
- [ ] Provider-specific features are used with proper error handling for unsupported cases.
- [ ] Capability-based routing decisions are logged for debugging.
