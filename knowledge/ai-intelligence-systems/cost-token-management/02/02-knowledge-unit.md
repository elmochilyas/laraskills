# Knowledge Unit: Cost Optimization Strategies

## Metadata

- **ID:** ku-02
- **Subdomain:** Cost Management & Observability
- **Slug:** cost-optimization-strategies
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Cost optimization for AI systems involves reducing LLM API spend without sacrificing application quality. Because LLM costs scale linearly with token usage (and super-linearly with model size), optimization strategies focus on reducing token consumption, choosing cost-efficient models per task, caching, and minimizing wasted inference. In the Laravel AI ecosystem, cost optimization is a continuous process driven by cost tracking data from ku-01, applied via prompt engineering, model selection, caching, and architectural patterns.

## Core Concepts

- **Model Selection:** Choosing the cheapest model that meets quality requirements for each task. Use small/cheap models for simple tasks, large/expensive models only when needed.
- **Prompt Compression:** Reducing prompt token count without losing essential information (summarization, truncation, keyword extraction).
- **Semantic Caching:** Caching LLM responses for similar queries. Cache hit rates of 20-50% are achievable in production.
- **Batching:** Combining multiple independent requests into a single LLM call (batch inference) reduces per-request overhead.
- **Context Window Management:** Keeping the context window as small as possible â€” only include relevant information, not the entire document.
- **Fallback Chain:** Try cheap model first; fall back to expensive model only if the cheap model's quality is insufficient.
- **Token Budgeting:** Allocating a token budget per request category and enforcing it at the application level.

## Mental Models

- **Model Selection:** Choosing the cheapest model that meets quality requirements for each task. Use small/cheap models for simple tasks, large/expensive models only when needed.
- **Prompt Compression:** Reducing prompt token count without losing essential information (summarization, truncation, keyword extraction).
- **Semantic Caching:** Caching LLM responses for similar queries. Cache hit rates of 20-50% are achievable in production.


## Internal Mechanics

The internal mechanics of Cost Optimization Strategies follow established patterns within the Cost Management & Observability domain. The implementation leverages the Laravel AI SDK conventions and ecosystem best practices.

- **Measure before optimizing.** Use cost tracking (ku-01) to identify the biggest cost drivers before applying optimizations.
- **Profile by endpoint/feature.** Different features have vastly different cost profiles. Optimize the most expensive features first.
- **Set quality benchmarks** for each optimization. Don't optimize cost at the expense of unacceptable quality degradation.
- **Use caching aggressively for idempotent requests.** Semantic caching with 0.85-0.95 similarity thresholds can capture most repeated queries.
- **Implement a model router** that selects the cheapest adequate model per request based on task type, complexity, and user tier.
- **Review and prune tool schemas.** Unused or overly verbose tool schemas waste prompt tokens. Keep tool descriptions concise.

## Patterns

- **Measure before optimizing.** Use cost tracking (ku-01) to identify the biggest cost drivers before applying optimizations.
- **Profile by endpoint/feature.** Different features have vastly different cost profiles. Optimize the most expensive features first.
- **Set quality benchmarks** for each optimization. Don't optimize cost at the expense of unacceptable quality degradation.
- **Use caching aggressively for idempotent requests.** Semantic caching with 0.85-0.95 similarity thresholds can capture most repeated queries.
- **Implement a model router** that selects the cheapest adequate model per request based on task type, complexity, and user tier.
- **Review and prune tool schemas.** Unused or overly verbose tool schemas waste prompt tokens. Keep tool descriptions concise.

## Architectural Decisions

- Implement a **model router** as middleware or a service that selects the model based on request characteristics.
- Use **prompt compression** as a pre-processing step before sending to the LLM. Compress long documents to summaries, extract key facts.
- For caching, use a **two-tier approach**: exact match cache (Redis) and semantic cache (vector DB). Check exact first, then semantic.
- Implement **progressive fallback**: call cheap model â†’ evaluate quality â†’ if low confidence, call expensive model with the same prompt.
- Monitor **cost-per-outcome**, not just cost-per-request. A cheap model that requires 3 retries is more expensive than an expensive model that works first time.

