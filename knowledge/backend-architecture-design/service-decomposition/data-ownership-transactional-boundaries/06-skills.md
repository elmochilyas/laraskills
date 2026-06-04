# Skill: Design Data Ownership and Transactional Boundaries

## Purpose

Assign exclusive data ownership to each service and define transactional scope within single-service boundaries using eventual consistency across services.

## When To Use

- Designing microservices or distributed systems
- Defining database-per-service boundaries
- Choosing between strong consistency and eventual consistency

## When NOT To Use

- Single-deployment monolith with shared database
- When transactional consistency across services is required without saga patterns

## Prerequisites

- Transaction management
- Service ownership concepts

## Workflow

1. Identify data entities and their owning service/aggregate
2. Ensure no two services write to the same database table
3. Define transactional boundaries that stay within a single service
4. Use outbox pattern + event-driven communication for cross-service operations
5. Implement compensating actions (saga pattern) for multi-service failure scenarios

## Related Skills

- Implement Outbox Pattern
- Distinguish Choreography vs Orchestration
- Decompose by Business Capability
