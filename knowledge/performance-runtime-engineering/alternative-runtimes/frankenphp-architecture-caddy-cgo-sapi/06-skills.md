# Skill: Understand FrankenPHP's Caddy/CGO/SAPI Architecture

## Purpose

Comprehend how FrankenPHP embeds PHP into Caddy via CGO and how the SAPI integration works, informing configuration and troubleshooting decisions.

## When To Use

- Evaluating FrankenPHP as a deployment option
- Debugging FrankenPHP-specific issues (CGO boundary, thread safety)
- Understanding the performance implications of the CGO bridge
- Configuring FrankenPHP for production

## When NOT To Use

- Without first understanding alternative runtimes landscape
- When the team has no C/C++ or Go experience (CGO concepts may be unfamiliar)
- For basic FrankenPHP usage (refer to the installation skill)

## Prerequisites

- Understanding of CGO (Go calling C code)
- Knowledge of PHP SAPI concepts
- Familiarity with Caddy web server basics

## Inputs

- FrankenPHP version and build configuration
- Thread safety requirements (ZTS vs NTS)
- Deployment environment (container, bare metal)

## Workflow (numbered steps)

1. Understand the architecture: Caddy (HTTP server) -> CGO bridge -> embedded PHP (via SAPI) -> worker threads
2. The CGO boundary: Go code calls PHP's C API through cgo — this is the main performance overhead (5-10%)
3. Thread safety (ZTS): FrankenPHP requires ZTS (Zend Thread Safety) build of PHP because it embeds PHP in a multi-threaded Go context
4. The SAPI layer: FrankenPHP implements a custom SAPI that allows Caddy to communicate with the embedded PHP engine
5. Worker threads: each HTTP request is handled by a PHP worker thread — similar to FPM workers but as threads in the same process
6. Memory management: PHP threads share the same memory space (unlike FPM processes) — memory isolation is by convention, not enforcement
7. For debugging: check FrankenPHP logs (stderr) for CGO-related errors or SAPI initialization issues
8. Document the FrankenPHP architecture for the team's operational reference

## Validation Checklist

- [ ] Caddy/CGO/SAPI architecture understood
- [ ] CGO boundary overhead identified (5-10%)
- [ ] ZTS PHP requirement understood
- [ ] Thread-based worker model understood
- [ ] Memory isolation model understood
- [ ] Architecture documented for team

## Common Failures

- **Expecting process-level isolation**: FrankenPHP threads share memory — unlike FPM processes, a memory corruption can affect other threads
- **Ignoring CGO overhead**: The CGO boundary adds 5-10% latency per PHP call — benchmark to verify acceptability
- **Using NTS PHP build**: FrankenPHP requires ZTS — using non-thread-safe PHP causes crashes
- **Not accounting for shared memory**: Threads share the PHP heap — memory fragmentation in one thread affects all threads

## Decision Points

- CGO overhead acceptable: if 5-10% overhead is acceptable for the operational simplicity gain
- ZTS PHP available: ensure the PHP binary is compiled with ZTS (--enable-zts)
- Thread safety of extensions: all PHP extensions must be thread-safe (ZTS-compatible)
- Memory isolation not critical: if the application does not require process-level memory isolation

## Performance Considerations

- CGO boundary: 5-10% overhead vs pure Go or pure PHP runtimes
- Thread-based worker: faster than process-based (FPM) for context switching
- Shared memory: eliminates OpCache duplication across workers (all threads share the same OpCache)
- ZTS overhead: ~5-10% performance penalty vs NTS, required for thread safety
- Single binary: eliminates separate PHP-FPM process — reduces memory by 50-100MB

## Security Considerations

- Threads share memory — a vulnerability in one thread can be exploited to read/write from other threads
- ZTS provides internal thread safety but does not isolate threads from each other
- CGO bridge is a potential attack surface — keep FrankenPHP updated
- Run FrankenPHP as a non-root user (Caddy drops privileges by default)

## Related Rules (from 05-rules.md)

- Use ZTS PHP Build for FrankenPHP
- Never Expect Process-Level Isolation in FrankenPHP
- Account for CGO Overhead in Performance Budget

## Related Skills

- FrankenPHP Installation and Caddyfile Configuration
- FrankenPHP Worker Thread Management
- FrankenPHP vs RoadRunner Comparison
- Runtime Selection Decision Tree

## Success Criteria

- FrankenPHP architecture (Caddy/CGO/SAPI/threads) understood
- ZTS PHP build verified
- CGO overhead accounted for in performance expectations
- Thread safety of extensions verified
- Architecture documented for team reference
