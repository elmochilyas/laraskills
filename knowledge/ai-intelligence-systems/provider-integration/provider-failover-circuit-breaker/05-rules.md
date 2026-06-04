## Always Configure a Failover Chain
---
## Category
Reliability | Scalability
---
## Rule
Define an ordered failover chain with at least two providers in `config/ai.php`; never deploy with a single provider dependency.
---
## Reason
Provider outages are inevitable (API degradation, rate-limit spikes, model deprecation). A failover chain ensures AI feature availability degrades gracefully rather than failing completely. The SDK tries providers sequentially until one succeeds.
---
## Bad Example
```php
// config/ai.php — single provider
'default' => ['driver' => 'openai', 'model' => 'gpt-4o'],
```
---
## Good Example
```php
'default' => ['driver' => 'openai', 'model' => 'gpt-4o'],
'failover' => [
    ['driver' => 'anthropic', 'model' => 'claude-sonnet-4-20250514'],
    ['driver' => 'groq', 'model' => 'llama-3.3-70b'],
],
```
---
## Exceptions
Internal tools or development environments where temporary AI unavailability is acceptable need not configure failover.
---
## Consequences Of Violation
Complete AI feature outage during provider downtime, SLA breaches, revenue loss for AI-dependent features.

## Ensure Feature Parity Across Failover Providers
---
## Category
Reliability | Testing
---
## Rule
Verify that every provider in the failover chain supports the features (tool calling, structured output, streaming) required by your agents; never fail over to a provider that cannot fulfill the request.
---
## Reason
If the primary provider supports tool calling but the fallback does not, a failover silently breaks the agent's core functionality. Feature gaps in failover providers cause confusing errors that are harder to diagnose than a direct outage.
---
## Bad Example
```php
// Failover to a model that doesn't support tools
'failover' => [
    ['driver' => 'openai', 'model' => 'gpt-4o-mini'], // No tool support on some tiers
],
```
---
## Good Example
```php
// All providers in chain support tools
'failover' => [
    ['driver' => 'anthropic', 'model' => 'claude-sonnet-4-20250514'],
    ['driver' => 'openai', 'model' => 'gpt-4o'],
],
```
---
## Exceptions
Agents that only use basic text generation (no tools, no structured output) may use simpler failover providers.
---
## Consequences Of Violation
Broken agent behavior during failover, silent errors, wasted tokens on unsupported features.

## Test Failover Paths in Staging
---
## Category
Testing | Reliability
---
## Rule
Simulate provider failures in staging to validate that failover chains work correctly before they are needed in production.
---
## Reason
Failover paths are rarely exercised during normal operation. Untested failover configurations may contain misconfigured API keys, incompatible models, or network connectivity issues that are only discovered during a real outage.
---
## Bad Example
```php
// Failover configured but never tested
// When OpenAI goes down, Anthropic key is invalid — complete outage
```
---
## Good Example
```php
// In staging test:
public function test_failover_works_when_primary_provider_fails(): void {
    Config::set('ai.default', ['driver' => 'openai']);
    // Temporarily invalidate primary provider
    Http::fake(['api.openai.com/*' => Http::response('{}', 500)]);
    
    $response = Ai::call(messages: [['role' => 'user', 'content' => 'hello']]);
    $this->assertNotNull($response->text);
}
```
---
## Exceptions
Short-lived projects may skip failover testing if they accept the risk of single-provider dependency.
---
## Consequences Of Violation
Failover fails silently during production outage, engineering discovers broken fallback under incident pressure, extended downtime.

## Monitor Failover Frequency
---
## Category
Observability
---
## Rule
Log and alert on every failover activation; track failover rate per provider over time.
---
## Reason
Frequent failover indicates a provider degradation issue that may require attention (new API version, rate limit exhaustion, account problem). Silent failover masks underlying problems that can escalate if unaddressed.
---
## Bad Example
```php
// Failover happens transparently — no logging, no alerting
```
---
## Good Example
```php
// In custom failover middleware:
if ($provider !== $primaryProvider) {
    Log::warning('AI provider failover activated', [
        'from' => $primaryProvider,
        'to' => $provider,
        'error' => $exception->getMessage(),
    ]);
    FailoverCounter::increment($provider);
}
```
---
## Exceptions
Development environments where provider flakiness is expected may reduce alerting sensitivity.
---
## Consequences Of Violation
Provider degradation goes undetected, root cause not addressed, cascading failures from unmonitored issues.
