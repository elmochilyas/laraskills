# Skill: Implement Read Model Strategies

## Purpose

Design and build query-optimized read models that serve specific query patterns independently from write models.

## When To Use

- Queries that span multiple aggregates
- Complex aggregations or reporting queries
- High read traffic demanding optimized data structures
- Different query patterns requiring different storage technologies

## When NOT To Use

- Simple queries on a single aggregate (repository method suffices)
- When in-memory transformation meets performance requirements
- When eventual consistency is unacceptable for the use case

## Prerequisites

- CQRS understanding (Level 2+)
- Event publishing infrastructure
- Knowledge of storage technologies (SQL, Elasticsearch, Redis)

## Inputs

- Query patterns (full-text search, aggregation, graph traversal)
- Data staleness tolerance per read model
- Write model domain events

## Workflow

1. Identify query patterns that would benefit from optimized read models
2. Choose read model storage based on query pattern (SQL for relational, ES for search, Redis for real-time)
3. Build projectors that listen to domain events and update read models
4. Denormalize aggressively: pre-join, pre-compute, flatten into query-ready shapes
5. Implement projectors as idempotent (updateOrCreate, not always create)
6. Communicate staleness window to users ("updated 5 seconds ago")
7. Replay events to rebuild read models when schema changes
8. Monitor projection lag and alert on excessive delay

## Validation Checklist

- [ ] Read models built from domain events, not dual writes
- [ ] Read models are denormalized for query performance
- [ ] Storage chosen per query pattern, not defaulting to write model technology
- [ ] Staleness communicated to users when eventual consistency applies
- [ ] Projectors are idempotent (safe to replay events)
- [ ] Projection lag monitored and alerted
- [ ] Read model can be rebuilt from event history

## Common Failures

- Denormalizing when in-memory transformation suffices
- Event-sourced projections for simple dashboards (overengineering)
- No read model at all (write-optimized schema for complex reads)
- Stale read model without refresh mechanism
- Cached read model without invalidation

## Decision Points

- In-memory transformation vs denormalized table vs materialized view?
- Which storage technology for each query pattern?
- Acceptable staleness window for each read model?

## Performance Considerations

- Denormalized read models trade write complexity for read speed
- Projection lag depends on event volume and projector throughput
- Multiple read model stores increase operational complexity
- Read model rebuild time must fit within maintenance windows

## Security Considerations

- Read models may replicate sensitive data — ensure access controls match
- Projectors should filter sensitive fields from read models
- Different storage technologies may have different security capabilities

## Related Rules (from 05-rules.md)

- Rule 1: Build read models via projectors listening to domain events, never via dual writes
- Rule 2: Denormalize aggressively — read models should be query-optimized
- Rule 3: Choose read-model storage based on query patterns
- Rule 4: Keep read models eventually consistent and communicate staleness
- Rule 5: Implement idempotent projectors that can replay events without duplicating data

## Related Skills

- Implement Event Sourcing Components
- Apply CQRS Selectively per Bounded Context
- Implement Outbox Pattern

## Success Criteria

- Read queries execute 10x+ faster than equivalent write-model queries
- Projection lag remains under acceptable threshold (e.g., < 5 seconds)
- Read models can be rebuilt from event history without data loss
