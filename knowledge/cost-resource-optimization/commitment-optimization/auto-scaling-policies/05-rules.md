# Auto Scaling Policies — Rules

## R1: Prefer Target Tracking over Step or Simple Scaling

**Category**: Scaling Policy Selection

**Rule**: ALWAYS use target tracking scaling as the default policy for web tier auto scaling. NEVER use simple scaling (deprecated). Use step scaling only when target tracking's single-metric approach cannot express the required scaling behavior.

**Reason**: Target tracking automatically maintains a metric at a target value (e.g., CPU at 60%) with built-in cooldown and proportional scaling — it requires no manual threshold tuning and adapts to traffic patterns. Step scaling requires defining exact thresholds and capacity increments, which drift as traffic patterns change. Simple scaling executes only one action per alarm and ignores cooldown windows, causing oscillation.

**Bad Example**: Configuring a step scaling policy with thresholds at 40%, 60%, 80% CPU and fixed capacity increments of +1, +2, +4 — these thresholds become stale after a code deployment changes the app's CPU profile.

**Good Example**: Configuring target tracking with ALB RequestCountPerTarget set to 5000 requests/min per instance — AWS automatically calculates the required capacity adjustment and maintains the target regardless of traffic pattern shifts.

**Exceptions**: Use step scaling when you need different response magnitudes (e.g., add 2 instances at 70% CPU, add 6 at 90%) and target tracking's proportional response is insufficient. Never use simple scaling in any circumstance.

**Consequences Of Violation**: Stale thresholds cause either under-provisioning (traffic exceeds capacity before alarm fires) or over-provisioning (alarm fires too early). Simple scaling causes thrashing. Both result in degraded user experience and higher costs.

---

## R2: Always Use ALB RequestCountPerTarget, Not CPU, for Web Tier Scaling

**Category**: Metric Selection

**Rule**: ALWAYS use ALB RequestCountPerTarget as the primary scaling metric for web tier auto scaling groups. AVOID using CPU utilization as the sole scaling metric.

**Reason**: Request count per target is the most direct measure of user-facing load for web applications. CPU utilization can spike from non-traffic work (queue processing, cron jobs, cache warming) or remain low under high traffic if the app is I/O-bound (waiting on database queries). Scaling on CPU causes either false-positive scale-outs (CPU spike from background job) or false-negative scale-stays (high traffic but low CPU because queries are waiting on RDS).

**Bad Example**: An ASG scales out at 70% CPU utilization. A database migration script runs on web servers at 2 AM, CPU hits 90%, ASG adds 3 unnecessary instances costing $60 extra for the night.

**Good Example**: ASG scales when ALB RequestCountPerTarget exceeds 5000 requests/minute. Traffic spikes to 8000 req/min, ASG adds 2 instances. When traffic drops back to 3000 req/min, ASG scales in. Cost matches actual demand.

**Exceptions**: Use CPU-based scaling for compute-bound internal services (video encoding, image processing) where request count does not correlate with load. For web-facing Laravel apps, always prefer request count.

**Consequences Of Violation**: Scaling does not match actual user demand — either over-provisioning (wasted cost) or under-provisioning (degraded performance). Typical waste is 20-40% of compute spend.

---

## R3: Set Instance Warm-Up Time to 120-300 Seconds via Lifecycle Hooks

**Category**: Instance Lifecycle

**Rule**: ALWAYS configure lifecycle hooks on auto scaling groups to delay instance registration with the ALB until warm-up completes. Set a 120-300 second warm-up period for Laravel applications.

**Reason**: New instances require time to boot the OS, start PHP-FPM or Octane, warm application caches, and pass health checks before they can serve traffic. Without lifecycle hooks, instances register with the ALB immediately and receive traffic before they are ready, causing 502/504 errors and failed health checks that trigger instance replacement.

**Bad Example**: An ASG adds 3 instances during a traffic spike. Each instance starts serving traffic immediately via the ALB health check but Laravel boot takes 45 seconds — users see 502 errors for 45 seconds, support gets 30 tickets.

**Good Example**: Lifecycle hook pauses instance at "Pending:Wait" state for 120 seconds. During this time, the instance boots Laravel, warms the OpCache, pre-loads config, and runs a health check script. Only after passing does it signal `complete-lifecycle-action` and register with the ALB. Zero errors during scale-out.

**Exceptions**: Reduce warm-up to 30-60 seconds for containerized Laravel on Fargate (faster boot). Increase to 300+ seconds for apps that pre-warm a 5GB+ cache or compile assets on first request.

**Consequences Of Violation**: Scaling out causes error spikes instead of capacity relief. Users experience errors during traffic spikes — the exact moments they need reliability. Instance churn increases as health checks repeatedly fail.

---

## R4: Combine Predictive + Dynamic Scaling — Never Use One Without the Other

**Category**: Scaling Strategy

**Rule**: ALWAYS combine predictive scaling (proactive) with target tracking dynamic scaling (reactive) for production web tiers. NEVER use predictive scaling alone without dynamic fallback.

**Reason**: Predictive scaling uses ML to forecast traffic and pre-provisions capacity 15-30 minutes before load arrives, eliminating cold-start latency. However, predictions are never perfect — traffic may exceed the forecast due to unexpected events (marketing campaign, viral post, partner traffic). Dynamic scaling catches the variance between forecast and actual traffic. Combined, they provide both proactivity (no lag) and reactivity (no gaps).

