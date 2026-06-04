# Skill: Configure JIT for Production Deployment

## Purpose

Apply a progressive, benchmark-validated JIT configuration pipeline: OpCache first, then tracing JIT as default, then tune mode and buffer based on measurements.

## When To Use

- Initial PHP 8.0+ production deployment requiring JIT configuration
- Auditing existing JIT configuration for correctness
- After OpCache is already optimally configured

## When NOT To Use

- When OpCache is not yet configured (configure OpCache first)
- For development environments where JIT complicates debugging
- For PHP versions below 8.0 (JIT not available)

## Prerequisites

- OpCache enabled and tuned (memory, max files, hit rate >99%)
- PHP 8.0+ runtime
- Benchmarking tools for before/after comparison
- Monitoring access for JIT buffer utilization

## Inputs

- Current OpCache configuration (php.ini)
- Application workload description
- Baseline benchmark results (without JIT)

## Workflow (numbered steps)

1. Verify OpCache is configured and hit rate >99% — do not proceed until this is confirmed
2. Add JIT configuration to php.ini: `opcache.jit=1254` and `opcache.jit_buffer_size=128M`
3. Restart PHP-FPM to apply JIT configuration
4. Verify JIT is enabled: `php -i | grep opcache.jit` and check `opcache_get_status(false)['jit']`
5. Run a benchmark to establish the JIT-enabled baseline
6. Monitor JIT buffer utilization over 24 hours: `opcache_get_status(false)['jit']['buffer_free']`
7. If buffer free <20% of total, increase jit_buffer_size by 50%
8. For queue workers and CLI cron jobs, enable JIT via `opcache.enable_cli=1` in the CLI php.ini
9. For Octane/Swoole long-running processes, implement JIT pre-warming (execute representative requests after worker start)
10. Document the final JIT configuration with rationale and benchmark data

## Validation Checklist

- [ ] OpCache hit rate >99% before JIT enablement
- [ ] JIT enabled (opcache.jit=1254, jit_buffer_size=128M)
- [ ] JIT verified active: `php -i | grep opcache.jit`
- [ ] Buffer utilization monitored for 24 hours
- [ ] Buffer size adjusted if free <20%
- [ ] JIT enabled on queue/cron workers (opcache.enable_cli=1)
- [ ] Before/after benchmark documented
- [ ] Pre-warming configured for long-running processes

## Common Failures

- **Tuning JIT before OpCache**: JIT depends on OpCache — if OpCache has low hit rate, JIT performance suffers
- **Not monitoring JIT buffer**: Undersized buffer causes thrashing that erases JIT benefit
- **Disabling JIT on background workers**: Queue jobs and cron tasks are often CPU-bound and benefit most from JIT
- **No pre-warming in Octane**: First 100+ requests on each worker are slow while JIT compiles hot paths

## Decision Points

- Default (1254): tracing JIT, best general-purpose mode for most workloads
- If buffer free <20%: increase buffer before changing JIT mode
- If CPU-bound workload: consider testing function JIT (1205) or max (1235)
- If queue workers: enable opcache.enable_cli=1 for JIT on CLI

## Performance Considerations

- OpCache provides 2-4x gain; JIT adds 0-95% on top depending on CPU-bound proportion
- 128MB buffer is sufficient for most applications — monitor before increasing
- JIT compilation overhead: 50-500µs per hot function, amortized over thousands of calls
- Pre-warming eliminates cold-start latency from JIT compilation

## Security Considerations

- JIT configuration does not affect PHP's security model
- opcache.enable_cli=1 may expose OpCache-related bugs in CLI scripts — test thoroughly
- JIT blacklist (PHP 8.5+) can exclude specific functions if they cause issues

## Related Rules (from 05-rules.md)

- Progressively Enable OpCache Then JIT
- Keep JIT Enabled on Queue and Cron Workers
- JIT Blacklist Functions That Cause Guard Failures
- Monitor JIT Buffer Utilization
- Pre-warm JIT in Long-Running Processes

## Related Skills

- JIT Mode Comparison
- JIT Buffer Sizing Guidelines
- JIT Hot Path Threshold Tuning
- OpCache Configuration and Sizing

## Success Criteria

- JIT configured and active in production
- Buffer utilization maintained between 20-80%
- Before/after benchmark documents JIT impact
- Queue/cron workers also have JIT enabled
- Long-running processes have pre-warming configured
