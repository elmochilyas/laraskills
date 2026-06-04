# Phase 5: Behavioral Rules — Token Usage & Cost Monitoring

## Always Separate Prompt Token Tracking From Completion Token Tracking
---
## Performance
---
Track `gen_ai.response.usage.prompt_tokens` and `gen_ai.response.usage.completion_tokens` as separate metrics because completion tokens cost 2-4x more than prompt tokens.
---
Combining prompt and completion tokens into a single metric hides the cost differential. Optimizing prompt size (system prompts, conversation history) is a different strategy than reducing completion length (max_tokens, response formatting).
```php
// Bad: Combined token tracking — hides cost differential
$tokenCounter->add($totalTokens, ['feature' => 'chat']);
// $2.50/1M input + $10/1M output = different optimization strategies needed
```
```php
// Good: Separate prompt and completion tracking
$promptCounter->add($promptTokens, ['feature' => 'chat']);
$completionCounter->add($completionTokens, ['feature' => 'chat']);
// Alert: prompt_tokens growing — check system prompt or conversation history
// Alert: completion_tokens growing — check max_tokens or model directive
```
---
No common exceptions.
---
Hidden cost optimization opportunities; misattributed cost drivers.
---

## Always Include Model Version in Every Token Record
---
## Reliability
---
Include the `gen_ai.request.model` dimension (e.g., `gpt-4o`, `gpt-4o-mini`) on every token counter metric to enable accurate cost calculation per model.
---
GPT-4o and GPT-4o-mini have a 20x cost difference ($2.50/1M vs $0.15/1M input tokens). Without model dimension, cost dashboards use a blended average that is inaccurate for any specific model and hides the cost impact of model selection decisions.
```php
// Bad: No model dimension on token metrics
$tokenCounter->add($tokens, ['feature' => 'chat']);
// Cannot calculate cost — don't know which model was used
```
```php
// Good: Model dimension included
$tokenCounter->add($tokens, [
    'feature' => 'chat',
    'gen_ai.model' => 'gpt-4o',           // $2.50/1M input
    'gen_ai.system' => 'openai',
]);
// Cost calculation: tokens × model_specific_pricing
```
---
Applications using only one model at a fixed price point.
---
Inaccurate cost allocation; inability to compare model cost efficiency.
---

## Set Daily Token Budget Alerts per Feature at 80% Threshold
---
## Scalability
---
Configure daily/weekly token budget alerts per AI feature (not just aggregate) so anomalous consumption is detected before it causes budget overruns.
---
Aggregate budget alerts only fire when total spending is high, missing isolated anomalies in a single feature. A bug in the chat feature's conversation history management can double token consumption silently if only the total budget is monitored.
```php
// Bad: Only aggregate budget monitoring
// Monthly total gets flagged — but which feature caused the spike?
```
```php
// Good: Per-feature budget alerts
// Config per feature:
'budgets' => [
    'chat-assistant' => [
        'daily_token_budget' => 1_000_000,
        'alert_at' => 80, // 800K tokens → alert
    ],
    'content-summary' => [
        'daily_token_budget' => 500_000,
        'alert_at' => 80,
    ],
],
// Alert: "chat-assistant consumed 850K tokens today (85% of budget)"
```
---
No common exceptions.
---
Anomalous token consumption in a single feature goes undetected; budget overrun surprises.
---

## Never Use Per-User IDs as Metric Labels for Token Tracking
---
## Scalability
---
Aggregate per-user token tracking to user tier (free/pro/enterprise) in metrics — keep per-user detail in traces only, not in Prometheus/metrics labels.
---
Each unique user as a metric label creates unbounded cardinality. With 10,000 users, even a single metric explodes to 10,000 time series. This crashes the metrics backend and makes dashboards unqueryable.
```php
// Bad: user_id as metric label — cardinality explosion
$tokenCounter->add($tokens, [
    'user_id' => $user->id,       // 10K users = 10K time series
    'feature' => 'chat',
]);
```
```php
// Good: Aggregate by user tier
$tokenCounter->add($tokens, [
    'user_tier' => $user->tier,   // "free", "pro", "enterprise" = 3 series
    'feature' => 'chat',
]);
// Keep per-user detail in traces (high cardinality is fine in span attributes)
```
---
No common exceptions.
---
Metrics backend crash; unlimited time series; storage cost explosion.
---

## Externalize Token-to-Cost Conversion to Configuration — Never Hardcode
---
## Maintainability
---
Store per-model pricing in external configuration (env vars, API endpoint) rather than hardcoding token-to-cost conversion in application code.
---
Model pricing changes frequently (OpenAI adjusts prices, new models launch, negotiation discounts). Hardcoded pricing requires a code deployment to update costs, leading to stale cost dashboards that show incorrect numbers.
```php
// Bad: Hardcoded pricing in application code
$cost = ($promptTokens / 1000000) * 2.50 + ($completion / 1000000) * 10.00;
// GPT-4o price change: requires code change + deployment
```
```php
// Good: Externalized pricing config
// config/llm-costs.php or env vars:
'pricing' => [
    'gpt-4o' => ['input_per_m' => 2.50, 'output_per_m' => 10.00],
    'gpt-4o-mini' => ['input_per_m' => 0.15, 'output_per_m' => 0.60],
];
// Dashboard layer multiplies tokens × pricing from config
```
---
No common exceptions.
---
Stale cost dashboards; every pricing change requires application deployment.
