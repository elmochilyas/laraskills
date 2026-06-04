---
id: ku-01
title: "Cost Tracking & Allocation"
subdomain: "cost-management-observability"
ku-type: "operations"
date-created: "2026-06-02"
domain-maturity: "mature"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/cost-management-observability/ku-01/04-standardized-knowledge.md"
---

# Cost Tracking & Allocation

## Overview

Cost tracking and allocation for AI systems involves measuring, attributing, and reporting the monetary cost of every LLM API call. Because LLM costs vary by provider, model, token count, and caching strategy, accurate cost tracking requires a server-side pricing table applied per-request. Costs must be attributed to the appropriate dimension (user, tenant, feature, application) for billing, budget management, and optimization. In the Laravel AI ecosystem, cost tracking is implemented at the gateway middleware layer and aggregated in the observability pipeline.

## Core Concepts

- **Per-Request Cost:** Cost of a single LLM API call = (prompt tokens × prompt price) + (completion tokens × completion price).
- **Pricing Table:** A configuration that maps provider + model to per-token prices (prompt and completion). Must be updated when providers change pricing.
- **Cost Attribution:** Assigning each request's cost to a dimension (user_id, tenant_id, feature_name, application_id) for aggregation.
- **Budget:** A spending limit per dimension over a time window (daily, monthly). Hard limits block requests; soft limits alert.
- **Cost Aggregation:** Summing costs by dimension over time for reporting and dashboards.
- **Cost Allocation:** Distributing shared costs (fixed provider fees, embedding cache infrastructure) across dimensions proportionally.
- **Chargeback/Showback:** Presenting cost data to internal teams (showback) or billing them directly (chargeback).

## When To Use

- Any production AI system using paid LLM APIs — you cannot optimize what you don't measure.
- Multi-tenant SaaS applications where each tenant's usage must be billed.
- Applications with free tiers — tracking cost per free user prevents budget overruns.
- Teams that need to justify AI spend to management or clients.
- Systems experimenting with model selection — cost data guides model choices.

## When NOT To Use

- Local development with free/limited APIs (no cost to track).
- Applications with fixed-price provider contracts (still track usage, but per-request cost tracking is less critical).

## Best Practices

- **Compute cost server-side** from a maintained pricing table. Don't rely on provider-reported cost (may be delayed or missing).
- **Track cost at request time**, not in batch. Store cost per request in the same log entry as tokens and latency.
- **Use a granular pricing table** that handles different pricing for different models, providers, and regions.
- **Attribute costs to the right dimension** from the start. Changing attribution later requires re-processing historical data.
- **Set budgets and alert early.** Configure alerts at 50%, 80%, 90%, and 100% of budget. Never discover a budget overrun on the invoice.
- **Include all costs:** API calls, embedding generation, vector DB queries, gateway infrastructure, and human review overhead.

## Architecture Guidelines

