# Skill: Apply Chaos Engineering Concepts to Laravel

## Purpose
Apply chaos engineering principles — injecting failures, measuring system behavior under stress, and building confidence in system resilience — to Laravel applications by deliberately introducing controlled disruptions.

## When To Use
- When you need to verify system resilience before it's tested by real failures
- After implementing resilience patterns (circuit breakers, retries, fallbacks)
- Before major releases or infrastructure changes
- When establishing SLAs/SLOs that require demonstrated reliability
- When the team wants to build confidence in production resilience

## When NOT To Use
- In production without proper safeguards and rollback plans
- Without established monitoring and alerting (you can't measure what you can't observe)
- When the system is already unstable or degraded
- Without team buy-in and understanding of the methodology
- As a one-time activity — chaos engineering is a continuous practice

## Prerequisites
- Established monitoring, logging, and alerting for the application
- Understanding of steady-state metrics (baseline behavior)
- Defined resilience hypotheses (what should happen when a service fails)
- Rollback and recovery procedures documented
- Team agreement on blast radius and experiment scope

## Inputs
- Steady-state metrics (baseline response times, error rates, throughput)
- Resilience hypotheses to test
- Fault scenarios to inject (service failure, latency, resource exhaustion)
- Blast radius boundaries (experiment scope and limits)
- Rollback triggers and procedures

## Workflow
1. Define the steady state — what normal behavior looks like (response times, error rates)
2. Formulate a hypothesis — "When the payment API fails, the checkout page shows a friendly message and logs the error"
3. Design the experiment — which fault to inject, in which environment, for how long
4. Start with a small blast radius — staging environment, non-critical service
5. Inject the fault (latency, service failure, resource constraint)
6. Measure the impact against the hypothesis
7. If the hypothesis holds: expand the experiment scope
8. If the hypothesis fails: fix the resilience gap, re-test
9. Document findings and add automated tests for the resilience behavior
10. Repeat with increasing complexity and scope

## Validation Checklist
- [ ] Steady-state metrics are documented before the experiment
- [ ] Hypothesis is clearly stated (if X fails, Y should happen)
- [ ] Blast radius is defined and bounded
- [ ] Rollback triggers are identified and monitored
- [ ] Experiment duration is limited
- [ ] Monitoring is verified to detect the injected fault
- [ ] Results are documented with findings and action items
- [ ] Automated resilience tests are added for verified behaviors

## Common Failures
- Starting with too large a blast radius — impacts real users
- No monitoring baseline — can't measure impact
- Not defining a clear hypothesis — don't know what "passed" means
- Skipping staging experiments — going straight to production
- Not automating findings — resilience gaps are fixed but not tested continuously
- Fear of experiments — team doesn't run them, system is never validated

## Decision Points
- Staging vs production experiments — staging for initial validation, production for true confidence
- Fault injection tools — Laravel-specific (custom middleware) vs infrastructure-level (network, resources)
- Blast radius: single user vs percentage of traffic — start with single user or synthetic traffic

## Performance Considerations
- Chaos experiments add overhead to monitoring and logging systems
- Fault injection may cause temporary performance degradation
- Rollback procedures should be fast (<1 minute)
- Monitor experiment duration — longer experiments increase risk
- Resource exhaustion experiments (CPU, memory) may affect other services

## Security Considerations
- Chaos experiments can trigger security alerts — coordinate with security team
- Fault injection should not bypass authentication or authorization
- Document experiments for audit trails
- Experiments involving data services must ensure data integrity
- Rollback procedures must restore security controls

## Related Rules
- [Rule: Start with Staging, Progress to Production](./05-rules.md)
- [Rule: Define Clear Hypotheses Before Experiments](./05-rules.md)
- [Rule: Document and Automate Findings](./05-rules.md)

## Related Skills
- Chaos Experiment Design for Laravel
- Fault Injection Testing
- Circuit Breaker Patterns

## Success Criteria
- [ ] Steady-state metrics are documented for critical services
- [ ] At least one chaos experiment has been conducted and documented
- [ ] Resilience gaps identified in experiments have been addressed
- [ ] Automated tests verify resilience behaviors
- [ ] Team has a regular chaos engineering cadence
