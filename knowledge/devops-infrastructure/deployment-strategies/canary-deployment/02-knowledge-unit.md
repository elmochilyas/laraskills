# Canary Deployment

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Deployment Strategies
- **Knowledge Unit:** Canary Deployment
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

Canary deployment gradually rolls out a new version to a small subset of users before full deployment, catching issues with a fraction of users instead of all users. It provides real-world validation under production traffic before full exposure and requires mature observability and automated rollback infrastructure.

---

## Core Concepts

- **Canary Group** — Subset of users or infrastructure that receives the new version first
- **Traffic Split** — Percentage-based routing between old and new versions (e.g., 5% canary, 95% stable)
- **Observability Comparison** — Real-time comparison of error rates, latency, and throughput between canary and stable
- **Auto-Rollback** — Automated reversion when canary metrics exceed defined thresholds
- **Progressive Rollout** — Gradual increase of canary traffic (5% → 25% → 50% → 100%)

---

## Mental Models

- **Production Is the True Test** — No staging environment perfectly replicates production traffic patterns, data volume, or user behavior. Canary deployments make production itself the final test environment.
- **Statistical Significance** — A 5% canary on 100 req/min gives you 5 req/min — not enough data to detect issues. The canary must be large enough to generate statistically meaningful metrics.
- **Relative Comparison** — Compare canary metrics to current stable metrics, not absolute thresholds. If both versions have 5% errors due to infrastructure issues, the canary is still healthy relative to baseline.

---

## Internal Mechanics

Canary deployment starts with traffic routing at the load balancer. The new version is deployed to a subset of instances, and the load balancer routes a configured percentage of traffic to those instances. Observability systems compare key metrics (error rate, latency, throughput) between canary and stable instances in real time. If metrics exceed defined thresholds within the observation window, auto-rollback triggers: the canary instances are drained and traffic routes entirely to the stable version. If metrics remain healthy, the canary percentage is progressively increased until 100% of traffic is on the new version.

---

## Patterns

- **Feature Flag Complement** — Deploy new code with the feature flag disabled, then enable the flag for the canary group. This cleanly separates deployment from release.
- **Consistent Canary Groups** — Route specific users or segments to the canary consistently. Random routing creates inconsistent experiences where the same request alternates between versions.
- **Warm-Up Exclusion** — New instances may perform differently during JIT compilation and cache warming. Exclude the first few minutes of canary data from metric comparison.

---

## Architectural Decisions

- **Canary vs. Blue-Green** — Choose canary when you want to validate with a subset of users before full rollout; choose blue-green when you need instant rollback and full traffic switch
- **Canary vs. Feature Flags** — Canary and feature flags are complementary: use both. Deploy with flag off, enable flag for canary, ramp flag percentage.
- **Load Balancer-Based vs. Service Mesh** — Simple canary can use Nginx upstream weights; advanced canary with request-based routing requires service mesh (Istio)

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Reduced blast radius of bad releases | Requires mature observability infrastructure | Cannot implement canary without real-time metric comparison |
| Real-world validation under production traffic | Statistical significance requires minimum traffic threshold | Low-traffic applications cannot use canary effectively |
| Gradual rollout with automated rollback | Implementation complexity | Simple tools may not support progressive traffic shifting |
| Catches issues not found in staging | Session affinity complicates traffic splitting | Users may have inconsistent experience during split |

---

## Performance Considerations

Minimum canary traffic of 1000 requests/minute is recommended for reliable error rate comparison. Observability overhead requires monitoring infrastructure that can process and compare metrics with minimal latency. New instances may need warm-up time during JIT compilation and cache warming — exclude initial data from comparison. Canary group sizing must balance statistical significance against blast radius.

---

## Production Considerations

Define clear rollback criteria before deployment: error rate increase > 1%, p95 latency increase > 20%, or any 5xx spike. Traffic routing mechanisms must be secured against manipulation. If the canary has a data exposure vulnerability, only the canary group's data is exposed — restrict sensitive features from canary traffic. Services and databases must support dual-version operation during the canary window.

---

## Common Mistakes

- **Insufficient Canary Traffic** — Running a 1% canary on 100 req/min gives 1 req/min — not enough data to detect issues. Increase canary percentage or time window.
- **Comparing to Wrong Baseline** — Comparing canary metrics to yesterday's metrics instead of current stable metrics. Infrastructure changes or time-of-day effects create false positives.
- **No Auto-Rollback** — Observing canary issues but requiring manual rollback. By the time a human responds, significantly more users are affected. Always implement auto-rollback at threshold.
- **Ignoring Warm-Up Effect** — New instances perform differently during initial warm-up. Exclude the first few minutes of canary data from comparison.

---

## Failure Modes

- **False Negative (Missed Bad Release)** — Canary group is too small to detect existing issues. Detection: incident arises after full rollout, canary metrics showed no anomaly. Mitigation: ensure minimum traffic to canary, monitor in aggregate over longer windows.
- **False Positive (Rollback Good Release)** — Transient infrastructure issue triggers canary threshold. Detection: auto-rollback on healthy code. Mitigation: compare canary to current stable baseline, not absolute thresholds; use multiple metric windows.
- **Session Breakage** — Canary routing splits a user's session across versions. Detection: inconsistent user behavior, session errors. Mitigation: use consistent canary groups (cookie-based, user-ID-based routing).

---

## Ecosystem Usage

Laravel applications typically implement canary deployment through the hosting layer rather than the application itself. Nginx upstream weights can route traffic percentage to canary servers. Kubernetes Ingress controllers support weighted service routing. Feature flags (Laravel Pennant) complement canary deployments by separating code deployment from feature release. Envoyer does not natively support canary deployments — you need load balancer-level traffic splitting.

---

## Related Knowledge Units

### Prerequisites
- Load balancer configuration, basic deployment workflows

### Related Topics
- Blue-Green Deployment (alternative strategy)
- Feature Flags (complementary approach)
- Zero-Downtime Deployment

### Advanced Follow-up Topics
- A/B Testing Infrastructure
- Progressive Delivery
- Service Mesh Canary (Istio)

---

## Research Notes

Canary deployment requires statistical significance — 5% of 100 requests/minute tells you nothing. Calculate minimum canary traffic before recommending canary strategy. Auto-rollback thresholds must be defined per-application, not copied generically. Monitor the first 3-5 canary deployments to establish baseline thresholds. Canary and feature flags are complementary but separate concerns: deploy with flag off, enable flag for canary, ramp flag percentage.
