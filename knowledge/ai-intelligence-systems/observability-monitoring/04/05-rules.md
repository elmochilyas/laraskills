---
id: ku-04
title: "Token Usage & Cost Tracking - Rules"
subdomain: "observability-monitoring"
ku-type: "implementation"
date-created: "2026-06-02"
---

## Rules for Token Usage & Cost Tracking

### R1: Always capture token usage data (input_tokens, output_tokens, model) from every LLM call
- **Category:** Observability
- **Rule:** Extract and log token counts from every LLM response, including streaming responses (aggregate from chunks); never make an LLM call without recording the token usage.
- **Reason:** Without per-call token data, cost tracking is impossible, usage trends cannot be analyzed, and budget overruns are detected only when the bill arrives. Token data is essential for all cost management.
- **Bad Example:** A production system that logs "AI request completed" but not the token counts — the team can't explain why the monthly bill is $5,000 over budget.
- **Good Example:** Every response handler extracts `$response->usage()?->inputTokens` and `$response->usage()?->outputTokens` and records them to a `llm_requests` table or logs.
- **Exceptions:** Provider errors where no usage data is returned.
- **Consequences of Violation:** No visibility into per-feature cost; budget overruns go undetected until invoicing; unable to identify cost-efficient providers or models.

### R2: Implement a cost projection model based on historical usage patterns for budget forecasting
- **Category:** Cost Management
- **Rule:** Build a daily cost projection from historical token usage data, broken down by agent/feature, model, and provider; use the projection to generate budget alerts when projected spend exceeds 80% of budget.
- **Reason:** Reactive cost management (waiting for the monthly bill) is too late. Proactive projections based on real usage patterns give Finance and Engineering time to respond to cost trends.
- **Bad Example:** Finance receives a monthly AWS bill with "AI Services - $12,000" and asks Engineering "is this correct?" — no one can say because there's no cost model.
- **Good Example:** A daily cron runs `CostProjectionCommand::forecast()`, projecting: "Based on 14-day trend, AgentChat will exceed its $5,000 monthly budget in 6 days."
- **Exceptions:** Free-tier or fixed-price providers where cost is not usage-dependent.
- **Consequences of Violation:** Budget overruns discovered when invoices arrive; no mechanism to reallocate budget or throttle usage before hitting limits.

### R3: Track token usage at both aggregate and per-request granularity with agent/feature dimensions
- **Category:** Observability
- **Rule:** Store token usage with at-minimum dimensions: `agent_name`, `feature_name`, `user_id`, `model`, `provider`, `timestamp`; never record only aggregate totals without breakdown dimensions.
- **Reason:** Aggregate totals tell you how much you spent but not what you spent it on. Without dimensions, you can't identify which agent is the cost driver, which users are heavy users, or which model is most cost-effective.
- **Bad Example:** A single "total_tokens" counter incrementing per request — the team can't answer "how much does the customer support agent cost vs the content generator?"
- **Good Example:** A `llm_requests` table with columns: `agent`, `feature`, `user_id`, `model`, `provider`, `input_tokens`, `output_tokens`, `cost`, `created_at`. Queries like "total cost by agent this month" are trivial.
- **Exceptions:** High-volume scenarios where per-request logging is too expensive — use sampled or aggregated logging instead.
- **Consequences of Violation:** Inability to answer basic cost allocation questions; cannot identify cost-saving opportunities (e.g., switching a specific agent to a cheaper model).
