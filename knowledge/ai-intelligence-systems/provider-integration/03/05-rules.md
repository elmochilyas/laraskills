## Always Check `supports()` Before Using Provider-Specific Features
---
## Category
Reliability | Framework Usage
---
## Rule
Call `$provider->supports(Capability::*)` before using any capability-dependent code path; never assume a provider supports a feature based on implementation guesswork.
---
## Reason
Providers vary widely in feature support. Calling a capability that a provider doesn't support produces runtime errors or silent failures. The `supports()` method provides a deterministic, documented contract for capability presence.
---
## Bad Example
```php
$response = $provider->chat($request->withOption('response_format', 'json_schema', $schema));
// Crashes if provider doesn't support structured output
```
---
## Good Example
```php
if ($provider->supports(Capability::StructuredOutput)) {
    $response = $provider->chat($request->withOption('response_format', 'json_schema', $schema));
} else {
    $response = $provider->chat($request);
    $data = $this->validateAndParseJson($response->content);
}
```
---
## Exceptions
Code paths that are gated by a provider-specific configuration (e.g., `AI_PROVIDER=openai`) may skip the runtime check if the provider is guaranteed to support the feature.
---
## Consequences Of Violation
Runtime errors on unsupported providers, silent data corruption, provider migration breaks features.

## Define Capability Names as Enums
---
## Category
Maintainability
---
## Rule
Define standard capability names as a PHP enum or constants shared across all adapters; avoid string literals for capability checks.
---
## Reason
String-based capability names are error-prone (typos, inconsistent casing) and resist static analysis. An enum provides autocomplete, type safety, and a single source of truth for what capabilities exist across the codebase.
---
## Bad Example
```php
if ($provider->supports('vision')) { /* ... */ }
if ($provider->supports('Vision')) { /* ... */ } // Typo, inconsistent casing
```
---
## Good Example
```php
enum Capability: string {
    case Vision = 'vision';
    case StructuredOutput = 'structured_output';
    case ParallelToolCalls = 'parallel_tool_calls';
}
if ($provider->supports(Capability::Vision->value)) { /* ... */ }
```
---
## Exceptions
Prototypes may use string literals during initial development, but refactor to enums before merging to production branches.
---
## Consequences Of Violation
Inconsistent capability names cause false negatives (feature assumed unavailable), testing gaps, maintenance confusion.

## Provide Fallback Implementations for Common Capabilities
---
## Category
Reliability
---
## Rule
When a provider lacks a capability, implement a client-side fallback that achieves the same outcome at the application level; never degrade silently or throw an error that could be avoided.
---
## Reason
Not all providers support all capabilities, but many capabilities can be emulated client-side (e.g., validate JSON output locally if the provider lacks structured output). Fallbacks ensure broader provider compatibility and graceful degradation.
---
## Bad Example
```php
if (! $provider->supports(Capability::StructuredOutput)) {
    throw new \RuntimeException('Provider does not support structured output');
}
```
---
## Good Example
```php
if (! $provider->supports(Capability::StructuredOutput)) {
    $response = $provider->chat($request);
    $data = json_decode($response->content, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new ValidationException('LLM output was not valid JSON');
    }
    return $data;
}
```
---
## Exceptions
Capabilities that cannot be replicated client-side (e.g., image generation) should surface a clear error with upgrade guidance.
---
## Consequences Of Violation
Broken features when switching providers, unnecessary provider lock-in, reduced availability during provider-specific feature gaps.

## Document Capability Gaps per Provider
---
## Category
Maintainability
---
## Rule
Maintain a visible capability matrix (in README or config) documenting which features each provider supports; update it when adding providers or when providers change their API.
---
## Reason
Team members need to know at a glance which providers support which features. Undocumented gaps lead to runtime discoveries, wasted investigation time, and incorrect architectural decisions.
---
## Bad Example
```php
// No documentation — developers must read adapter code to determine capabilities
```
---
## Good Example
```php
// config/ai-capabilities.php
return [
    'openai' => ['vision', 'structured_output', 'parallel_tool_calls', 'json_mode'],
    'anthropic' => ['vision', 'structured_output', 'context_caching', 'extended_thinking'],
    'ollama' => ['json_mode'], // Limited — tool calling depends on model
];
```
---
## Exceptions
Internal-only projects with a single provider may skip the matrix if the team already knows the provider's capabilities.
---
## Consequences Of Violation
Developer time wasted investigating capability support, incorrect routing decisions, production incidents from unsupported features.
