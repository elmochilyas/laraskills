# Skill: Assess and Progress Through CQRS Maturity Levels

## Purpose

Determine the appropriate CQRS maturity level for a system and progress incrementally as complexity demands.

## When To Use

- Evaluating whether to adopt CQRS
- Auditing current CQRS implementation for over-engineering
- Planning incremental migration from Level 0 to higher levels
- Comparing CQRS depth across bounded contexts

## When NOT To Use

- When no read/write asymmetry exists (simple CRUD is fine)
- When team has no experience with eventual consistency
- When current level is adequate and no bottleneck exists

## Prerequisites

- CQRS basics understanding
- Knowledge of read/write symmetry in the domain
- Performance metrics for current query/write paths

## Inputs

- Current maturity level (0=monolithic, 1=CQS, 2=read models, 3=separate DBs, 4=event-sourced)
- Query performance metrics (p50/p95/p99 latency)
- Read/write traffic ratios per use case

## Workflow

1. Assess current maturity level and identify bottleneck use cases
2. Start at Level 1 (CQS): same model, separate methods for commands vs queries
3. Enforce CQS at controller level (POST/PUT/DELETE for commands, GET for queries)
4. Progress to Level 2 when queries span aggregates or need complex reshaping
5. Introduce separate read models with projectors listening to domain events
6. Move to Level 3 only when scalability data shows read/write contention
7. Evaluate Level 4 (event sourcing) only if temporal queries or audit trail is required
8. Move one level at a time, validating each level before progressing

## Validation Checklist

- [ ] Current level justified by actual needs, not theoretical future
- [ ] CQS enforced at controller level (no side effects in GET)
- [ ] Read models introduced only when queries span aggregates
- [ ] Separate databases only when performance data justifies it
- [ ] Event sourcing only when temporal queries or audit is required
- [ ] Levels applied consistently within each bounded context
- [ ] No level skipped without documented justification

## Common Failures

- Jumping to Level 3 or 4 without needing temporal queries or audit
- Level 1 without clear read/write model distinction
- Level 2 without eventual consistency awareness
- Overengineering: full event sourcing for CRUD application
- One-size-fits-all CQRS level across all bounded contexts

## Decision Points

- Does this use case need Level 2 (read models) or is Level 1 sufficient?
- Is query performance degraded enough to warrant separate databases?
- Does temporal query or audit requirements justify event sourcing?

## Performance Considerations

- Level 1: minimal overhead (just method separation)
- Level 2: projection latency (eventual consistency) vs query performance
- Level 3: operational overhead of multiple databases
- Level 4: event store storage costs and projection rebuild time

## Security Considerations

- Separate read models may bypass write-model security if not synchronized
- Event-sourced systems store all historical data — ensure sensitive data is encrypted
- Read databases may have different access controls than write databases

## Related Rules (from 05-rules.md)

- Rule 1: Start at Level 1 (same model, separate command/query methods) before progressing
- Rule 2: Enforce command and query segregation at the API/controller level even at Level 1
- Rule 3: Introduce separate read models (Level 2) when queries require reshaping or aggregating data
- Rule 4: Move to separate databases (Level 3) only when justified by scalability data
- Rule 5: Progress through maturity levels incrementally, not in one change

## Related Skills

- Apply CQRS Selectively per Bounded Context
- Implement Read Model Strategies
- Assess CQRS Overengineering Risk

## Success Criteria

- Each bounded context uses the minimum CQRS level that meets its needs
- No level progression without performance data justification
- Team can articulate the costs and benefits of the current level
