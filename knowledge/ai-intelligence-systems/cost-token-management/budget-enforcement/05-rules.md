---
id: KU-041
title: "Budget Enforcement - Rules"
subdomain: "cost-token-management"
ku-type: "implementation"
date-created: "2026-06-02"
---

## Rules for Budget Enforcement

### R1: Always implement pre-flight cost estimation before sending requests to the LLM provider
- **Category:** Cost Management
- **Rule:** Estimate prompt token count and compute projected cost before every LLM API call; abort the request with a clear error if the estimated cost would exceed the remaining budget.
- **Reason:** LLM API costs are incurred the moment the request is sent. Post-hoc budget enforcement can only warn about overages — it cannot prevent the cost from being incurred.
- **Bad Example:** Running budget enforcement as a nightly batch job that reconciles costs after they've already been incurred.
- **Good Example:** A middleware that calls `CostCalculator::estimate($prompt)` and checks against a Redis budget counter before forwarding the request to the provider.
- **Exceptions:** When using fixed-price provider contracts where per-request cost tracking is informational.
- **Consequences of Violation:** Budget overruns discovered only on the monthly invoice, with no way to retroactively prevent the excess spend.

### R2: Implement progressive model downgrade rather than abrupt hard cap rejection
- **Category:** UX
- **Rule:** Configure a soft cap (~80% budget) that triggers automatic model downgrade (e.g., GPT-4o → GPT-4o-mini), reserving hard cap rejection as a last resort at 100%.
- **Reason:** Abrupt budget rejection at the limit point creates a jarring UX where features stop working without warning. Progressive degradation gives users continued but degraded service.
- **Bad Example:** A hard limit at 100% that returns 429 errors, with no prior warning or quality degradation.
- **Good Example:** At 80% budget, switch to `#[UseCheapestModel]` and notify the user; at 100%, return 429 with a clear "budget exhausted, resets on [date]" message.
- **Exceptions:** Compliance-critical applications where exceeding budget incurs contractual penalties that justify hard limits.
- **Consequences of Violation:** User frustration and churn from sudden feature blocks; support tickets about broken AI features at month-end.

### R3: Use atomic Redis operations for budget checks to prevent race conditions
- **Category:** Reliability
- **Rule:** Perform budget check and decrement as an atomic Redis operation (MULTI/EXEC or Lua script) to prevent concurrent requests from both passing the budget check independently.
- **Reason:** Without atomicity, two simultaneous requests can both read a budget of $4.50 against a $5.00 limit, both pass, and together overshoot by $4.00.
- **Bad Example:** `$current = $redis->get($key); if ($current + $cost < $limit) { $redis->set($key, $current + $cost); }` — two concurrent reads both see $4.50.
- **Good Example:** A Lua script that atomically checks against the limit, decrements, and returns the result in a single Redis call.
- **Exceptions:** Applications where approximate budget enforcement with periodic reconciliation is acceptable.
- **Consequences of Violation:** Budget overshoot of up to 2x the limit during traffic bursts, potentially exceeding allocated AI spend.

### R4: Store budget state in Redis with database persistence, not in Redis alone
- **Category:** Reliability
- **Rule:** Write budget state to both Redis (real-time enforcement) and the database (durable record); implement a reconciliation job that corrects any drift between the two.
- **Reason:** Redis is ephemeral — a restart, failover, or cache flush loses all budget counters, resetting all budgets to zero and creating an unbounded spending window.
- **Bad Example:** Budget counters stored only in Redis with no persistence; a Redis restart resets all user budgets to their full monthly allowance.
- **Good Example:** In-app budget written to Redis with TTL, plus a queued job that persists each decrement to a `budget_usage` database table.
- **Exceptions:** Non-critical budgets where a spend spike on Redis failure is acceptable.
- **Consequences of Violation:** On Redis failure, all budget enforcement is disabled, and the organization may incur significant unbudgeted AI costs before the issue is detected.
