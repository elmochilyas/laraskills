# Skill: Choose Between Choreography and Orchestration for Event Flows

## Purpose

Select the appropriate coordination pattern for multi-step event-driven processes based on complexity and team needs.

## When To Use

- Designing saga coordination for distributed transactions
- Multi-step business processes spanning multiple services
- Event-driven workflows with failure handling
- When deciding between saga patterns

## When NOT To Use

- Single-step processes (no coordination needed)
- Local transactions within one service

## Prerequisites

- Event-driven architecture understanding
- Saga pattern knowledge
- Understanding of compensating transactions

## Inputs

- Business process steps and ordering
- Failure recovery requirements
- Team maturity with event-driven patterns

## Workflow

1. Map all steps in the business process
2. Identify compensating actions for each step
3. Assess team experience with event-driven patterns
4. Choose choreography for simple, linear processes with few steps
5. Choose orchestration for complex processes with branching/loops
6. For orchestration, implement a dedicated orchestrator service
7. Keep orchestrator stateless and idempotent
8. Document the chosen pattern and rationale in an ADR

## Validation Checklist

- [ ] All process steps identified with compensating actions
- [ ] Choreography chosen for simple, linear processes
- [ ] Orchestration chosen for complex/branching processes
- [ ] Orchestrator is stateless and idempotent
- [ ] Failure recovery path defined for each step
- [ ] Chosen pattern documented in an ADR

## Common Failures

- Choreography for complex processes (lost traceability)
- Orchestrator becoming a god service (single point of failure)
- No compensating actions for failure steps
- Hardcoded process flows in orchestrator (inflexible)

## Decision Points

- Choreography vs Orchestration for this specific process?
- Where to host the orchestrator?
- Event-sourced or fresh-read orchestrator state?

## Performance Considerations

- Choreography: lower latency (no central coordinator)
- Orchestration: higher latency but better observability
- Compensating transactions add processing time

## Security Considerations

- Orchestrator needs access to all participating services
- Events in choreography may expose sensitive data to all consumers
- Ensure compensating actions respect authorization boundaries

## Related Rules (from 05-rules.md)

- Rule 3 (Distributed Monolith): Orchestrate sagas, not distributed transactions — no 2PC

## Related Skills

- Implement Event Bus Patterns
- Implement Dead Letter Handling
- Design Event Sourcing Components

## Success Criteria

- Process coordination is reliable and observable
- Failed steps trigger appropriate compensating actions
- Pattern choice matches process complexity
