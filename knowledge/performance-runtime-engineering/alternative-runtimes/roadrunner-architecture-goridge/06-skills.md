# Skill: Understand RoadRunner's Go/Goridge Architecture

## Purpose

Comprehend how RoadRunner uses Go's goroutine scheduler and the Goridge binary protocol to communicate with PHP workers, enabling efficient request handling.

## When To Use

- Evaluating RoadRunner for a project
- Debugging RoadRunner communication issues
- Understanding performance characteristics
- Configuring RoadRunner for production

## When NOT To Use

- Without understanding the basics of Go's concurrency model
- When PHP-FPM or another runtime is already selected
- For basic RoadRunner usage (refer to the installation skill)

## Prerequisites

- Understanding of process and thread concurrency
- Familiarity with Go's goroutine model (M:N scheduling)
- Knowledge of binary protocols (protobuf, message packing)

## Inputs

- RoadRunner version and configuration
- PHP worker configuration
- Application I/O profile

## Workflow (numbered steps)

1. Understand the architecture: Go process manages goroutines -> Goridge binary protocol -> PHP worker processes
2. Go's goroutine scheduler: M:N threading — M goroutines multiplexed onto N OS threads — efficient for I/O-bound workloads
3. Goridge protocol: binary communication between Go and PHP over Unix sockets or TCP — serializes requests/responses
4. PHP workers: separate processes spawned by RoadRunner — each worker handles one request at a time (traditional PHP)
5. Worker lifecycle: RoadRunner spawns PHP workers at startup, assigns requests via Goridge, workers process and respond
6. Worker isolation: each PHP worker is an independent process — crash in one does not affect others
7. Goridge payload: includes HTTP request data, server variables, and response handling
8. For debugging: check RoadRunner logs for Goridge errors, worker restarts, or communication failures
9. Document the RoadRunner architecture for team reference

## Validation Checklist

- [ ] Go goroutine scheduler understood (M:N threading)
- [ ] Goridge binary protocol understood
- [ ] PHP worker process model understood
- [ ] Worker isolation benefits identified
- [ ] Goridge communication verified (logs, status)
- [ ] Architecture documented for team

## Common Failures

- **Confusing RoadRunner with PHP-FPM**: RoadRunner reuses workers; FPM creates new processes — the worker model is different
- **Not understanding Goridge overhead**: Binary serialization adds ~1-5µs per request — negligible for most workloads
- **Assuming Goridge adds latency**: Goridge is fast (~1-5µs per message) — bottlenecks are in PHP execution and I/O
- **Missing worker restart detection**: RoadRunner restarts workers after crashes — monitor restart count for early warning

## Decision Points

- I/O-bound workload: RoadRunner's goroutine scheduler excels
- CPU-bound workload: still efficient — goroutine overhead is minimal
- Need process isolation: RoadRunner provides it (separate PHP workers)
- No Go experience required: RoadRunner is configured via .rr.yaml, not Go code
- Debugging communication: check Goridge protocol errors in RoadRunner logs

## Performance Considerations

- Goroutine scheduler: handles thousands of goroutines efficiently
- Goridge overhead: ~1-5µs per message (negligible vs PHP execution time)
- PHP worker memory: 30-200MB per worker — separate from Go process
- Go process memory: ~20-50MB (very lightweight)
- Worker reuse: no per-request bootstrap cost after first request on each worker

## Security Considerations

- PHP workers are separate processes — provides process-level isolation
- Goridge communication over Unix socket: secure (local only)
- TCP mode: should be restricted to localhost with firewall rules
- RoadRunner runs PHP workers as the configured user — limit permissions
- Worker crashes are contained — do not affect other workers or the Go process

## Related Rules (from 05-rules.md)

- Start with RoadRunner for Laravel Octane
- Run 24-Hour Soak Tests Before Production
- Never Migrate Without a Documented Rollback Plan

## Related Skills

- RoadRunner Installation and Configuration
- RoadRunner Benchmark Performance
- Architecture Model Differences
- Octane Architecture and Execution Model

## Success Criteria

- RoadRunner architecture (Go + Goridge + PHP workers) understood
- Goridge protocol and its role in Go-PHP communication understood
- Worker isolation model understood
- Architecture documented for team reference
