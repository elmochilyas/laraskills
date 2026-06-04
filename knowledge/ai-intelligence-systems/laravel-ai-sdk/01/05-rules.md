## Design the Provider Interface for the 80% Use Case

---
## Category
Architecture

---
## Rule
Design the provider abstraction interface to cover common operations (chat, embed, stream, tool calling); expose provider-specific features through an extension mechanism rather than bloating the interface.

---
## Reason
A "god interface" with every possible capability forces every adapter to throw `UnsupportedException` for features the provider lacks. A focused interface plus an extension mechanism keeps the contract clean and maintainable.

---
## Bad Example
```php
interface LLMProvider {
    public function chat(ChatRequest $request): ChatResponse;
    public function stream(ChatRequest $request): StreamIterator;
    public function embeddings(EmbeddingRequest $request): EmbeddingResponse;
    public function imageGeneration(ImageRequest $request): ImageResponse;
    public function audioTranscription(AudioRequest $request): AudioResponse;
    public function visionAnalysis(VisionRequest $request): VisionResponse;
    // Most providers throw UnsupportedException for many methods
}
```

---
## Good Example
```php
interface LLMProvider {
    public function chat(ChatRequest $request): ChatResponse;
    public function stream(ChatRequest $request): StreamIterator;
    public function embeddings(EmbeddingRequest $request): EmbeddingResponse;
    public function supports(string $capability): bool;
    public function nativeCall(string $method, array $params): mixed;
}
```

---
## Exceptions
Provider-specific SDKs that are never wrapped behind an abstraction may expose their full API surface.

---
## Consequences Of Violation
Interface bloat, every adapter throws unsupported exceptions, difficult to add new providers, poor developer experience.

---

## Never Leak Provider-Specific Types to Application Code

---
## Category
Architecture | Maintainability

---
## Rule
Encapsulate all provider-specific types, exceptions, and response formats within the adapter layer; never import provider-specific classes (OpenAI SDK classes, Anthropic types) in application code.

---
## Reason
Importing provider-specific types creates tight coupling to that provider. Switching or adding providers requires changing every file that imports those types, defeating the purpose of the abstraction layer.

---
## Bad Example
```php
use OpenAI\Responses\Chat\CreateResponse;

class ChatController {
    public function __invoke(CreateResponse $response): Response {
        // Tightly coupled to OpenAI response type
    }
}
```

---
## Good Example
```php
use App\Ai\Contracts\ChatResponse;

class ChatController {
    public function __invoke(ChatResponse $response): Response {
        // Depends on abstraction, not provider implementation
    }
}
```

---
## Exceptions
Adapter implementations themselves must import provider-specific types — the encapsulation boundary is at the adapter interface.

---
## Consequences Of Violation
Provider lock-in, difficult migration, vendor-specific bugs spread through the codebase.

---

## Use DTOs for Request and Response Objects

---
## Category
Architecture | Testability

---
## Rule
Define typed Data Transfer Objects (DTOs) for provider requests and responses; never pass raw arrays or provider-native objects across the abstraction boundary.

---
## Reason
DTOs provide type safety, IDE autocompletion, serialization control, and are testable without real provider calls. Raw arrays lose structural guarantees and make evolution difficult.

---
## Bad Example
```php
interface LLMProvider {
    public function chat(array $messages, array $options): array;
    // Raw arrays — no type safety, brittle structure
}
```

---
## Good Example
```php
interface LLMProvider {
    public function chat(ChatRequest $request): ChatResponse;
}

class ChatRequest {
    public function __construct(
        public readonly array $messages,
        public readonly ?string $model = null,
        public readonly ?float $temperature = null,
        public readonly ?array $tools = null,
    ) {}
}

class ChatResponse {
    public function __construct(
        public readonly string $content,
        public readonly array $toolCalls = [],
        public readonly ?TokenUsage $usage = null,
        public readonly string $finishReason = 'stop',
    ) {}
}
```

---
## Exceptions
Performance-critical hot paths with extreme throughput requirements may use arrays internally, but always wrap in DTOs at the public interface.

---
## Consequences Of Violation
Brittle code that breaks on provider API changes, no static analysis, runtime errors from unexpected response shapes.

---

## Map Provider Errors to a Common Hierarchy

---
## Category
Reliability | Maintainability

---
## Rule
Map each provider's specific exception types to a common exception hierarchy in the abstraction layer; never let provider-specific exceptions propagate to application code.

---
## Reason
Each provider uses different error codes and exception types for the same classes of errors (rate limits, content filtering, authentication). A common hierarchy lets application code handle errors uniformly regardless of the underlying provider.

---
## Bad Example
```php
try {
    return $provider->chat($request);
} catch (OpenAI\RateLimitError $e) {
    // Only handles OpenAI — breaks when switching providers
}
```

