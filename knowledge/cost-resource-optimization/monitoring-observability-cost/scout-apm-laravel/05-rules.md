# Scout APM for Laravel — Rules

## R1: Pair Scout APM with CloudWatch for Complete Observability

**Category**: Tool Stacking

**Rule**: ALWAYS pair Scout APM (application performance) with CloudWatch (infrastructure monitoring). NEVER use Scout APM as the sole monitoring tool.

**Reason**: Scout APM is a purpose-built Laravel APM tool — it provides deep application-level insights (N+1 detection, query analysis, Octane tracing, queue performance) but does not monitor infrastructure. CloudWatch provides EC2 CPU/memory, RDS connections, ELB metrics, and Lambda invocations at zero cost. Together, they cover the full observability stack: CloudWatch for "what's happening on the server" and Scout for "what's happening in the application." Using Scout alone leaves infrastructure blind spots.

**Bad Example**: A team installs Scout APM and monitors their Laravel app performance. A server runs out of disk space — Scout does not monitor disk usage. Users see 503 errors. Scout shows "no requests" but cannot explain why. The team spends 20 minutes checking infrastructure before finding the disk issue.

**Good Example**: CloudWatch dashboard shows disk usage at 98%. Scout dashboard shows response times at 200ms. When disk fills, CloudWatch alarm fires, the team investigates, and clears space before Scout ever shows a degradation. Scout still provides APM insights but is not needed for infrastructure monitoring.

**Exceptions**: For teams also using PagerDuty or OpsGenie, integrate CloudWatch alarms there. For teams on Laravel Forge, Forge provides basic server monitoring — but CloudWatch is more comprehensive.

**Consequences Of Violation**: Infrastructure issues go undetected until they affect Scout's metrics (requests stop). The APM-only blind spot can cause extended outages while the team traces performance issues back to infrastructure causes.

---

## R2: Start at $99/Month Plan — Only Upgrade When Consistently Exceeding 100 Req/Min

**Category**: Plan Selection

**Rule**: ALWAYS start with the Scout APM $99/month plan (100 req/min). ONLY upgrade to the $299/month unlimited plan when average traffic consistently exceeds 100 req/min for 1+ week.

**Reason**: The $99/month plan covers 100 requests per minute = 144,000 requests/day = 4.3M requests/month. Most mid-size Laravel apps operate well below this threshold during normal traffic. The $299/month plan is necessary only for high-traffic apps (>500 req/s). Starting at $299 when $99 suffices wastes $200/month for no benefit. Scout allows plan changes without data loss — upgrade only when needed.

**Bad Example**: A Laravel SaaS with 50 req/s average signs up for the $299/month unlimited plan. Monthly traffic: 2.16M requests. The $99/month plan covers 4.3M requests — more than enough. Annual waste: $2,400.

**Good Example**: The same SaaS starts on the $99/month plan. After 6 months, traffic grows to 120 req/s average (172,800 requests/day). They monitor for 2 weeks and confirm sustained >100 req/min. They upgrade to $299/month. During the 6-month period, they saved $1,200.

**Exceptions**: Apps that have 50+ concurrent users from launch (high-traffic APIs, popular consumer apps) may need the $299 plan immediately. Use the 14-day free trial with the higher plan to measure actual traffic.

**Consequences Of Violation**: Paying 3x more than necessary for APM. Annual waste of $2,400 for a SaaS that could use the $99 plan for years.

---

## R3: Enable Octane Instrumentation for Octane-Based Apps

**Category**: Feature Utilization

**Rule**: ALWAYS enable Scout APM's Octane instrumentation when running Laravel Octane. NEVER run Octane without Scout's Octane-specific tracing.

**Reason**: Octane changes Laravel's architecture fundamentally — workers persist across requests, connections are reused, and memory accumulates. Standard PHP-FPM APM instrumentation does not accurately capture Octane behavior: it may miss per-worker memory growth, connection reuse patterns, and the true source of long-running requests. Scout's Octane support provides per-worker CPU/memory breakdown, connection pool analysis, and worker lifecycle tracing — essential for Octane performance optimization.

