# Skill: Configure Simple and No Balancing Modes

## Purpose
Use Horizon's `simple` (round-robin) or `false` (fixed capacity) balancing modes when auto-balancing is not appropriate for the workload.

## When To Use
`simple`: equal-priority queues, symmetric workloads, fairness-focused allocation. `false`: SLA-bound queues needing guaranteed capacity, predictable minimum throughput.

## When NOT To Use
Variable-load queues needing priority-aware allocation (use `auto` with `time`); queues with very different job durations; dynamic scaling requirements.

## Prerequisites
- Supervisor configured in `config/horizon.php`
- Understanding of workload characteristics

## Inputs
- Number of queues per supervisor
- Required minimum worker count per queue
- Desired balancing behavior

## Workflow
1. For `simple`: set `balance: 'simple'`, `minProcesses`, `maxProcesses`
2. For `false`: set `balance: false`, `processes` (required — no minProcesses/maxProcesses)
3. Avoid `simple` when job durations vary significantly between queues
4. Set `minProcesses = maxProcesses` with `simple` to simulate `false` with even distribution
5. Prefer `auto` with `time` for most general-purpose workloads
6. Use `false` for SLA-critical queues with over-provisioned `processes`

## Validation Checklist
- [ ] `balance: false` has explicit `processes` set
- [ ] `simple` not used for queues with very different job durations
- [ ] `simple` respects minProcesses/maxProcesses bounds
- [ ] `false` mode shows no scaling events under load
- [ ] SLA-critical queues use `false` or dedicated supervisor
- [ ] Most workloads default to `auto` with `time`

## Common Failures
- `simple` for unequal priority queues — all get equal resources regardless
- `false` without `processes` — Horizon configuration error
- Expecting load-based distribution from `simple` — round-robin ignores job duration
- `simple` with 10+ queues — worker allocation per queue becomes very small

## Decision Points
- Equal-priority queues: `simple` mode
- SLA-critical guaranteed capacity: `false` mode with `processes`
- Variable load with priority: `auto` with `time`

## Related Rules
- Rule 1: prefer-auto-balancing-for-most
- Rule 2: use-false-for-sla-critical-queues
- Rule 3: avoid-simple-for-unequal-durations
- Rule 4: require-processes-with-false

## Related Skills
- Configure Horizon Supervisors for Queue Workers
- Tune Auto Balancing with `time` Strategy
- Deploy Multi-Server Horizon

## Success Criteria
Balancing mode matches workload characteristics, `false` mode has explicit `processes`, `simple` is not used for unequal-duration queues, and `auto` is preferred for general workloads.
