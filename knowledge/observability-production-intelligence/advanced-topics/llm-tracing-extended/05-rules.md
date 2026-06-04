# Phase 5: Behavioral Rules — LLM Tracing with OpenTelemetry

## Always Record Prompts as Span Events — Not Span Attributes
---
## Performance
---
Record LLM prompt content as span events (`$span->addEvent('gen_ai.prompt', ...)`) rather than span attributes to avoid bloating indexed span metadata.
---
Span attributes are indexed and searchable in most backends, creating oversized payloads and increased storage cost when large prompt text (100K+ tokens) is stored as attributes. Span events are not indexed, reducing storage overhead while keeping prompts accessible for debugging.
```php
// Bad: Prompt in span attribute — indexed, costs more
$span->setAttribute('gen_ai.prompt', $fullPrompt);  // 10KB+ in index
```
```php
// Good: Prompt as span event — not indexed
$span->addEvent('gen_ai.prompt', ['content' => $fullPrompt]);
```
---
No common exceptions.
---
Bloated span attributes; increased storage costs; degraded trace query performance.
---

## Always Include gen_ai.request.model Attribute on Every LLM Span
---
## Reliability
---
Always set the `gen_ai.request.model` attribute (e.g., `gpt-4o`, `claude-sonnet-4-20250514`) on every LLM span so performance regressions can be correlated with model version changes.
---
Without the model attribute, a performance regression or behavior change cannot be attributed to a model upgrade. If `gpt-4o` is replaced by `gpt-4o-mini` and response quality drops, missing model attributes make investigation guesswork.
```php
// Bad: Missing model version
$span->setAttribute('gen_ai.system', 'openai');
// No model attribute — was this GPT-4o or GPT-4o-mini?
```
```php
// Good: Model version recorded
$span->setAttribute('gen_ai.system', 'openai');
$span->setAttribute('gen_ai.request.model', 'gpt-4o-2024-11-20');
```
---
No common exceptions.
---
Cannot correlate regressions with model upgrades; incorrect cost attribution across models.
---

## Never Record Full Prompts in Production Without PII Redaction
---
## Security
---
Implement PII redaction on LLM prompt and completion content before recording them as span events — prompts may contain PII, secrets, or proprietary business data.
---
User prompts often contain personally identifiable information (names, emails, addresses), proprietary business data, or API keys injected by system prompts. Recording these without redaction creates compliance violations and data leaks.
```php
// Bad: Raw prompt recorded without redaction
$span->addEvent('gen_ai.prompt', [
    'content' => "Hi, my email is john@example.com and I live at 123 Main St."
]);
```
```php
// Good: Redacted prompt content
$sanitized = $this->redactPII($userMessage);
$span->addEvent('gen_ai.prompt', [
    'content' => "Hi, my email is [REDACTED] and I live at [REDACTED]."
]);
```
---
Fully internal LLM usage with no user-facing prompts and no PII risk.
---
GDPR/CCPA violations; proprietary data leaks; credentials exposure in observability system.
---

## Sample LLM Traces at Higher Rate Than General Traffic
---
## Scalability
---
Configure LLM traces at 100% sampling (or near-100%) because they carry cost attribution data — never sample them at the same low rate as general traffic.
---
LLM traces contain token usage data needed for cost attribution. Sampling at 10% means 90% of cost data is lost, making cost dashboards inaccurate. The storage cost of LLM traces is justified by their cost attribution value.
```php
// Bad: Same low sampling for LLM traces
'traces_sampler' => fn($ctx) => 0.1; // 10% — loses 90% of cost data
```
```php
// Good: Higher sampling for LLM traces
'traces_sampler' => function ($ctx) {
    if ($ctx->getRoute() === 'api/chat') return 1.0; // 100% for LLM
    return 0.1; // 10% for everything else
};
```
---
Very low-traffic LLM features where the cost of higher sampling is negligible.
---
Inaccurate cost attribution; unrecoverable cost data loss for budgeting.
---

## Use a Wrapper Service for All LLM Calls to Ensure Consistent Instrumentation
---
## Code Organization
---
Create a dedicated service class that wraps all LLM API calls with consistent OTel span creation, attribute setting, and error handling — never instrument LLM calls ad-hoc in controllers.
---
Without a centralized wrapper, each developer instruments LLM calls differently — some forget attributes, some use different span names, some skip error attribution. This creates inconsistent, incomplete traces that cannot be aggregated or compared.
```php
// Bad: Ad-hoc LLM instrumentation in controllers
// Controller A: $span->setAttribute('model', 'gpt-4o');
// Controller B: $span->setAttribute('llm_model', 'claude'); // Different name!
```
```php
// Good: Centralized LLM service
class LlmService
{
    public function chat(string $prompt, array $options): string
    {
        $span = $this->tracer->spanBuilder('llm.chat')->startSpan();
        $span->setAttribute('gen_ai.system', $this->provider);
        $span->setAttribute('gen_ai.request.model', $options['model']);
        try {
            $response = $this->client->chat($prompt, $options);
            $this->recordTokenUsage($span, $response);
            return $response;
        } catch (\Exception $e) {
            $span->setStatus(StatusCode::STATUS_ERROR, $e->getMessage());
            $span->recordException($e);
            throw $e;
        } finally {
            $span->end();
        }
    }
}
```
---
No common exceptions.
---
Inconsistent instrumentation; missing attributes; inability to aggregate LLM metrics across features.
---

## Measure Both First-Token Latency and Total Completion Time for Streaming LLM Calls
---
## Performance
---
For streaming LLM calls, record both time-to-first-token and total completion time as distinct span attributes to separately track model reasoning latency vs output generation.
---
Total completion time alone doesn't distinguish between "model took 30 seconds to start generating" (slow reasoning) and "model generated 2000 tokens at normal speed" (expected). First-token latency is the user-perceived responsiveness metric.
```php
// Bad: Only total completion time
$span->setAttribute('duration_ms', $totalTime);
// Can't tell if the model was thinking or generating
```
```php
// Good: Both metrics recorded
$span->setAttribute('llm.time_to_first_token_ms', $firstTokenTime);
$span->setAttribute('llm.completion_time_ms', $totalTime);
// time_to_first_token > 5s: model reasoning bottleneck
// completion_time_ms - time_to_first_token > expected: generation bottleneck
```
---
Non-streaming LLM calls where completion is received as a single response.
---
Cannot distinguish model reasoning delays from output generation delays; misdiagnosed performance issues.
