## Always Configure Fallback for OpenRouter
---
## Category
Reliability
---
## Rule
Always configure a direct provider driver as a fallback when using OpenRouter; never depend solely on OpenRouter for all AI traffic.
---
## Reason
OpenRouter is a single point of failure. If OpenRouter experiences an outage, all AI features degrade. A direct provider fallback ensures continuity for critical paths during OpenRouter incidents.
---
## Bad Example
```php
// config/ai.php
'default' => ['driver' => 'openrouter'], // Single point of failure
```
---
## Good Example
```php
// config/ai.php — fallback chain
'default' => ['driver' => 'openrouter'],
'fallback' => ['driver' => 'anthropic'],
```
---
## Exceptions
Non-critical applications where temporary AI outage is acceptable may use OpenRouter exclusively.
---
## Consequences Of Violation
Complete AI feature outage during OpenRouter downtime, SLA breaches for AI-dependent features.

## Use OpenRouter for Model Exploration, Direct for Production-Critical Paths
---
## Category
Architecture
---
## Rule
Route non-sensitive, experimental, or low-criticality traffic through OpenRouter; route latency-sensitive or private data through direct provider connections.
---
## Reason
OpenRouter adds 50-200ms proxy latency, processes all prompts through its servers, and has limited control over failover behavior. Direct provider calls are faster and keep data within a known trust boundary.
---
## Bad Example
```php
// All traffic — including PII data — goes through OpenRouter
$response = Ai::call(messages: [$piiData], provider: 'openrouter');
```
---
## Good Example
```php
if ($request->hasSensitiveData()) {
    $response = Ai::call(messages: $messages, provider: 'anthropic');
} else {
    $response = Ai::call(messages: $messages, provider: 'openrouter');
}
```
---
## Exceptions
Applications without sensitive data or latency requirements may route all traffic through OpenRouter for simplicity.
---
## Consequences Of Violation
Data privacy exposure (PII sent through third-party proxy), increased latency for latency-critical paths, compliance violations.

## Pin Model Strings with Provider Prefix in OpenRouter
---
## Category
Maintainability
---
## Rule
Always prefix model strings with the provider when using OpenRouter (e.g., `openai/gpt-4o`, `anthropic/claude-sonnet-4`); avoid bare model names.
---
## Reason
OpenRouter hosts 300+ models from 20+ providers. A bare model name like `gpt-4o` is ambiguous — OpenRouter defaults to the cheapest available provider hosting it. Prefixing ensures deterministic model selection and predictable quality.
---
## Bad Example
```php
#[Model('gpt-4o')] // Which provider? Unknown until runtime.
```
---
## Good Example
```php
#[Model('openai/gpt-4o')] // Explicit: uses OpenAI's gpt-4o
```
---
## Exceptions
When intentionally using OpenRouter's price-based load balancing (cheapest provider), a bare model name is the correct approach.
---
## Consequences Of Violation
Unpredictable model quality and latency, different provider behavior than expected, debugging difficulty.
