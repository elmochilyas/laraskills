# Skill: Detect and Resolve a Distributed Monolith

## Purpose

Identify tightly coupled services that masquerade as microservices and decouple them to restore independent deployability.

## When To Use

- Services require coordinated deployments
- Shared database across multiple services
- Synchronous call chains between services for every operation
- Services cannot be tested independently

## When NOT To Use

- Single-deployment monoliths that are not distributed
- Genuinely independent microservices with clear boundaries
- When decoupling would add more complexity than value

## Prerequisites

- Understanding of bounded contexts and data ownership
- Event-driven architecture patterns
- Saga pattern knowledge

## Inputs

- Service dependency graph
- Database schema showing shared tables
- Deployment coordination history

## Workflow

1. Identify shared databases: which services access the same tables?
2. Map synchronous call chains between services
3. Detect coordinated deployment requirements
4. Assign data ownership: each service gets exclusive write access to its tables
5. Replace synchronous calls with async events for eventually consistent data
6. Implement saga patterns instead of distributed transactions
7. Ensure each service can deploy independently
8. Verify service boundaries follow bounded contexts, not technical layers

## Validation Checklist

- [ ] Each service owns its database schema exclusively
- [ ] Zero synchronous calls across service boundaries for eventually consistent data
- [ ] Sagas replace distributed transactions (no 2PC)
- [ ] Services can deploy independently without coordination
- [ ] Service boundaries follow bounded contexts
- [ ] No shared database tables between services
- [ ] Deployment of one service never requires simultaneous deployment of another

## Common Failures

- Assuming deploying separately equals decoupled (shared DB still couples)
- Adding event bus without service autonomy (events don't fix wrong boundaries)
- "Microservices" without DevOps maturity
- Not monitoring cross-service calls (coupling undetected until too late)
- Rewriting monolith as microservices (produces distributed monolith)

## Decision Points

- Is this data truly shared or can it be duplicated per service?
- Synchronous vs async tradeoff for each cross-service interaction?
- Merge services back into monolith if decoupling is impractical?

## Performance Considerations

- Event-driven decoupling adds latency vs synchronous calls
- Eventual consistency adds complexity for users
- Sagas increase operational complexity vs local transactions

## Security Considerations

- Cross-service events may leak sensitive data; audit event payloads
- Service-to-service authentication must be enforced for all calls
- Shared database bypasses service-level access controls

## Related Rules (from 05-rules.md)

- Rule 1: Services must not share a single database
- Rule 2: No synchronous calls across service boundaries for eventually consistent data
- Rule 3: Orchestrate sagas, not distributed transactions
- Rule 4: Each service must be independently deployable
- Rule 5: Service boundaries must follow bounded contexts

## Related Skills

- Decompose by Business Capability
- Implement Event Sourcing
- Implement Outbox Pattern

## Success Criteria

- Each service deploys independently without coordination
- No service depends on another service's database schema
- Cross-service communication uses async events by default
