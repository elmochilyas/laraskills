## One Adapter Class per Provider
---
## Category
Code Organization
---
## Rule
Implement each provider adapter as a single class implementing `LLMProvider`; avoid branching multiple provider implementations within one class using conditionals.
---
## Reason
A single-class-per-provider pattern keeps adapter logic isolated, testable, and maintainable. Conditional branching (if/else per provider) creates a monolithic adapter that grows unpredictably and hides provider-specific edge cases.
---
## Bad Example
```php
class MultiProviderAdapter implements LLMProvider {
    public function chat(ChatRequest $request): ChatResponse {
        if ($request->provider === 'openai') { /* ... */ }
        elseif ($request->provider === 'anthropic') { /* ... */ }
    }
}
```
---
## Good Example
```php
class OpenAIChatAdapter implements LLMProvider { /* ... */ }
class AnthropicChatAdapter implements LLMProvider { /* ... */ }
```
---
## Exceptions
Providers with identical APIs (e.g., multiple OpenAI-compatible endpoints) may share a configurable adapter with documented differences.
---
## Consequences Of Violation
Sprawling adapter code, difficult testing, provider-specific bugs affect other providers, high maintenance burden.

## Never Read API Keys from Global State
---
## Category
Security
---
## Rule
Accept API keys and credentials via the adapter constructor; never read from `env()`, `config()`, or `$_ENV` inside adapter code.
---
## Reason
Adapters should be testable and context-independent. Reading global state makes adapters impossible to test with different credentials, couples them to Laravel's configuration system, and prevents alternative credential-resolution strategies (e.g., per-tenant keys).
---
## Bad Example
```php
class OpenAIChatAdapter implements LLMProvider {
    public function chat(ChatRequest $request): ChatResponse {
        $key = env('OPENAI_API_KEY'); // Global state coupling
    }
}
```
---
## Good Example
```php
class OpenAIChatAdapter implements LLMProvider {
    public function __construct(
        private Client $http,
        private string $apiKey,
    ) {}
    public function chat(ChatRequest $request): ChatResponse {
        // Use $this->apiKey
    }
}
```
---
## Exceptions
Bootstrap-level provider resolution logic (service providers, factories) may read config, but pass the resolved value to the adapter constructor.
---
## Consequences Of Violation
Untestable adapter code, coupling to Laravel bootstrap, inability to support per-tenant API keys.

## Implement Comprehensive Error Mapping
---
## Category
Reliability
---
## Rule
Map every provider-specific HTTP status code and error code to the application's exception hierarchy; cover all documented error responses in a single mapping method.
---
## Reason
Unmapped provider errors surface as generic HTTP exceptions with no actionable detail. Comprehensive mapping produces specific, catchable exceptions that enable application-level retry logic, user-facing error messages, and accurate monitoring.
---
## Bad Example
```php
public function chat(ChatRequest $request): ChatResponse {
    $response = $this->http->post(...);
    if (! $response->successful()) {
        throw new \RuntimeException('Provider error');
    }
}
```
---
## Good Example
```php
public function chat(ChatRequest $request): ChatResponse {
    $response = $this->http->post(...);
    if (! $response->successful()) {
        throw $this->mapError($response->status(), $response->json());
    }
}
private function mapError(int $status, array $body): ProviderException {
    return match(true) {
        $status === 429 => new RateLimitException($body['error']['message'] ?? ''),
        $status === 400 && ($body['error']['code'] ?? '') === 'context_length_exceeded'
            => new ContextLengthExceededException(),
        $status >= 500 => new ProviderUnavailableException(),
        default => new UnknownProviderException($body['error']['message'] ?? ''),
    };
}
```
---
## Exceptions
Prototype adapters may return generic errors initially; add comprehensive mapping before production deployment.
---
## Consequences Of Violation
Missing context-length errors crash silently, rate-limit errors retried incorrectly, production outages from unhandled provider errors.

## Use Fixture-Based Tests for Adapter Response Parsing
---
## Category
Testing
---
## Rule
Test adapter response parsing with fixture files (saved JSON responses from the real provider); avoid mocking the full HTTP response for every test.
---
## Reason
Provider APIs evolve. Fixture-based tests capture the actual response shape and catch regressions when the provider changes its response format. Full mocks are coupled to implementation details and miss real-world response variations.
---
## Bad Example
```php
Http::fake(['*' => Http::response(['choices' => [...]])]);
```
---
## Good Example
```php
// fixtures/openai-chat-response.json contains a real saved response
$fixture = json_decode(
    file_get_contents(base_path('tests/Fixtures/openai-chat-response.json')),
    true
);
Http::fake(['*' => Http::response($fixture)]);
```
---
## Exceptions
Error-path tests may use synthetic fixtures since real provider error payloads vary less than success responses.
---
## Consequences Of Violation
Tests pass with mocked data but fail with real provider responses, undetected response-format changes cause production failures.
