# Skill: Tune Auto Balancing with `time` Strategy

## Purpose
Configure Horizon's `auto` balancing with `time` strategy to dynamically allocate workers to queues based on estimated wait time, preventing starvation and optimizing throughput.

## When To Use
Variable-load queues with fluctuating job volume; queues with different job durations and priority levels; general-purpose workloads needing load-aware allocation.

## When NOT To Use
Fixed-capacity workloads needing guaranteed throughput (use `simple` or `false`); single queue per supervisor (no balancing needed); when process churn is unacceptable.

## Prerequisites
- Supervisor configured with `balance: 'auto'`
- Multiple queues assigned to the same supervisor

## Inputs
- Queue names under the supervisor
- minProcesses/maxProcesses bounds
- balanceMaxShift and balanceCooldown values

## Workflow
1. Set `balance: 'auto'` and `autoScalingStrategy: 'time'` on the supervisor
2. Always set `maxProcesses` — prevents unbounded scaling
3. Set `balanceMaxShift: 1-2` — caps per-cycle process changes
4. Set `balanceCooldown: 3-5` seconds — prevents oscillation
5. Never use `size` strategy — `time` accounts for job duration
6. Monitor for sawtooth process count patterns (oscillation)
7. Account for cold start — metrics reset after Horizon restart

## Validation Checklist
- [ ] `balance: 'auto'` and `autoScalingStrategy: 'time'` set
- [ ] `maxProcesses` set (no unbounded scaling)
- [ ] `balanceMaxShift` set to 1-2
- [ ] `balanceCooldown` set to 3-5
- [ ] No `size` strategy used unless jobs have uniform duration
- [ ] Process count graph is smooth (no sawtooth oscillation)
- [ ] Cold start accounted for after restart

## Common Failures
- Using `size` instead of `time` — misallocates workers for variable-duration jobs
- `balanceCooldown` too low (1s) — Horizon spends more time scaling than processing
- `balanceMaxShift` = `maxProcesses` — no damping, single cycle adds all workers
- No `maxProcesses` — balancer adds workers until server exhausted
- Expecting cross-supervisor balancing — each supervisor balances independently

## Decision Points
- Bursty workloads: `balanceMaxShift: 2`, `balanceCooldown: 3`
- Steady workloads: `balanceMaxShift: 1`, `balanceCooldown: 5`
- Oscillation detected: increase cooldown, decrease max shift

## Related Rules
- Rule 1: use-time-strategy-over-size
- Rule 2: cap-balance-max-shift
- Rule 3: set-balance-cooldown
- Rule 4: always-set-max-processes-bound

## Related Skills
- Configure Horizon Supervisors for Queue Workers
- Configure Simple and No Balancing Modes
- Monitor Horizon Wait Time and Set Alerts

## Success Criteria
Auto balancing uses `time` strategy, `maxProcesses` prevents runaway scaling, `balanceMaxShift` and `balanceCooldown` prevent oscillation, and process count graphs are stable.
