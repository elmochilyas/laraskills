# Skill: Explain and Apply JIT Compilation Concepts to a PHP Application

## Purpose

Build foundational understanding of PHP's JIT (tracing vs function mode, guard elimination, hot paths, DynASM) and apply it to determine whether and how JIT benefits a specific application.

## When To Use

- Introducing JIT concepts to a team new to PHP 8.0+
- Documenting the JIT configuration rationale for a project
- Evaluating whether JIT should be enabled for a specific workload
- Understanding the prerequisites (OpCache) before JIT configuration

## When NOT To Use

- For deep JIT tuning (use JIT Configuration for Production skill instead)
- When the team already has strong JIT knowledge and just needs configuration values
- For applications on PHP <8.0 (JIT is not available)

## Prerequisites

- PHP 8.0+ runtime available
- OpCache enabled and optimally configured
- Profiling tool to measure CPU-bound proportion of request time

## Inputs

- PHP version (must be 8.0+)
- OpCache configuration and hit rate
- Profiling data showing PHP execution vs I/O wait time
- Application workload description (web, API, queue worker, batch job)

## Workflow (numbered steps)

1. Verify PHP version is 8.0+ and JIT is available: `php -i | grep jit`
2. Determine the workload's CPU-bound proportion from profiling data
3. If CPU-bound proportion >30%, JIT will likely provide significant benefit (5-95% depending on type stability)
4. If CPU-bound proportion <30%, JIT still provides 0-5% gain for web requests and significant gain for background jobs
5. Enable JIT with tracing mode (opcache.jit=1254) and 128MB buffer
6. Benchmark before/after enabling JIT to measure the actual impact
7. For loop-heavy CPU workloads, tracing JIT (1254) provides the best results
8. For function-call-heavy workloads, test function JIT (1205) as an alternative
9. Document the JIT concepts relevant to the application: mode, buffer size, type stability, guard elimination

## Validation Checklist

- [ ] PHP version confirmed >= 8.0
- [ ] OpCache configured and hit rate >99% before JIT enablement
- [ ] CPU-bound proportion measured
- [ ] JIT enabled with tracing mode (1254) and 128MB buffer
- [ ] Before/after benchmark completed
- [ ] JIT concepts documented for the team

## Common Failures

- **Expecting JIT to fix all performance problems**: JIT only optimizes CPU execution, not I/O wait
- **Enabling JIT without OpCache**: JIT reads opcodes from OpCache shared memory — OpCache must be enabled
- **Confusing tracing and function modes**: Tracing optimizes loops, function optimizes method calls — choose based on workload
- **Underestimating type stability importance**: Guard failures (type checks) cause bailout to interpreter — type-stable code benefits most

## Decision Points

- Tracing JIT (1254): default for most workloads, optimizes loop paths
- Function JIT (1205): for method/function-call-heavy workloads
- Max JIT (1235): maximum compilation, highest memory usage — benchmark before using
- If undecided: start with tracing (1254), benchmark, then try function (1205) and compare

## Performance Considerations

- Tracing JIT: 61-95% gain for CPU-bound code, 0-5% for I/O-bound
- JIT buffer: 128MB default, 64MB minimum, 256MB for large applications
- Compilation overhead: 50-500µs per hot function, amortized over thousands of calls
- Guard elimination (removing runtime type checks) is the primary source of JIT's speedup

## Security Considerations

- JIT does not alter PHP's security model
- JIT requires OpCache which caches compiled code in shared memory
- No special security considerations beyond standard PHP security practices

## Related Rules (from 05-rules.md)

- Enable JIT Universally, Then Benchmark
- Configure OpCache Before JIT
- Use Tracing JIT (1254) as Default
- Monitor JIT Buffer Utilization
- Pre-warm JIT in Long-Running Processes

## Related Skills

- JIT Configuration for Production
- JIT Mode Comparison
- Workload Benefit Assessment
- Bytecode vs Native Code Assessment

## Success Criteria

- JIT concepts (tracing, function, guard elimination, hot path, DynASM) understood by team
- OpCache confirmed as prerequisite and configured correctly
- JIT enabled with appropriate mode for the workload
- Before/after benchmark quantifies JIT benefit (or confirms minimal impact)
- Documentation created for JIT configuration rationale