**Bad Example**: A team runs Laravel Octane on 4 workers with standard Scout APM (Octane instrumentation disabled). A memory leak in one worker grows from 100MB to 500MB over 24 hours. Standard APM shows "server memory: OK" because other workers balance the total. The worker eventually crashes. Investigation time: 3 hours.

**Good Example**: Scout Octane instrumentation shows per-worker memory: Worker 3 at 480MB (90th percentile), others at 100MB. The team identifies the leak (cached user data not cleared) and fixes it. Time to identify: 15 minutes. Octane dashboard provides the granularity needed.

**Exceptions**: Apps not using Octane (standard PHP-FPM) do not need Octane instrumentation. Scout's standard APM covers PHP-FPM fully.

**Consequences Of Violation**: Octane memory leaks and worker-specific issues go undetected until they cause worker crashes. Standard APM tools aggregate per-worker data into server-level metrics, hiding per-worker problems.

---

## R4: Use Scout's Deployment Tracking for Release Comparison

**Category**: Deploy Monitoring

**Rule**: ALWAYS tag deployments in Scout APM to correlate performance changes with releases. NEVER deploy to production without deployment tracking enabled.

**Reason**: Scout's deployment tracking compares application performance (response time, error rate, throughput) before and after each deploy. This immediately identifies regressions — a query that was 50ms before a deploy and 500ms after. Without deployment tracking, a performance regression introduced by a deploy is attributed to "natural variance" or "load change," delaying root cause identification.

**Bad Example**: A team deploys a new feature that adds an N+1 query. Average response time increases from 200ms to 600ms. Without deployment tracking, the team sees the increase but doesn't correlate it with the deploy. They spend 2 days investigating infrastructure changes, database load, and caching before realizing the deploy caused it.

**Good Example**: Scout deployment tracking shows: Pre-deploy p95 = 300ms. Post-deploy p95 = 800ms. The comparison graph clearly shows the change at the deploy timestamp. The team opens the deploy diff and sees the N+1 query within 10 minutes. Fix deployed in 30 minutes.

**Exceptions**: For CI/CD pipelines that deploy multiple times per hour, marking each merge as a deploy may be noisy. Tag only production releases (not staging or PR deploys).

**Consequences Of Violation**: Performance regressions introduced by deployments go unidentified for days. The team investigates infrastructure causes before code causes, extending MTTR significantly.

---

## R5: Configure Scout Error Alerting — It's Included in Flat Pricing

**Category**: Alert Utilization

**Rule**: ALWAYS configure Scout APM's built-in error alerting. NEVER pay extra for separate error monitoring tools (Sentry, Rollbar) when Scout includes error tracking at no additional cost.

**Reason**: Scout APM's flat pricing includes error tracking, alerting, and deployment monitoring — no per-alarm or per-event charges. If you already pay $99/month for Scout, its error alerting is "free" (included). Adding Sentry ($26-50/month) or Rollbar ($20-100/month) duplicates functionality and adds cost. Use Scout for APM + errors, and only add a separate tool if Scout's error features are insufficient.

**Bad Example**: A team pays Scout $99/month for APM + Sentry $29/month for error tracking. Scout includes error tracking with alerting, but the team never configured it. Monthly waste on Sentry: $29/month ($348/year) for redundant functionality.

**Good Example**: The team configures Scout error alerting: notify on any endpoint with >5% error rate, notify on any 500 error for critical endpoints. They remove Sentry. Monthly APM cost: $99/month (includes APM + error tracking + deployment monitoring). Savings: $29/month.

**Exceptions**: Teams needing advanced error workflow (multi-user assignment, sprint integration, release tracking with Jira) may benefit from Sentry or Rollbar's specialized error management features. Evaluate if Scout's error tracking is sufficient before adding another tool.

**Consequences Of Violation**: Paying for duplicate error monitoring tool when Scout's included features cover the need. Additional $300-1,200/year in tooling costs for no additional value.