---
## Good Example
```php
try {
    return $provider->chat($request);
} catch (RateLimitExceededException $e) {
    return $this->retryWithBackoff($request);
} catch (ContentFilteredException $e) {
    return ['error' => 'Content filtered by provider policy'];
} catch (ProviderException $e) {
    Log::error('Provider error', ['provider' => $e->provider()]);
    throw $e;
}
```

---
## Exceptions
Provider-specific features that have no generic equivalent may expose specific exceptions with clear documentation.

---
## Consequences Of Violation
Brittle error handling, unhandled provider-specific errors crash requests, difficult debugging across providers.

---

## Implement Provider Feature Detection

---
## Category
Reliability | Framework Usage

---
## Rule
Provide a `supports(string $capability): bool` method on the provider interface and check it before using provider-specific features; never assume a provider supports a feature without checking.

---
## Reason
Providers differ in which capabilities they support: vision, tool calling, structured output, streaming, embeddings. Calling an unsupported feature produces a confusing runtime error. Feature detection enables graceful degradation or clear error messages.

---
## Bad Example
```php
public function analyzeImage(ImageBlock $image): string {
    return $this->provider->chat($this->buildVisionRequest($image));
    // Fails at runtime if provider doesn't support vision
}
```

---
## Good Example
```php
public function analyzeImage(ImageBlock $image): string {
    if (!$this->provider->supports('vision')) {
        throw new CapabilityNotSupportedException(
            get_class($this->provider) . ' does not support vision'
        );
    }
    return $this->provider->chat($this->buildVisionRequest($image));
}
```

---
## Exceptions
When the provider is known to support the feature (verified at deployment time), the check may be done once at startup.

---
## Consequences Of Violation
Runtime failures from unsupported capabilities, poor error messages, application crashes on provider fallback.

---

## Implement Decorators for Cross-Cutting Concerns

---
## Category
Architecture | Maintainability

---
## Rule
Implement retry logic, logging, caching, and rate limiting as decorators that wrap the provider interface; never embed cross-cutting concerns inside provider adapters.

---
## Reason
Cross-cutting concerns applied inside adapters are duplicated across every provider implementation and cannot be selectively enabled or configured. Decorators keep adapters focused on provider-specific logic and allow composing behaviors independently.

---
## Bad Example
```php
class OpenAIChatAdapter implements LLMProvider {
    public function chat(ChatRequest $request): ChatResponse {
        // Retry logic mixed with provider-specific logic
        for ($i = 0; $i < 3; $i++) {
            try { /* ... */ } catch (RateLimitError $e) { sleep(1); }
        }
    }
}
// Same retry logic duplicated in AnthropicAdapter, GeminiAdapter, etc.
```

---
## Good Example
```php
class RetryDecorator implements LLMProvider {
    public function __construct(
        private LLMProvider $inner,
        private int $maxRetries = 3,
    ) {}

    public function chat(ChatRequest $request): ChatResponse {
        for ($i = 0; $i < $this->maxRetries; $i++) {
            try { return $this->inner->chat($request); }
            catch (RateLimitExceededException $e) { sleep(2 ** $i); }
        }
        throw $e;
    }
}

// Compose at registration:
$provider = new LoggingDecorator(
    new RetryDecorator(
        new OpenAIChatAdapter($config)
    )
);
```

---
## Exceptions
Simple applications with a single provider and no cross-cutting concerns may embed basic retry in the adapter.

---
## Consequences Of Violation
Duplicated cross-cutting logic across all adapters, inconsistent behavior, hard to add new cross-cutting concerns.

---

## Use Lazy Provider Instantiation

---
## Category
Performance

---
## Rule
Register provider instances as closures or lazy bindings in the service container; never instantiate all providers at application startup.

---
## Reason
Most requests use only one provider. Instantiating all providers at startup wastes memory, instantiates HTTP clients unnecessarily, and slows boot time, especially as the number of providers grows.

---
## Bad Example
```php
// In service provider
public function register(): void {
    $this->app->singleton(LLMProvider::class, function () {
        return new OpenAIChatAdapter(config('ai.providers.openai'));
    });
}
// Always loads OpenAI — even when using Anthropic
```

---
## Good Example
```php
public function register(): void {
    $this->app->singleton(LLMProviderFactory::class);
}

class LLMProviderFactory {
    public function make(string $name): LLMProvider {
        return match($name) {
            'openai' => new OpenAIChatAdapter(config('ai.providers.openai')),
            'anthropic' => new AnthropicChatAdapter(config('ai.providers.anthropic')),
            default => throw new UnsupportedProviderException($name),
        };
    }
}
```

---
## Exceptions
Applications using a single provider may bind it eagerly for simplicity.

---
## Consequences Of Violation
Slower application boot time, wasted memory from unused provider instances, unnecessary HTTP client connections.
