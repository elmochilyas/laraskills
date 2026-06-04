# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** JIT Compilation
**Knowledge Unit:** JIT Configuration for Production â€” Recommended Settings by Workload
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Progressive enablement**: Enable OpCache first, then JIT. Start with 1254 and 128MB, benchmark before/after, then tune.
- [ ] **Monitor buffer utilization**: If jit_buffer_free < 20% of jit_buffer_size, increase buffer. Compilation thrashing destroys JIT benefit.
- [ ] **JIT blacklist problematic functions**: Use opcache_jit_blacklist() in PHP 8.5+ to exclude functions that cause guard failures or compilation issues.
- [ ] **Pre-warm JIT in long-running processes**: Execute representative requests after worker start to trigger JIT compilation of hot paths before accepting traffic.
- [ ] **Keep JIT enabled universally**: Even if I/O-bound web requests don't benefit, cron jobs, queue workers, and batch processing gain significant speedup.
- [ ] OpCache configured before JIT
- [ ] JIT enabled with starting configuration (1254, 128MB)
- [ ] Buffer utilization monitored (jit_buffer_free > 20%)
- [ ] Before/after benchmark completed
- [ ] JIT blacklist reviewed (PHP 8.5+)
- [ ] JIT configured and active in production
- [ ] Buffer utilization maintained between 20-80%
- [ ] Before/after benchmark documents JIT impact
- [ ] Queue/cron workers also have JIT enabled
- [ ] Long-running processes have pre-warming configured
- [ ] OpCache hit rate >99% before JIT enablement
- [ ] JIT enabled (opcache.jit=1254, jit_buffer_size=128M)
- [ ] JIT verified active: `php -i | grep opcache.jit`
- [ ] Buffer utilization monitored for 24 hours
- [ ] Buffer size adjusted if free <20%

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Tracing vs Function JIT**: Tracing JIT optimizes hot loop paths, ideal for templating, data processing, and iterative algorithms. Function JIT optimizes entire functions, better for method-heavy code with predictable call patterns (ORMs, domain logic). When memory is constrained, Function JIT produces less fragmentation.
- [ ] **JIT buffer sizing**: 64MB minimum, 128MB default, 256MB for large applications. Buffer too small causes frequent compilation of the same hot paths. Buffer too large wastes virtual memory (not physical until used). Monitor jit_buffer_size and jit_buffer_free via opcache_get_status().
- [ ] **OpCache First**: JIT compiles opcodes from OpCache. If OpCache is misconfigured (cache full, low hit rate), JIT performance suffers. Fix OpCache before tuning JIT.
- [ ] **Buffer is Pre-Allocated**: The JIT buffer is a contiguous memory segment allocated at startup. It cannot be resized without PHP-FPM restart.
- [ ] **Compilation Persistence**: In PHP-FPM, each worker has its own JIT buffer. In long-running runtimes (Octane), the buffer persists across requests within the same worker.
- [ ] **JIT Blacklist Scope**: The blacklist is per-process. Functions that cause frequent guard failures or produce large compiled code are good candidates for exclusion.
- [ ] Document and follow through on architectural decision: Production JIT configuration profile
- [ ] Document and follow through on architectural decision: Whether to use JIT blacklist (PHP 8.5+)
- [ ] Ensure architecture aligns with core concept: **php.ini Directives**: opcache.jit, opcache.jit_buffer_size, opcache.jit_debug, opcache.jit_bisect_limit
- [ ] Ensure architecture aligns with core concept: **JIT Blacklist (PHP 8.5+)**: opcache_jit_blacklist() function to exclude specific functions from JIT compilation
- [ ] Ensure architecture aligns with core concept: **Buffer Sizing**: 128MB default, 64MB minimum, 256MB for large applications. Too small causes compilation thrashing.
- [ ] Ensure architecture aligns with core concept: **JIT + OpCache Interaction**: JIT reads opcodes from OpCache shared memory â€” OpCache must be enabled and properly configured first

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Progressive enablement**: Enable OpCache first, then JIT. Start with 1254 and 128MB, benchmark before/after, then tune.
- [ ] **Monitor buffer utilization**: If jit_buffer_free < 20% of jit_buffer_size, increase buffer. Compilation thrashing destroys JIT benefit.
- [ ] **JIT blacklist problematic functions**: Use opcache_jit_blacklist() in PHP 8.5+ to exclude functions that cause guard failures or compilation issues.
- [ ] **Pre-warm JIT in long-running processes**: Execute representative requests after worker start to trigger JIT compilation of hot paths before accepting traffic.
- [ ] **Keep JIT enabled universally**: Even if I/O-bound web requests don't benefit, cron jobs, queue workers, and batch processing gain significant speedup.
- [ ] Verify OpCache is configured and hit rate >99% â€” do not proceed until this is confirmed
- [ ] Add JIT configuration to php.ini: `opcache.jit=1254` and `opcache.jit_buffer_size=128M`
- [ ] Restart PHP-FPM to apply JIT configuration
- [ ] Verify JIT is enabled: `php -i | grep opcache.jit` and check `opcache_get_status(false)['jit']`
- [ ] Run a benchmark to establish the JIT-enabled baseline
- [ ] Monitor JIT buffer utilization over 24 hours: `opcache_get_status(false)['jit']['buffer_free']`
- [ ] If buffer free <20% of total, increase jit_buffer_size by 50%
- [ ] For queue workers and CLI cron jobs, enable JIT via `opcache.enable_cli=1` in the CLI php.ini
- [ ] For Octane/Swoole long-running processes, implement JIT pre-warming (execute representative requests after worker start)
- [ ] Document the final JIT configuration with rationale and benchmark data

