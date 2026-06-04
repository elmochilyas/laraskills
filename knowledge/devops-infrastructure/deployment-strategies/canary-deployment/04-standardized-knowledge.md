# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 02-deployment-strategies
**Knowledge Unit:** canary-deployment
**Difficulty:** Advanced
**Category:** Deployment Strategies
**Last Updated:** 2026-06-03

# Overview

Canary deployment is a release strategy where a new version is gradually rolled out to a small subset of users before full deployment. If the canary exhibits errors or performance degradation, the rollout is halted or rolled back. This minimizes blast radius of bad releases and provides real-world validation before full exposure.

The strategy exists because production environments are the only true test environments. No staging environment perfectly replicates production traffic patterns, data volume, or user behavior. The engineering value is risk reduction — catching issues with a fraction of users instead of all users.

# Core Concepts

- **Canary Group** — subset of users/infrastructure that receives the new version first
- **Traffic Split** — percentage-based routing between old and new versions (5% canary, 95% stable)
- **Observability Comparison** — real-time comparison of error rates, latency, and throughput between canary and stable
- **Auto-Rollback** — automated reversion when canary metrics exceed defined thresholds
- **Progressive Rollout** — gradual increase of canary traffic (5% → 25% → 50% → 100%)

# When To Use

- High-traffic applications where a full bad release impacts many users
- Teams with mature observability and automated rollback infrastructure
- Risk-averse deployments (payment systems, healthcare, critical APIs)
- Validation of performance characteristics under real traffic
- A/B testing infrastructure where feature flags overlap with deployment strategy

# When NOT To Use

- Low-traffic applications where canary groups lack statistical significance
- Teams without real-time observability to detect canary issues
- Stateful changes that are not reversible (destructive data migrations)
- Applications with session affinity requirements that complicate traffic splitting
- Greenfield projects with no production traffic

# Best Practices

**Start Small.** Begin with 1-5% traffic to the canary. The canary should be large enough to generate statistically significant metrics but small enough that a bad release doesn't cause meaningful damage.

**Define Clear Rollback Criteria.** Error rate increase > 1%, p95 latency increase > 20%, or any 5xx spike should trigger automatic rollback. Document these thresholds before deployment.

**Compare Canary to Baseline.** The canary must be compared to the stable version, not to absolute thresholds. If both versions are experiencing 5% errors due to an infrastructure issue, the canary is still healthy relative to baseline.

**Use Consistent Canary Groups.** Route specific users or segments to the canary consistently. Random routing creates inconsistent user experiences where the same request alternates between versions.

# Architecture Guidelines

Traffic splitting occurs at the load balancer (Nginx upstream weights, AWS ALB weighted target groups, Istio traffic routing). The application itself should not know whether it is serving canary or stable traffic.

Services and databases must support dual-version operation. Code changes that require new database columns or changed API contracts must be backward-compatible.

Feature flags can complement canary deployments. Deploy the new code with the feature flag disabled, then enable the feature flag for the canary group. This separates deployment from release.

# Performance Considerations

**Canary Group Sizing.** Too small: metrics lack statistical significance. Too large: bad release impacts too many users. Rule of thumb: minimum 1000 requests/minute to the canary for reliable error rate comparison.

**Observability Overhead.** Canary analysis requires real-time metric comparison. Ensure monitoring infrastructure can process and compare metrics with minimal latency.

**Warm-Up Effect.** New instances may perform differently during JIT compilation and cache warming. Exclude the first few minutes of canary data from comparison.

# Security Considerations

**Canary Data Exposure.** If the canary has a data exposure vulnerability, only the canary group's data is exposed. Ensure the canary group cannot access sensitive features that the stable version restricts.

**Canary Routing Security.** Traffic routing mechanisms must be secured against manipulation. An attacker who can route themselves into the canary group can probe for vulnerabilities before they are exposed to the general population.

# Common Mistakes

**Insufficient Canary Traffic.** Running a 1% canary on an application with 100 requests/minute. The canary receives 1 request/minute — not enough data to detect issues. Increase canary percentage or time window for detection.

**Comparing to Wrong Baseline.** Comparing canary metrics against yesterday's metrics instead of current stable metrics. Infrastructure changes, traffic patterns, or time-of-day effects create false positives.

**No Auto-Rollback.** Observing canary issues but requiring manual rollback. By the time a human responds, significantly more users are affected. Auto-rollback at threshold.

# Examples

**Nginx Canary Routing:**
```
upstream app {
    server stable.internal weight=95;
    server canary.internal weight=5;
}
```

**Rollback Criteria Configuration:**
```yaml
rollback:
  metrics:
    - name: error_rate
      comparison: relative
      threshold: "+1%"
      window: 5m
    - name: p95_latency
      comparison: relative
      threshold: "+20%"
      window: 5m
    - name: 5xx_count
      comparison: absolute
      threshold: "> 10"
      window: 1m
  action: auto_rollback
```

# Related Topics

**Prerequisites:** Load balancer configuration, basic deployment workflows
**Closely Related:** Blue-Green Deployment (alternative), Feature Flags (complementary), Zero-Downtime Deployment
**Advanced Follow-Ups:** A/B Testing Infrastructure, Progressive Delivery, Service Mesh Canary (Istio)
**Cross-Domain Connections:** Observability & Monitoring, Application Performance Management

# AI Agent Notes

- Canary deployment requires statistical significance — 5% of 100 requests/minute tells you nothing. Agents should calculate minimum canary traffic before recommending canary strategy.
- Auto-rollback thresholds must be defined per-application, not copied generically. Agents should recommend monitoring the first 3-5 canary deployments to establish baseline thresholds.
- Canary and feature flags are complementary but separate concerns. Agents should recommend using both: deploy with flag off, enable flag for canary, ramp flag percentage.