**Bad Example**: Predictive-only scaling: ML forecasts 10 instances for Thursday 2 PM. A marketing email goes out at 1:55 PM, traffic surges to 15 instances worth. Predictive scaling does not react (it's not designed to) — capacity stays at 10, users experience errors.

**Good Example**: Predictive scaling pre-provisions 10 instances for the forecasted traffic. Target tracking dynamic scaling monitors real-time request count. When traffic exceeds the forecast, dynamic scaling adds 3 more instances within 2 minutes. Users see no errors.

**Exceptions**: For non-production environments, predictive scaling alone may suffice. For apps with truly random traffic patterns (gaming, flash sales), skip predictive and use only dynamic scaling with aggressive step policies.

**Consequences Of Violation**: Without dynamic fallback, unexpected traffic spikes cause under-provisioning and errors. Without predictive, scaling always lags behind traffic (2-5 minute delay). Either way, users experience degraded performance during traffic transitions.

---

## R5: Set Scale-In Cool-Down to 10+ Minutes to Prevent Thrashing

**Category**: Cooldown Configuration

**Rule**: ALWAYS configure scale-in cool-down to 10 minutes or longer for web tier auto scaling groups. Set scale-out cool-down shorter (60-180 seconds).

**Reason**: New instances take 2-5 minutes to reach full operational state (boot + warm-up + first request processing). If scale-in cool-down is shorter than this, the ASG may terminate instances just as they become fully productive — a phenomenon called "thrashing" that wastes resources and degrades performance. Longer scale-in cool-down ensures instances serve requests for a meaningful period before being considered for termination.

**Bad Example**: Scale-in cool-down = 180 seconds. ASG scales out 3 instances (takes 120s to boot, 60s to warm up). At 240 seconds, traffic dips briefly, and the ASG terminates 2 instances that just became fully productive. Traffic spikes again at 300 seconds, requiring another scale-out.

**Good Example**: Scale-in cool-down = 600 seconds (10 minutes). Instances serve traffic for at least 10 minutes before being eligible for termination. Brief traffic dips do not trigger premature scale-in. Instances contribute meaningful work before potential termination.

**Exceptions**: Reduce scale-in cool-down for cost-optimized non-production environments where instance hour cost is the priority. Increase to 15+ minutes for apps with long-running user sessions (SSE, WebSocket connections via Laravel Reverb).

**Consequences Of Violation**: Instance thrashing — constant creation and destruction of instances that never serve meaningful traffic. 2-5x higher than necessary instance launch costs. Inconsistent performance as instances constantly enter and leave the pool.

---

## R6: Set Minimum Capacity to 2 (Multi-AZ) and Maximum to a Cost Cap

**Category**: ASG Boundaries

**Rule**: ALWAYS set auto scaling group minimum capacity to 2 (for multi-AZ redundancy) and maximum capacity to a cost-bounded cap (2-3x expected peak). NEVER set min = max (defeats scaling) or leave max unbounded.

**Reason**: A minimum of 2 ensures the application survives a single AZ outage while maintaining service. A cost-capped maximum prevents runaway scaling from misconfigured policies or traffic anomalies (DDoS, slashdot effect) — without a cap, a pricing error could cause a $50,000+ bill in a single day.

**Bad Example**: ASG min=1 max=100. A DDoS attack drives request count to 100x normal. The ASG scales to 80 instances before the attack is mitigated. Monthly bill: $12,000 above normal. No cost cap exists to stop the scaling.

**Good Example**: ASG min=2 max=20. Normal traffic: 4 instances. A traffic spike triggers scaling to 15 instances. A DDoS attack triggers scaling to 20 but hits the cap — cost is controlled at $3,000 above normal while the attack is mitigated. The cap provides a financial circuit breaker.

**Exceptions**: Single-AZ deployments (dev/staging) may set min=1. High-security apps may accept single-AZ for compliance. For mission-critical production, always min=2 with multi-AZ.

**Consequences Of Violation**: No capacity = no fault tolerance (single instance failure = outage). No maximum cap = uncontrolled cost from traffic anomalies. A single pricing error or traffic surge can exceed monthly infrastructure budget in hours.

---

## R7: Use Mixed Instances Groups for Spot Diversification

**Category**: Spot Integration

**Rule**: ALWAYS configure auto scaling groups with mixed instances policies that include 3+ instance types and 2+ AZs when using Spot instances. ALWAYS set On-Demand fallback percentage (20-50%).

**Reason**: Spot capacity varies by instance type and AZ. A single instance type in a single AZ creates a single capacity pool — if that pool runs out of Spot capacity, all Spot instances are interrupted simultaneously. Diversifying across types and AZs reduces interruption probability by 60-80%. The On-Demand percentage ensures that if Spot is completely unavailable, critical capacity is maintained on On-Demand.

**Bad Example**: Mixed instances policy with only r6g.large in us-east-1a. When r6g.large Spot capacity is reclaimed in us-east-1a, all 10 Spot instances terminate. No fallback instances launch because no On-Demand percentage is configured. Service goes down.

**Good Example**: Mixed instances policy: r6g.large, r6i.large, r6a.large across us-east-1a and us-east-1b. On-Demand base = 30%. When one instance type is reclaimed, the ASG automatically launches replacement instances from remaining pools. The 30% On-Demand ensures baseline capacity is always available.

**Exceptions**: For pure On-Demand or RI-only ASGs, mixed instances groups are not needed. For Fargate, capacity providers handle diversification automatically.

**Consequences Of Violation**: Single-pool Spot configuration causes total Spot capacity loss during interruptions. Without On-Demand fallback, an entire fleet can become unavailable. Service degradation or outage during Spot shortage events.