- Implement cost computation as **middleware** after the LLM response is received (tokens are in the response).
- Use a **config service** (database, config file, or API) for the pricing table — update prices without code deployment.
- Store cost data in the **same observability pipeline** as metrics and logs (Elasticsearch, ClickHouse, or time-series DB).
- For real-time budget enforcement, use a **Redis counter** per dimension with TTL matching the budget window.
- For historical analysis, aggregate costs into a **data warehouse** (or Laravel's database with summary tables).

## Performance Considerations

- Cost computation is a simple arithmetic operation (<0.01ms). Do it synchronously in the request path.
- Pricing table lookup: cache in memory with <1μs access. Update from config service every 5 minutes.
- Cost log writes: async (queue-based) to avoid adding latency to the LLM request.
- Aggregate queries over millions of requests: use pre-aggregated summary tables or a column-store database.
- Budget checks in Redis: <1ms per check. Pipeline checks for batch operations.

## Security Considerations

- **Cost data confidentiality:** Cost per user/tenant may be sensitive (reveals usage patterns). Restrict access to cost reports.
- **Budget manipulation:** Ensure cost reporting cannot be spoofed by malicious requests. Server-side computation only.
- **Pricing table integrity:** Protect the pricing table from unauthorized modification (only admins should update prices).
- **Chargeback data accuracy:** If billing depends on cost data, implement reconciliation processes and audit trails.
- **Resource exhaustion:** A user without budget limits can exhaust the organization's LLM budget. Always enforce budgets for external-facing APIs.

## Common Mistakes

- Not tracking cost at all — the first invoice is a surprise.
- Using provider-reported cost without server-side verification — providers may change billing models.
- Only tracking direct API costs (ignoring infrastructure, vector DB, embedding costs).
- Attributing costs to the wrong dimension (e.g., all costs attributed to "default" with no breakdown).
- Setting budgets but not alerts — the budget is hit silently until the invoice arrives.

## Anti-Patterns

- **Cost After the Fact:** Computing cost during batch processing days later. Track at request time for real-time budget enforcement.
- **One-Size-Fits-All Pricing:** Using average cost per token instead of model-specific pricing. Off by 10x+ for expensive models.
- **Ignoring Caching Savings:** Not tracking how much cost caching saves. Report both gross and net cost.
- **Stale Pricing Table:** Using last year's model prices. Provider pricing changes quarterly; update the pricing table proactively.
- **No Cost Per Feature:** Costs attributed to "AI" as a whole, not per feature. You can't optimize if you don't know which feature is expensive.

## Examples

### Cost Calculator
```php
class CostCalculator {
    public function __construct(private PricingRepository $pricing) {}

    public function compute(ChatResponse $response): Cost {
        $pricing = $this->pricing->get($response->provider(), $response->model());

        $promptCost = $response->promptTokens * $pricing->promptPricePerToken;
        $completionCost = $response->completionTokens * $pricing->completionPricePerToken;

        return new Cost(
            promptCost: $promptCost,
            completionCost: $completionCost,
            total: $promptCost + $completionCost,
        );
    }
}
```

### Budget Enforcer
```php
class BudgetEnforcer {
    public function __construct(private Redis $redis) {}

    public function check(string $userId, Cost $estimatedCost): bool {
        $key = "budget:daily:{$userId}:" . date('Y-m-d');
        $current = (float) $this->redis->get($key) ?: 0;
        $dailyBudget = $this->getDailyBudget($userId);

        if ($current + $estimatedCost->total > $dailyBudget) {
            return false; // budget exceeded
        }
        return true;
    }

    public function record(string $userId, Cost $cost): void {
        $key = "budget:daily:{$userId}:" . date('Y-m-d');
        $this->redis->incrByFloat($key, $cost->total);
        $this->redis->expire($key, 86400);
    }
}
```

## Related Topics

- ku-02 (Cost Optimization Strategies): Using cost data to drive optimization.
- ku-03 (Observability & Alerting): Cost dashboards and alerts.
- ku-04 (Token Usage Analytics): Token-level breakdown for cost analysis.
- ku-05 (Budget Management): Budget policies and enforcement.
- ai-middleware-gateway/ku-05: Gateway observability includes cost tracking.

## AI Agent Notes

- When asked to implement cost tracking, first identify: what dimensions to attribute costs to, what pricing table to use, and what budget enforcement is needed.
- For cost-related issues, check: pricing table accuracy, attribution dimension mapping, and whether all cost components are tracked.
- Prefer reading the cost calculator before the pricing repository — the calculation logic reveals what costs are tracked.
- When generating cost tracking code, include currency precision (use cents/microcents, not floats).

## Verification

- [ ] Cost is computed server-side per request using a maintained pricing table.
- [ ] Cost is attributed to configurable dimensions (user, tenant, feature, application).
- [ ] Budget limits are configurable per dimension and enforced in real-time.
- [ ] Cost alerts are configured at 50%, 80%, 90%, and 100% of budget.
- [ ] Pricing table is up-to-date with current provider prices (updated quarterly).
- [ ] Cost data is stored in the observability pipeline for reporting.
- [ ] All cost components are tracked (API, embeddings, vector DB, infrastructure).