# Performance Checklist (from 04/06)
- [ ] OpCache provides 2-4x gain. JIT adds 0-95% on top depending on CPU-bound proportion
- [ ] JIT buffer is committed as virtual memory â€” ensure swap is configured if using 256MB+
- [ ] 128MB is sufficient for most applications. Monitor utilization.
- [ ] JIT compilation overhead: 50-500Âµs per hot function, amortized over thousands of calls
- [ ] JIT enabled
- [ ] Tracing mode
- [ ] Function mode
- [ ] Large buffer (256MB)

# Security Checklist (from 04/06 - only if relevant)
- [ ] Review for security implications of implementation choices
- [ ] Validate input boundaries and type safety

# Reliability Checklist (from 04/05/06)
- [ ] **JIT buffer exhaustion**: Buffer utilization reaches 100%. Symptom: JIT compilation stalls, hot paths revert to interpreter. Mitigation: Increase jit_buffer_size, monitor jit_buffer_free.
- [ ] **Segfault on native code execution**: JIT produces incorrect native code (rare, fixed in updates). Symptom: PHP-FPM worker crashes with SIGSEGV. Mitigation: Disable JIT, upgrade PHP, file bug report.
- [ ] **Compilation pause spikes**: JIT compilation during request causes latency spikes. Symptom: Occasional p99 latency spikes (10-100ms). Mitigation: Use less aggressive JIT mode (1254 vs 1235), increase trigger thresholds.
- [ ] **Type guard failures**: Incorrect type guard elimination causes wrong computation results. Symptom: Silent data corruption in JIT-compiled code. Mitigation: Keep PHP updated, report as PHP bug.
- [ ] **Enable JIT gradually**: Start with opcache.jit=1255 (tracing, default optimization) and 128MB buffer. Monitor for increased memory and compilation pauses.
- [ ] **Warm-up period**: JIT requires 1000-10000 requests to reach peak performance. Generate production traffic after deploy before measuring JIT impact.
- [ ] **Memory commitment**: JIT buffer is committed as virtual memory Ã¢â‚¬â€ ensure swap is configured if buffer is large.
- [ ] **Monitoring**: Check opcache_get_status()['jit'] for uffer_size, uffer_free. If buffer utilization > 80%, increase jit_buffer_size.

