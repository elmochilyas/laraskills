# Skill: Implement Message Bus and Pub/Sub for Cross-Context Events

## Purpose
Use Laravel event system for in-process (same-server) events. Use a dedicated message bus (RabbitMQ, Kafka, Redis Streams) for cross-process events. Register subscriptions explicitly in service providers. Use separate topics per domain. Configure dead letter queues for all topics. Restrict bus access per context.

## When To Use
- Cross-context event distribution
- Decoupling producers from consumers
- Multiple consumers need the same event

## When NOT To Use
- Single-context internal events (use Laravel's built-in event system)
- Simple one-to-one communication (direct contract is simpler)

## Prerequisites
- Event design understanding (CPC-04)
- Sync vs queued events (CPC-03)

## Inputs
- Event catalog and subscriber map
- Infrastructure budget for message broker

## Workflow
1. **Use Laravel events for in-process, dedicated bus for cross-process.** Laravel's event system is optimized for same-process communication. A dedicated bus provides persistence, delivery guarantees, and routing for cross-process.

2. **Register subscriptions explicitly in service providers.** Never use auto-discovery or convention-based scanning for cross-context events. Explicit registration makes dependencies visible.

3. **Avoid a single shared bus for all contexts.** Use separate buses or topics per domain or bounded context. Topic-per-domain isolates failures and makes topology understandable.

4. **Use pub/sub for domain events, point-to-point for commands.** Domain events go to all interested subscribers. Commands go to exactly one handler. Mixing semantics causes unintended side effects.

5. **Configure dead letter queues for all message buses.** Never let message processing failures result in silent message loss. DLQ preserves failed messages for inspection and replay.

6. **Restrict bus access by context.** Limit publish/subscribe permissions to only the contexts that require them. Prevents contexts from publishing counterfeit events or consuming sensitive data.

## Validation Checklist
- [ ] In-process events use Laravel's event system
- [ ] Cross-process events use a dedicated message bus
- [ ] Bus has dead letter queue configured
- [ ] Subscriptions registered explicitly in service providers
- [ ] No monolithic "god bus" shared by all contexts
- [ ] Pub/sub for domain events, point-to-point for commands
- [ ] Bus access permissions limited per context

## Common Failures
- **Bus as monolithic pipeline.** One bus shared by all contexts — becomes bottleneck and coupling point.
- **No dead letter handling.** Failed messages are lost — silent failures.
- **Over-routing.** Publishing to too many topics — topology becomes hard to understand.

## Decision Points
- **In-process vs cross-process bus?** Same server: Laravel events. Separate servers: RabbitMQ, Kafka, or Redis Streams.

## Performance Considerations
- In-process bus: microseconds.
- Dedicated message bus: adds network latency (milliseconds).
- Pub/sub: event ordering harder with many consumers.

## Security Considerations
- Bus access restricted. Only authorized contexts should publish/subscribe.
- Sensitive event data requiring authorization controls.

## Related Rules
- Rule: Use Laravel events for in-process, dedicated bus for cross-process (CPC-05/05-rules.md)
- Rule: Register subscriptions explicitly in service providers (CPC-05/05-rules.md)
- Rule: Avoid a single shared bus for all contexts (CPC-05/05-rules.md)
- Rule: Use pub/sub for domain events, point-to-point for commands (CPC-05/05-rules.md)
- Rule: Configure dead letter queues for all message buses (CPC-05/05-rules.md)
- Rule: Restrict bus access by context (CPC-05/05-rules.md)

## Related Skills
- Design Event Payloads (CPC-04/06-skills.md)
- Choose Sync vs Queued Events (CPC-03/06-skills.md)
- Implement Circuit Breaker (CPC-06/06-skills.md)
- Implement Bridge/Adapter Pattern (CPC-07/06-skills.md)
- Implement Outbox Pattern (CPC-10/06-skills.md)

## Success Criteria
- In-process events use Laravel's event system; cross-process events use a dedicated message bus.
- All event subscriptions are explicitly registered in service providers.
- Per-domain topics separate events — no single shared bus.
- Domain events use pub/sub; commands use point-to-point routing.
- All bus topics have dead letter queues configured.
- Bus publish/subscribe permissions are scoped per context.
