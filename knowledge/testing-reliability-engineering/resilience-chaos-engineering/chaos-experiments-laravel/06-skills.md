# Skill: Design and Run Chaos Experiments for Laravel

## Purpose
Design structured chaos experiments that inject controlled failures into Laravel applications — service latency, exceptions, resource exhaustion — to verify resilience patterns under realistic failure conditions.

## When To Use
- After implementing circuit breakers, retries, or fallbacks
- Before major releases to verify production resilience
- When validating that monitoring and alerting detect failures correctly
- When testing degradation behavior (graceful degradation, partial availability)
- When building confidence in system reliability for SLAs

## When NOT To Use
- Without established monitoring and incident response procedures
- When the blast radius cannot be controlled or limited
- Without a clear hypothesis about expected system behavior
- When the application has known, unresolved stability issues
- Without team training on chaos engineering practices

## Prerequisites
- Laravel application with monitoring (logs, metrics, traces)
- Experiment design template
- Defined steady-state metrics
- Rollback procedures documented
- Team approval and coordination

## Inputs
- Specific fault scenario to inject (payment API timeout, database latency, Redis failure)
- Laravel service or infrastructure component to target
- Experiment duration and blast radius limits
- Monitoring tools to observe system behavior during experiment
- Rollback trigger conditions

## Workflow
1. Select a specific Laravel component for the experiment (e.g., Redis cache, payment gateway, queue worker)
2. Design the experiment: what fault, for how long, at what intensity
3. Define success criteria — what should happen and what should NOT happen
4. For Laravel-specific faults: use middleware to inject latency, override service bindings to throw exceptions
5. For infrastructure faults: use system tools (tc for network latency, kill for process failure)
6. Start the experiment with a limited scope (single endpoint, single user)
7. Monitor metrics and compare against steady-state baseline
8. If the system behaves as expected (resilience holds), expand scope
9. If the system fails in unexpected ways, stop and document the gap
10. Add automated unit/feature tests for the resilience behavior
11. Schedule the next experiment with increased scope

## Validation Checklist
- [ ] Experiment is designed with a specific fault and scope
- [ ] Success criteria are defined (what should happen)
- [ ] Failure criteria are defined (what should NOT happen)
- [ ] Laravel-specific injection method is identified (middleware, service override, queue)
- [ ] Monitoring is confirmed to detect the injected fault
- [ ] Rollback procedure is ready
- [ ] Experiment duration is defined and enforced
- [ ] Results are documented with lessons learned
- [ ] Automated tests are added for validated resilience behaviors

## Common Failures
- Experiment too complex — multiple faults at once, can't isolate cause
- No rollback triggered — experiment runs too long, impacts users
- Hypothesis too vague — "system should be resilient" isn't testable
- Not coordinating with the team — incident response team is surprised
- Fault injection in the wrong layer — testing the wrong resilience pattern
- Not adding automated tests after experiments — resilience gaps reappear

## Decision Points
- Middleware-based vs service-level injection — middleware for HTTP latency, service-level for business logic failures
- Short duration vs long duration — short for burst resilience, long for soak/leak testing
- Single component vs multi-component — single for isolation, multi for complex failure scenarios

## Performance Considerations
- Fault injection may cause temporary performance degradation
- Monitor system resources during experiments (CPU, memory, connections)
- Queue backlogs may accumulate during experiment — plan for catch-up
- Database connection pool exhaustion from injected latency
- Log and metric volume may increase significantly during experiments

## Security Considerations
- Experiments that inject authentication/authorization failures may affect access control
- Ensure rollback procedures restore normal service immediately
- Document experiments for security and compliance audits
- Never inject faults that could cause data loss or corruption
- Coordinate with security team on experiment schedule

## Related Rules
- [Rule: Start with Small Scope Experiments](./05-rules.md)
- [Rule: Define Testable Success and Failure Criteria](./05-rules.md)
- [Rule: Automate Resilience Tests from Experiments](./05-rules.md)

## Related Skills
- Chaos Engineering Concepts
- Fault Injection Testing
- Circuit Breaker Patterns

## Success Criteria
- [ ] At least one chaos experiment has been designed and executed
- [ ] Experiment results are documented with clear findings
- [ ] Resilience gaps found in experiments are tracked and fixed
- [ ] Automated tests verify the resilience behaviors validated in experiments
- [ ] Team has a repeatable experiment process
