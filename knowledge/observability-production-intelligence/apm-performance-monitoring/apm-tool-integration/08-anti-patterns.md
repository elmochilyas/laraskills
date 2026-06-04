# Anti-Patterns: APM Tool Integration

## AP-APM-01: Unsampled 100% Tracing

**Description:** Running APM agent with 100% sampling rate on high-traffic production applications.

**Why It Happens:** The default configuration in most APM agents is 100% sampling. Developers install the agent and never configure sampling.

**Consequences:**
- Span volume at 10k req/s with 20 spans/request = 200k spans/second → 17B spans/day
- APM costs skyrocket — many vendors charge by ingested span volume
- Backend processing latency increases as the platform struggles to ingest all data

**Detection:** Check APM dashboard for sampled vs total request ratio. If sampling rate shows 100% and traffic > 100 req/s, this anti-pattern is active.

**Remediation:** Configure sampling immediately. Set base rate to 10% for moderate traffic. Always-sample error and slow transactions.

---

## AP-APM-02: Health Check Transaction Pollution

**Description:** Health check, readiness probe, and liveness probe requests appearing as APM transactions, consuming sampling budget and skewing metrics.

**Why It Happens:** APM agents instrument all incoming HTTP requests by default. Health check URLs are not automatically excluded.

**Consequences:**
- 10-30% of all transactions are health checks with zero debugging value
- Apdex scores are artificially inflated (health checks return quickly)
- "Most called" transaction lists are dominated by `/health` and `/up`
- Performance dashboards misrepresent real user experience

**Detection:** Check the "top transactions" list in the APM dashboard. If `/health`, `/up`, `/ready`, or similar endpoints appear in the top 10, this anti-pattern is active.

**Remediation:** Add all health check, probe, and internal monitoring URLs to the APM agent's ignored transaction list.

---

## AP-APM-03: Dynamic Transaction Name Explosion

**Description:** APM creating a unique transaction name for every dynamic URL value — `/users/1`, `/users/2`, `/users/3` as separate transactions.

**Why It Happens:** APM agents use the raw URL path as the transaction name. Route parameters create infinitely many unique names.

**Consequences:**
- Transaction list contains thousands of entries — impossible to navigate
- Aggregated metrics (p50/p95/p99) for each individual user ID are meaningless
- Performance comparisons across instances fail — same endpoint different name
- APM storage grows linearly with unique users, not unique endpoints

**Detection:** Check the transaction list for numerical or UUID segments in names. If you see `/api/users/a1b2c3` and `/api/users/d4e5f6` as separate entries, this anti-pattern is active.

**Remediation:** Configure URL normalization rules in the APM agent to replace dynamic segments with parameter names. Use the route pattern as the transaction name.

---

## AP-APM-04: Multiple Concurrent APM Agents

**Description:** Running two or more APM agents simultaneously on the same application instances.

**Why It Happens:** Evaluation of a new tool while the old one is still active. Or, teams add APM agents for different purposes (one for errors, one for performance, one for business metrics).

**Consequences:**
- Each agent adds 3-10% CPU overhead — two agents = 6-20% overhead
- Agents may conflict when hooking the same framework events
- Double-counting of transactions across platforms
- Cost of both platforms simultaneously

**Detection:** Check `composer.json` for multiple APM packages. Check `phpinfo()` for multiple APM extensions loaded.

**Remediation:** Choose one primary APM tool. Decommission all others. If evaluating, use a dedicated staging instance for the new tool, not production.
