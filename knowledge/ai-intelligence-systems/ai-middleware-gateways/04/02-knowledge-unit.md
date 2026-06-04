# Knowledge Unit: Request/Response Transformation

## Metadata

- **ID:** ku-04
- **Subdomain:** AI Middleware & Gateways
- **Slug:** request-response-transformation
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Request/response transformation is the process of modifying API requests and responses as they pass through the AI gateway. This includes request normalization (converting application-level payloads to provider-specific formats), response normalization (standardizing provider responses), content filtering (PII redaction, content moderation), augmentation (injecting context), and protocol translation (REST â†” streaming). The gateway's transformation layer enables provider-agnostic clients while supporting provider-specific capabilities.

## Core Concepts

- **Request Normalization:** Converting the application's generic request (model, messages, tools, options) to the provider's expected JSON schema.
- **Response Normalization:** Converting the provider's response format (which varies by provider) into a standardized response DTO.
- **PII Redaction:** Detecting and masking personally identifiable information in requests and responses.
- **Content Filtering:** Applying content moderation policies (blocking hate speech, violence, etc.) before sending to the provider or returning to the user.
- **Context Injection:** Adding system messages, instructions, or RAG results into the request without client awareness.
- **Stream Conversion:** Translating between streaming formats (SSE, WebSocket, server-sent events) and the application's expected format.
- **Schema Transformation:** Converting tool call schemas between provider formats (OpenAI function calling vs. Anthropic tool use).

## Mental Models

- **Request Normalization:** Converting the application's generic request (model, messages, tools, options) to the provider's expected JSON schema.
- **Response Normalization:** Converting the provider's response format (which varies by provider) into a standardized response DTO.
- **PII Redaction:** Detecting and masking personally identifiable information in requests and responses.


## Internal Mechanics

The internal mechanics of Request/Response Transformation follow established patterns within the AI Middleware & Gateways domain. The implementation leverages the Laravel AI SDK conventions and ecosystem best practices.

- **Use a pipeline of transforms** â€” each transform has a single responsibility and can be enabled/disabled independently.
- **Validate transformed payloads** against the provider's schema before sending.
- **Log transformations** for debugging (what was redacted, what was injected).
- **Version transform configurations** â€” a change to PII rules or content filters should be traceable.
- **Test transformations independently** with unit tests that verify input â†’ expected output.

## Patterns

- **Use a pipeline of transforms** â€” each transform has a single responsibility and can be enabled/disabled independently.
- **Validate transformed payloads** against the provider's schema before sending.
- **Log transformations** for debugging (what was redacted, what was injected).
- **Version transform configurations** â€” a change to PII rules or content filters should be traceable.
- **Test transformations independently** with unit tests that verify input â†’ expected output.

## Architectural Decisions

- Implement transforms as **middleware classes** implementing `TransformInterface` with `processRequest()` and `processResponse()` methods.
- Separate **structural transformations** (format conversion) from **content transformations** (PII redaction, moderation).
- Use a **schema registry** for provider-specific formats â€” when a new provider is added, register its schema transformers.
- For PII redaction, use **pattern-based or ML-based detection** with a configurable allowlist.
- Content moderation should be **async** (queue-based) for non-blocking gateway operation; block only high-confidence violations.

## Tradeoffs

Standard approach vs Custom implementation is the primary tradeoff in this KU. Standard implementations offer faster development and community support but may have overhead. Custom implementations provide tailored solutions at the cost of maintenance burden.

## Performance Considerations

- Each transformation adds latency. Keep the pipeline lean (3-5 transforms maximum on the hot path).
- PII redaction using regex is fast (<1ms); ML-based NER is slower (10-50ms). Use regex for high-throughput paths.
- Response transformations on streaming responses require buffering or per-chunk processing. Buffering adds latency; per-chunk processing is more complex.
- Schema transformation should be precomputed where possible (cached schemas per provider).
- Use a **transform cache**: if the same transformation is applied to similar requests, cache the result.

## Production Considerations

- **PII redaction at the gateway** ensures downstream logs don't contain sensitive data.
- **Content moderation before provider:** block policy-violating content before it's sent to the LLM (saves cost, prevents abuse).
- **Response sanitization:** strip any provider-specific metadata that might leak internal configuration.
- **Transform injection:** ensure that transformation rules cannot be overridden by client-provided headers or parameters.
- **Audit transform actions:** log all redactions and content blocks for compliance review.

## Common Mistakes

- Applying transformations in the wrong order (PII redaction before content moderation may mask policy-violating content).
- Breaking streaming responses by buffering the entire response â€” defeats the purpose of streaming.
- Not handling transform failures gracefully â€” a redaction error should not crash the gateway.
- Forgetting to transform tool call schemas â€” the LLM receives schemas in the wrong format.
- Applying the same transforms to all request types (chat, embedding, streaming) when they need different pipelines.

## Failure Modes

- **Monolithic Transform Function:** A single function that does PII redaction, format conversion, and content filtering. Split into focused transforms.
- **Silent Data Loss:** A transform that drops fields without logging. All schema transformations should log warnings for dropped fields.
- **Hardcoded PII Patterns:** PII detection rules should be configurable and locale-aware.
- **Transform Order Dependency:** Transforms that assume a specific order and break if reordered. Design transforms to be order-independent or document the dependency.

## Ecosystem Usage

### Transform Pipeline
```php
class TransformPipeline {
    /** @param TransformInterface[] $transforms */
    public function __construct(private array $transforms) {}

    public function processRequest(array $request): array {
        foreach ($this->transforms as $transform) {
            $request = $transform->processRequest($request);
        }
        return $request;
    }
}

$pipeline = new TransformPipeline([
    new NormalizeRequestTransform($schemaRegistry),
    new PiiRedactionTransform($piiDetector),
    new ContextInjectionTransform($contextProvider),
    new ContentModerationTransform($moderationService),
]);
```

### PII Redaction Transform
```php
class PiiRedactionTransform implements TransformInterface {
    public function processRequest(array $request): array {
        $patterns = [
            '/\b[\w\.-]+@[\w\.-]+\.\w+\b/' => '[EMAIL]',
            '/\b\d{3}-\d{2}-\d{4}\b/' => '[SSN]',
            '/\b(?:\d{4}[ -]?){3}\d{4}\b/' => '[CC_NUMBER]',
        ];
        $content = $request['messages'] ?? [];
        foreach ($content as &$msg) {
            $msg['content'] = preg_replace(
                array_keys($patterns),
                array_values($patterns),
                $msg['content']
            );
        }
        $request['messages'] = $content;
        return $request;
    }
}
```

## Related Knowledge Units

- ku-01 (AI Gateway Fundamentals): The gateway that hosts the transform pipeline.
- ku-05 (Observability & Monitoring): Monitoring transform behavior and errors.
- ai-safety-security/ku-02: Content moderation and safety filtering.
- ai-safety-security/ku-04: PII detection and redaction at scale.
- llm-provider-abstraction/ku-04: Provider-specific format differences.

## Research Notes

Source: Domain analysis for AI and Intelligence Systems (Laravel/PHP ecosystem)
Source: Laravel AI SDK documentation and ecosystem package references

