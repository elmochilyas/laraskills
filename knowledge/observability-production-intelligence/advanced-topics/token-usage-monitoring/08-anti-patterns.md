# Anti-Pattern 1: No Per-User Tracking

**Name:** Aggregate-only token monitoring

**Problem:** Tracking only total token usage without per-user breakdown. The total cost looks normal ($50/day), but one user is consuming 80% of the tokens. They have a runaway script that calls the LLM API in a loop. Without per-user tracking, this goes undetected until the monthly bill.

**Detection:** Total cost is within budget, but one user's usage is 100x normal. No per-user dashboards exist. Cannot answer "which user is driving costs?"

**Remediation:** Add user_id to token tracking. Use structured logs for per-user detail. Set per-user anomaly alerts.

**Prevention:** Per-user token tracking must be built into the LLM service layer from day one. Without user attribution, cost optimization and abuse detection are impossible.

# Anti-Pattern 2: No Cost Anomaly Detection

**Name:** Cost discovery at month end

**Problem:** Token costs are tracked but no anomaly detection is configured. Costs increase gradually over the month — a prompt injection attack runs for 3 days before being noticed. The team discovers the cost when the monthly API bill arrives.

**Detection:** Monthly LLM API bill is 5x the expected amount. Investigation reveals the cost spike started 3 weeks ago. No alert was triggered.

**Remediation:** Implement cost anomaly detection with daily baselines. Set alerts at 2x baseline for total cost and 3x for per-user.

**Prevention:** Cost anomaly detection is not optional for LLM features. Set it up before the feature goes to production. No alerting = no cost control.

# Anti-Pattern 3: User ID as Metric Label

**Name:** High-cardinality Prometheus metrics

**Problem:** Creating OTel Counter metrics with `user_id` as an attribute. Each unique user creates a separate time series in Prometheus. With 10,000 users, the `llm.token.usage` metric generates 10,000+ time series. Prometheus performance degrades.

**Detection:** Prometheus query performance degrades. Cardinality dashboard shows `llm.token.usage` with 10,000+ unique label combinations. Alertmanager is overloaded.

**Remediation:** Remove `user_id` from metric attributes. Use structured logs for per-user token tracking. Use metrics for aggregate counters only (per model, per feature).

**Prevention:** Never use high-cardinality identifiers (user_id, session_id, request_id) as metric attributes. Logs handle per-user detail; metrics handle aggregated views.

# Anti-Pattern 4: Client-Side Budget Enforcement

**Name:** Trusting the client

**Problem:** Token budget limits are checked on the client side before sending LLM requests. A modified client or direct API call bypasses the budget check. Users can exceed their token budget by bypassing the client.

**Detection:** User exceeds token budget but client continued sending requests. Investigation reveals the budget check is in JavaScript and easily bypassed.

**Remediation:** Move all budget enforcement to the server. Check user's token count before processing each LLM request. Reject server-side if budget exceeded.

**Prevention:** All security and enforcement logic must be server-side. Client-side enforcement is a speed bump, not a barrier. Treat budget enforcement the same as authentication — never trust the client.
