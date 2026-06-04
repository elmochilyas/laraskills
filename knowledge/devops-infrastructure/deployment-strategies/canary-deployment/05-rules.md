# Rules: Canary Deployment

## CANARY-001: Statistical Significance
**Condition:** Canary deployment active
**Action:** Canary group must receive minimum 1000 requests/minute for reliable metric comparison
**Rationale:** Insufficient traffic makes error rate and latency comparisons statistically meaningless
**Consequences:** Violation leads to false positive or false negative rollback decisions

## CANARY-002: Auto-Rollback Thresholds
**Condition:** Canary deployment in progress
**Action:** Define automated rollback thresholds before deployment begins
**Rationale:** Manual rollback introduces delay during which more users are impacted
**Consequences:** Violation extends blast radius and recovery time for bad releases

## CANARY-003: Baseline Comparison
**Condition:** Evaluating canary health metrics
**Action:** Compare canary metrics to current stable version metrics, not historical data
**Rationale:** Infrastructure and traffic changes affect both versions equally
**Consequences:** Violation causes false positives from unrelated environment changes

## CANARY-004: Warm-Up Window Exclusion
**Condition:** Canary instances have been running less than 5 minutes
**Action:** Exclude canary metrics from comparison during warm-up period
**Rationale:** Cold instances exhibit degraded performance from cache misses and JIT compilation
**Consequences:** Violation causes false positive rollback on healthy deployments

## CANARY-005: Backward-Compatible Schema
**Condition:** Canary deployment includes database migrations
**Action:** All schema changes must be backward-compatible with old code version
**Rationale:** Majority traffic still runs old code during canary phase
**Consequences:** Violation causes application errors for the 95% stable traffic