# Testing Checklist (from 04/06)
- [ ] OpCache configured before JIT
- [ ] JIT enabled with starting configuration (1254, 128MB)
- [ ] Buffer utilization monitored (jit_buffer_free > 20%)
- [ ] Before/after benchmark completed
- [ ] JIT blacklist reviewed (PHP 8.5+)
- [ ] Queue workers also have JIT enabled
- [ ] Pre-warming configured for long-running processes
- [ ] JIT configured and active in production
- [ ] Buffer utilization maintained between 20-80%
- [ ] Before/after benchmark documents JIT impact
- [ ] Queue/cron workers also have JIT enabled
- [ ] Long-running processes have pre-warming configured
- [ ] OpCache hit rate >99% before JIT enablement
- [ ] JIT enabled (opcache.jit=1254, jit_buffer_size=128M)
- [ ] JIT verified active: `php -i | grep opcache.jit`
- [ ] Buffer utilization monitored for 24 hours
- [ ] Buffer size adjusted if free <20%
- [ ] JIT enabled on queue/cron workers (opcache.enable_cli=1)
- [ ] Before/after benchmark documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Progressive enablement**: Enable OpCache first, then JIT. Start with 1254 and 128MB, benchmark before/after, then tune.
- [ ] **Monitor buffer utilization**: If jit_buffer_free < 20% of jit_buffer_size, increase buffer. Compilation thrashing destroys JIT benefit.
- [ ] **JIT blacklist problematic functions**: Use opcache_jit_blacklist() in PHP 8.5+ to exclude functions that cause guard failures or compilation issues.
- [ ] **Pre-warm JIT in long-running processes**: Execute representative requests after worker start to trigger JIT compilation of hot paths before accepting traffic.
- [ ] **Keep JIT enabled universally**: Even if I/O-bound web requests don't benefit, cron jobs, queue workers, and batch processing gain significant speedup.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Tuning JIT before OpCache
- [ ] Avoid: Undersized buffer
- [ ] Avoid: JIT disabled on queue workers
- [ ] Avoid: No pre-warming in Octane
- [ ] Avoid anti-pattern: **Toggling JIT on/off per environment**: JIT configuration should be consistent. Enable universally and measure impact.
- [ ] Avoid anti-pattern: **Assuming JIT replaces OpCache tuning**: JIT amplifies OpCache benefits but doesn't replace proper OpCache configuration.
- [ ] Avoid anti-pattern: **Setting jit_buffer_size too large**: Wastes virtual memory (not physical until used, but address space pressure matters in 32-bit or containers).
- [ ] Guard against anti-pattern: Tuning JIT Before OpCache is Properly Configured
- [ ] Guard against anti-pattern: Setting jit_buffer_size Excessively Large
- [ ] Guard against anti-pattern: No JIT Blacklist Usage for Guard-Failure-Prone Functions
- [ ] Guard against anti-pattern: JIT Disabled on Queue Workers While Enabled on Web Workers
- [ ] Guard against anti-pattern: No Pre-Warming JIT in Long-Running Processes
- [ ] OpCache properly configured before JIT tuning
- [ ] OpCache hit rate > 99% (cache misses < 1%)

# Production Readiness Checklist
- [ ] Configure monitoring and alerting
- [ ] Set up logging with appropriate verbosity levels
- [ ] Document operational runbooks
- [ ] **Enable JIT gradually**: Start with opcache.jit=1255 (tracing, default optimization) and 128MB buffer. Monitor for increased memory and compilation pauses.
- [ ] **Warm-up period**: JIT requires 1000-10000 requests to reach peak performance. Generate production traffic after deploy before measuring JIT impact.
- [ ] **Memory commitment**: JIT buffer is committed as virtual memory Ã¢â‚¬â€ ensure swap is configured if buffer is large.
- [ ] **Monitoring**: Check opcache_get_status()['jit'] for uffer_size, uffer_free. If buffer utilization > 80%, increase jit_buffer_size.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **php.ini Directives**: opcache.jit, opcache.jit_buffer_size, opcache.jit_debug, opcache.jit_bisect_limit, **JIT Blacklist (PHP 8.5+)**: opcache_jit_blacklist() function to exclude specific functions from JIT compilation, **Buffer Sizing**: 128MB default, 64MB minimum, 256MB for large applications. Too small causes compilation thrashing., **JIT + OpCache Interaction**: JIT reads opcodes from OpCache shared memory â€” OpCache must be enabled and properly configured first
**Skills:** JIT Mode Comparison, JIT Buffer Sizing Guidelines, JIT Hot Path Threshold Tuning, OpCache Configuration and Sizing
**Decision Trees:** Production JIT configuration profile, Whether to use JIT blacklist (PHP 8.5+)
**Anti-Patterns:** Tuning JIT Before OpCache is Properly Configured, Setting jit_buffer_size Excessively Large, No JIT Blacklist Usage for Guard-Failure-Prone Functions, JIT Disabled on Queue Workers While Enabled on Web Workers, No Pre-Warming JIT in Long-Running Processes
**Related Topics:** JIT Buffer Sizing Guidelines, JIT Mode Comparison, JIT Hot Path Threshold Tuning, JIT for Long-Running Processes

