# Rules: Pipeline Structure

## PIPE-001: Build Once, Deploy Everywhere
**Condition:** Multi-environment deployment pipeline
**Action:** Build process produces single artifact deployed to all environments
**Rationale:** Different artifacts per environment allow undetected differences to reach production
**Consequences:** Violation causes "works in staging, fails in production" scenarios

## PIPE-002: Fail-Fast Ordering
**Condition:** Pipeline stages designed
**Action:** Run fast-feedback stages (lint, static analysis) before slower stages (tests)
**Rationale:** Slow feedback encourages developers to bypass pipeline or commit less frequently
**Consequences:** Violation degrades developer experience and CI adoption

## PIPE-003: Independent Stage Parallelism
**Condition:** Stages are independent (no cross-dependency)
**Action:** Run independent jobs/stages in parallel
**Rationale:** Sequential execution of independent work wastes CI infrastructure capacity
**Consequences:** Violation doubles or triples pipeline duration unnecessarily

## PIPE-004: Artifact Retention for Rollback
**Condition:** Pipeline produces build artifacts
**Action:** Retain artifacts for minimum 30 days
**Rationale:** Rollback requires rebuild without artifact retention, which may fail if dependencies have changed
**Consequences:** Violation makes rollback unreliable after artifact expiration
