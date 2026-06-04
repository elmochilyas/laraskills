---
id: ku-01
title: "Cost Tracking & Allocation - Rules"
subdomain: "cost-management-observability"
ku-type: "operations"
date-created: "2026-06-02"
---

## Rules for Cost Tracking & Allocation

### R1: Always compute cost server-side using a maintained pricing table, never trust provider-reported cost
- **Category:** Cost Management
- **Rule:** Implement a `CostCalculator` service that computes per-request cost from token counts and a locally-managed pricing table; use provider-reported cost only as a cross-reference.
- **Reason:** Provider-reported costs may be delayed, use different pricing than your negotiated rate, or change without notice. Server-side computation gives you immediate, accurate cost data.
- **Bad Example:** Reading `response->usage()->costInDollars` from the provider response and logging it directly without server-side verification.
- **Good Example:** A middleware that after receiving the response calculates `$promptTokens * $pricingTable['gpt-4o']['prompt'] + $completionTokens * $pricingTable['gpt-4o']['completion']`.
- **Exceptions:** Fixed-price provider contracts where per-request cost is not needed.
- **Consequences of Violation:** Cost reports that diverge from actual invoices by 10-30%, leading to incorrect budget decisions and billing disputes.

### R2: Attribute costs to the correct dimension (user, tenant, feature) at request time, not in batch
- **Category:** Observability
- **Rule:** Log cost attribution metadata (user_id, tenant_id, feature_name, model) in the same operation that records the LLM response; never defer cost attribution to batch processing.
- **Reason:** Retroactive cost attribution requires reconstructing request context from logs, which is error-prone and loses attribution when context is incomplete. Real-time attribution ensures accuracy.
- **Bad Example:** A nightly cron job that parses generic API logs and tries to infer which user made each request.
- **Good Example:** A middleware that receives the authenticated user and request context, computes cost, and writes `AiCostEntry { user_id, feature, model, cost, timestamp }` to the observability pipeline.
- **Exceptions:** Anonymous or unauthenticated requests with no attribution dimension.
- **Consequences of Violation:** Cost breakdowns that cannot be accurately attributed to users or features, making optimization and chargeback impossible.

### R3: Set budget alerts at 50%, 80%, 90%, and 100% thresholds, never just at 100%
- **Category:** Cost Management
- **Rule:** Configure multi-tier alert thresholds (50%, 80%, 90%, 100%) for every budget, with different notification channels per tier (Slack at 50%, email at 80%, PagerDuty at 90%, SMS at 100%).
- **Reason:** Discovering a budget overrun only at 100% is too late — the invoice is already accruing overage charges. Early warnings allow corrective action before overspend occurs.
- **Bad Example:** A single alert at 100% budget exhausted, which fires only after all budget has been spent.
- **Good Example:** 50% = Slack to team: "Half monthly AI budget used"; 80% = Email: "Downgrading model to cheapest"; 90% = PagerDuty: "Near hard cap"; 100% = SMS: "Budget exhausted, requests blocked."
- **Exceptions:** Extremely small budgets (<$100/month) where granular alerts add noise.
- **Consequences of Violation:** Teams discover budget issues only on the monthly invoice, missing the opportunity to take corrective action during the billing period.

### R4: Keep the pricing table in a config service or database, never hardcoded in application code
- **Category:** Maintainability
- **Rule:** Store provider pricing (per-model, per-token-type) in a configuration file, database table, or external config service that can be updated without deploying application code.
- **Reason:** Provider pricing changes quarterly (or more frequently for new models). Hardcoded prices require a code deployment to update, which lags behind provider changes and causes cost tracking inaccuracies.
- **Bad Example:** `class PricingTable { const PRICES = ['gpt-4o' => ['prompt' => 0.00001, 'completion' => 0.00003]]; }` in source code.
- **Good Example:** `ai_pricing` database table with an admin UI for updates, or a configuration file loaded from a config service on application boot.
- **Exceptions:** Applications using a single provider with a stable, contractually-fixed pricing agreement.
- **Consequences of Violation:** Cost reports using outdated prices that are 10-50% off from actual provider billing, leading to inaccurate budget allocation.
