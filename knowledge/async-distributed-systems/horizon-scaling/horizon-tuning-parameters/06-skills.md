# Skill: Tune Horizon minProcesses, maxProcesses, balanceMaxShift, balanceCooldown

## Purpose
Set Horizon's four key tuning parameters to control balancing aggression, prevent oscillation, and match worker allocation to workload patterns.

## When To Use
Any supervisor using `balance: 'auto'` or `balance: 'simple'`. Required for production to prevent resource exhaustion and oscillation.

## When NOT To Use
`balance: false` mode (these parameters don't apply); single-queue supervisors (no inter-queue balancing needed); development environments.

## Prerequisites
- Supervisor with `balance: 'auto'` or `'simple'`
- Understanding of workload burstiness

## Inputs
- Available server RAM per worker (~20-40MB)
- CPU core count
- Queue burst characteristics

## Workflow
1. Set `minProcesses >= 1` for all queues — prevent complete starvation
2. Base `maxProcesses` on available RAM: `maxProcesses = available_RAM / 40MB`
3. Set `balanceMaxShift = 1-2` — prevents excessive churn
4. Set `balanceCooldown = 3-5` seconds — balances responsiveness and overhead
5. Set `minProcesses = maxProcesses` to disable balancing for predictable workloads
6. Monitor for sawtooth process count pattern (oscillation)
7. If oscillation detected: increase cooldown or decrease max shift

## Validation Checklist
- [ ] `minProcesses >= 1` for all queues
- [ ] `maxProcesses` within memory budget (RAM / 40MB)
- [ ] `balanceMaxShift` set to 1-2
- [ ] `balanceCooldown` set to 3-5
- [ ] No sawtooth oscillation in process count graph
- [ ] `minProcesses = maxProcesses` for static allocation
- [ ] Parameters tuned per workload (not copy-pasted)

## Common Failures
- `minProcesses = 0` — queue may get zero workers indefinitely
- `maxProcesses` too high — exceeds server RAM, OOM kills
- `balanceMaxShift = maxProcesses` — no damping, oscillation
- Not tuning per workload — same config for bursty and steady queues

## Decision Points
- Bursty webhooks: `balanceMaxShift: 2`, `balanceCooldown: 3`
- Steady emails: `balanceMaxShift: 1`, `balanceCooldown: 5`
- Static allocation: `minProcesses = maxProcesses`

## Related Rules
- Rule 1: set-min-processes-to-at-least-one
- Rule 2: base-max-processes-on-ram
- Rule 3: detect-oscillation-sawtooth
- Rule 4: set-min-equal-max-for-static

## Related Skills
- Tune Auto Balancing with `time` Strategy
- Configure Simple and No Balancing Modes
- Configure Horizon Supervisors for Queue Workers

## Success Criteria
All tuning parameters are set per workload, `minProcesses` prevents starvation, `maxProcesses` fits RAM budget, oscillation is absent from process count graphs, and static allocation is used where appropriate.