## Tradeoffs

Standard approach vs Custom implementation is the primary tradeoff in this KU. Standard implementations offer faster development and community support but may have overhead. Custom implementations provide tailored solutions at the cost of maintenance burden.

## Performance Considerations

- Model selection routing adds <1ms (simple config lookup).
- Prompt compression (summarization) requires an LLM call. Only compress when the prompt exceeds a threshold (e.g., >4000 tokens).
- Semantic cache lookup adds 5-50ms (embedding + vector search). Use it when the latency savings from a cache hit (>1000ms) justify the lookup cost.
- Fallback chains add latency: cheap model response time + evaluation + expensive model response time. Time budgets must account for worst case.
- Batching trades latency for throughput. Use batching for async/background tasks, not real-time requests.

## Production Considerations

- **Cache poisoning:** Malicious input could poison the cache with incorrect responses. Validate cached responses against content safety policies.
- **Model router manipulation:** Ensure the model selection logic cannot be overridden by user input (no user-specified model selection).
- **Fallback evaluation:** The quality evaluation step must be secure against adversarial manipulation.
- **Prompt compression:** Compressed prompts must retain safety guardrails. Don't compress away system instructions.
- **Cost visibility:** Users should not be able to see detailed cost data (may reveal business logic or usage patterns).

## Common Mistakes

- Optimizing before measuring â€” fixing the wrong bottleneck wastes effort.
- Applying the same optimization to all endpoints â€” chat, search, and summarization have different optimization profiles.
- Over-caching: caching dynamic or user-specific responses (stale data, data leakage). Use cache keys that include user context.
- Using the cheapest model for critical tasks without quality validation â€” cost savings are worthless if quality suffers.
- Not accounting for retry costs â€” a cheap model with 30% error rate may cost more than a reliable expensive model.

## Failure Modes

- **Penny-Wise, Pound-Foolish:** Optimizing prompt tokens by 10% while ignoring the 10x cost difference between model tiers.
- **Cache Invalidation Chaos:** Complex caching rules that cause frequent misses. Start with simple TTL-based caching.
- **Model Roulette:** Randomly trying different models without systematic quality evaluation. Use A/B testing with quality metrics.
- **Premature Optimization:** Building complex optimization infrastructure before confirming significant cost exists.
- **Ignoring Latency-Cost Tradeoff:** Cheaper models are often slower (different hardware). Compute cost per unit of latency.

## Ecosystem Usage

### Model Router
```php
class CostOptimizedRouter {
    private array $routing = [
        'simple_chat' => ['model' => 'gpt-4o-mini', 'max_tokens' => 500],
        'analysis' => ['model' => 'gpt-4o', 'fallback' => 'claude-3-opus'],
        'code_generation' => ['model' => 'claude-3-sonnet', 'fallback' => 'gpt-4o'],
        'embedding' => ['model' => 'text-embedding-3-small'],
    ];

    public function route(RequestContext $context): ModelRoute {
        $taskType = $this->classifyTask($context);
        return ModelRoute::fromConfig($this->routing[$taskType] ?? $this->routing['simple_chat']);
    }
}
```

### Progressive Fallback
```php
class ProgressiveFallback {
    public function execute(string $prompt): string {
        // Try cheap model first
        $cheapResult = $this->llm->chat($prompt, model: 'gpt-4o-mini');
        if ($this->qualityChecker->isSufficient($cheapResult, $prompt)) {
            return $cheapResult;
        }
        // Fall back to expensive model
        return $this->llm->chat($prompt, model: 'gpt-4o');
    }
}
```

## Related Knowledge Units

- ku-01 (Cost Tracking & Allocation): Data that drives optimization decisions.
- ku-03 (Observability & Alerting): Monitoring cost optimization impact.
- ku-05 (Budget Management): Budget-aware optimization policies.
- prompt-engineering-systems/ku-03: Prompt compression techniques.
- ai-middleware-gateway/ku-01: Gateway-level caching and routing.

## Research Notes

Source: Domain analysis for AI and Intelligence Systems (Laravel/PHP ecosystem)
Source: Laravel AI SDK documentation and ecosystem package references

