# Skill: Apply Strangler Fig Pattern for Incremental Decomposition

## Purpose

Incrementally replace legacy functionality with new services by routing specific features to new implementations, strangling the legacy system piece by piece.

## When To Use

- Migrating from legacy monolith to new architecture
- Extracting modules from a monolithic Laravel application to services
- Replacing legacy PHP systems incrementally

## When NOT To Use

- Greenfield projects (no legacy to replace)
- When features are too tightly coupled to extract individually

## Prerequisites

- Bounded context identification
- Service decomposition strategies

## Workflow

1. Identify features to extract in priority order (high-value, loosely coupled first)
2. Create a feature flag or routing layer to direct traffic to new or legacy implementation
3. Build the new service with a matching interface contract
4. Route specific features to the new service via the interception layer
5. Verify parity (functional equivalence, performance comparison)
6. Remove legacy code once all features are migrated
7. Repeat for next feature, strangling the monolith incrementally

## Related Skills

- Assess Microservices Decomposition Threshold
- Design Service Boundaries in Distributed Systems
- Apply Feature Flag Pattern
