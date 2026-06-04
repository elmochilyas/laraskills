# Skills: Canary Deployment

## Skill: canary-release-setup
**Purpose:** Design and implement a canary deployment pipeline
**Trigger:** When gradual rollout and automated rollback are required
**Workflow:**
1. Determine minimum canary traffic for statistical significance
2. Configure load balancer weighted routing for canary/stable split
3. Set up real-time metric comparison (error rate, latency, throughput)
4. Define auto-rollback thresholds with appropriate windows
5. Implement progressive rollout stages (5%, 25%, 50%, 100%)
6. Configure alerting for canary health anomalies
7. Test auto-rollback mechanism before first canary deployment
**Output:** Canary deployment pipeline with defined thresholds and automated safety gates

## Skill: canary-metric-analysis
**Purpose:** Monitor and analyze canary deployment health metrics
**Trigger:** During active canary deployment roll-out
**Workflow:**
1. Verify canary receiving expected traffic volume
2. Compare error rates between canary and stable (relative threshold)
3. Compare latency percentiles (p50, p95, p99) between canary and stable
4. Check throughput and request volume consistency
5. Validate auto-rollback thresholds are appropriate
6. Document findings for threshold tuning
**Output:** Canary health assessment with go/no-go recommendation
