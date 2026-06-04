## Use `Ai::call()` via Env-Driven Provider Selection
---
## Category
Architecture | Maintainability
---
## Rule
Always use the `Ai::call()` facade or agent `#[Provider]` attributes with provider selection driven by the `AI_PROVIDER` environment variable; never hardcode provider strings in application code.
---
## Reason
Env-driven selection enables different provider backends per environment (Ollama in dev, Anthropic in prod) without code changes. Hardcoded providers create deployment friction and prevent rapid provider switching during incidents.
---
## Bad Example
```php
$response = Ai::call(messages: [...], provider: 'openai'); // Hardcoded
```
---
## Good Example
```php
// .env: AI_PROVIDER=anthropic
$response = Ai::call(messages: [
    ['role' => 'user', 'content' => $input],
]);
```
---
## Exceptions
Agents that require a specific provider feature (e.g., Anthropic extended thinking) may use `#[Provider('anthropic')]` at the class level with documentation of the dependency.
---
## Consequences Of Violation
Cannot switch providers without code changes, dev/prod provider mismatch, incident response delays during provider outages.

## Configure Provider Timeouts and Retries per Provider
---
## Category
Reliability | Performance
---
## Rule
Set HTTP timeout and retry configuration per provider driver, tuned to each provider's documented latency and error patterns.
---
## Reason
Providers have different response-time distributions and error profiles. OpenAI's 429 rate limits are transient; Anthropic's 529 overloads require longer cooldowns. A one-size-fits-all timeout causes unnecessary failures on slow providers or premature timeouts on fast ones.
---
## Bad Example
```php
// config/ai.php — single global timeout
'timeout' => 30, // Same for OpenAI, Anthropic, Gemini
```
---
## Good Example
```php
// config/ai.php — per-provider timeouts
'providers' => [
    'openai' => ['timeout' => 60, 'retry' => [3, 1000]],
    'anthropic' => ['timeout' => 120, 'retry' => [5, 2000]],
    'ollama' => ['timeout' => 300, 'retry' => [1, 500]],
],
```
---
## Exceptions
Development environments may use a single global configuration for simplicity.
---
## Consequences Of Violation
Frequent timeout failures on slower providers, unnecessary retries on rate-limited providers, degraded availability.

## Always Handle Provider-Specific 400 Errors
---
## Category
Reliability
---
## Rule
Wrap AI calls in try-catch blocks that handle provider-specific exception types; never assume all providers throw the same exceptions.
---
## Reason
Each provider uses different error codes and response shapes for the same class of errors (e.g., context-length exceeded, content filtered, invalid request). Unhandled provider-specific errors crash the request or produce uninformative error messages.
---
## Bad Example
```php
try {
    return Ai::call(messages: $messages);
} catch (\Exception $e) {
    return ['error' => 'AI call failed']; // Loses provider-specific detail
}
```
---
## Good Example
```php
try {
    return Ai::call(messages: $messages);
} catch (ContextLengthExceededException $e) {
    return $this->retryWithTruncatedHistory($messages);
} catch (ContentFilteredException $e) {
    return ['error' => 'Content filtered by provider policy'];
} catch (AiCallException $e) {
    Log::error('AI call failed', ['provider' => $e->provider(), 'detail' => $e->rawResponse()]);
    throw $e;
}
```
---
## Exceptions
Prototype applications may catch a generic exception during development; but never deploy to production without provider-specific error handling.
---
## Consequences Of Violation
Silent failures, context-window errors crash requests, content-filtered responses mislead users.

## Cache Provider Driver Instances
---
## Category
Performance
---
## Rule
Ensure provider driver instances are resolved and cached (the Laravel AI SDK does this automatically via the container); avoid re-instantiating drivers per request.
---
## Reason
Provider driver resolution involves reading configuration, creating HTTP clients, and building request serializers. Caching the driver instance eliminates this overhead on subsequent calls within the same request lifecycle.
---
## Bad Example
```php
// Manually creating a new driver every call
$driver = new OpenAIDriver(config('ai.providers.openai'));
$response = $driver->chat($request);
```
---
## Good Example
```php
// Using the facade — driver is resolved and cached by the container
$response = Ai::call(messages: $messages);
```
---
## Exceptions
When dynamically switching provider configuration per-request (e.g., per-tenant API keys), create new driver instances explicitly and document the performance tradeoff.
---
## Consequences Of Violation
Unnecessary configuration resolution overhead on every AI call, measurable latency increase in high-throughput paths.
