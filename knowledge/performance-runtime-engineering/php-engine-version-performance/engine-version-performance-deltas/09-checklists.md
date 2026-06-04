# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** PHP Engine & Version Performance
**Knowledge Unit:** PHP Engine Version Performance Deltas (7.4 through 8.5+)
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Jump multiple versions**: Upgrade from 7.4 directly to 8.2+ rather than stepping through each version. Each upgrade requires a testing cycle; minimize cycles by leapfrogging.
- [ ] **Benchmark before migrating**: Capture baseline throughput and latency before upgrading. Verify the expected gain materializes for your specific workload.
- [ ] **Prioritize OpCache and runtime over version bumps**: The 48.6% cumulative gain from 7.4 to 8.3 is dwarfed by OpCache tuning (2-4x) and runtime migration (3-15x). Optimize the bigger levers first.
- [ ] **Monitor for regressions**: PHP 8.4 showed a 5.2% regression under light I/O. Always benchmark in a staging environment before production rollout.
- [ ] Current PHP version is supported (8.1+ as of 2026)
- [ ] Version upgrade plan includes baseline benchmark and post-upgrade validation
- [ ] Leapfrog strategy used when upgrading across multiple versions
- [ ] OpCache properly sized for application (memory_consumption, max_accelerated_files)
- [ ] Typed properties used throughout codebase
- [ ] Performance delta measured and documented for all critical endpoints
- [ ] Variance across runs within acceptable range (<5%)
- [ ] Decision to upgrade or hold supported by data
- [ ] Migration plan includes rollback procedure if production performance doesn't match benchmarks
- [ ] Identical environments except for PHP version
- [ ] OpCache and JIT configured identically (or optimized per version)
- [ ] Minimum 3 benchmark runs per version per endpoint
- [ ] Variance within +/-5% across runs
- [ ] Performance delta calculated for throughput and latency
- [ ] Results documented with full environment metadata
- [ ] Decision made (upgrade or hold) based on data

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Shared-nothing architecture** (PHP-FPM): Each request is isolated in a separate OS process. Maximizes fault isolation at the cost of per-request bootstrap overhead. Best for multi-tenant hosting where isolation is prioritized.
- [ ] **Memory-resident architecture** (Octane/Swoole): Boot once, handle many. Reduces latency by 60-90% for framework-heavy applications but introduces state management complexity. Best for dedicated API servers with controlled code deployments.
- [ ] **Event-driven coroutines** (Swoole/FrankenPHP): Single process handles many concurrent requests via coroutine switching. Memory efficiency is high but requires non-blocking I/O for all operations.
- [ ] **Shared-nothing architecture (FPM)**: Each request isolated in a separate process. Maximizes fault isolation at cost of per-request bootstrap overhead.
- [ ] **Memory-resident architecture (Octane/Swoole)**: Boot once, handle many. Reduces latency 60-90% for framework-heavy apps. Introduces state management complexity.
- [ ] **Event-driven coroutines (Swoole/FrankenPHP)**: Single process handles many concurrent requests via coroutine switching. Requires non-blocking I/O for all operations.
- [ ] Document and follow through on architectural decision: Whether to upgrade PHP for performance vs security
- [ ] Document and follow through on architectural decision: Which version to target when upgrading
- [ ] Document and follow through on architectural decision: Whether to benchmark before upgrade
- [ ] Ensure architecture aligns with core concept: **PHP 7.4 to 8.0**: ~26% throughput gain. JIT compiler, named arguments, match expression, union types, mixed type.
- [ ] Ensure architecture aligns with core concept: **PHP 8.0 to 8.1**: ~10-15% gain. Fibers, readonly properties, Enums, intersection types, array unpacking with string keys.
- [ ] Ensure architecture aligns with core concept: **PHP 8.1 to 8.2**: ~8-10% gain. Readonly classes, standalone types (true, null, false), random extension improvements, opcode optimizations.
- [ ] Ensure architecture aligns with core concept: **PHP 8.2 to 8.3**: ~3-5% gain. Lazy objects (RFC), json_validate(), typed class constants, opcode improvements.
- [ ] Ensure architecture aligns with core concept: **PHP 8.3 to 8.4**: ~3% gain (with noted 5.2% regression under light I/O in some benchmarks). Property hooks, asymmetric visibility, lazy objects stabilization.
- [ ] Ensure architecture aligns with core concept: **PHP 8.4 to 8.5**: Minimal throughput change (~1-2%). Pipe operator, JIT blacklist function, GC improvements for Enums/closures.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Jump multiple versions**: Upgrade from 7.4 directly to 8.2+ rather than stepping through each version. Each upgrade requires a testing cycle; minimize cycles by leapfrogging.
- [ ] **Benchmark before migrating**: Capture baseline throughput and latency before upgrading. Verify the expected gain materializes for your specific workload.
- [ ] **Prioritize OpCache and runtime over version bumps**: The 48.6% cumulative gain from 7.4 to 8.3 is dwarfed by OpCache tuning (2-4x) and runtime migration (3-15x). Optimize the bigger levers first.
- [ ] **Monitor for regressions**: PHP 8.4 showed a 5.2% regression under light I/O. Always benchmark in a staging environment before production rollout.
- [ ] Ensure both PHP environments are identical except for the PHP version â€” same hardware, same application code, same OpCache/JIT configuration
- [ ] Select 3-5 representative endpoints covering: simple API, database-heavy, and rendering-heavy workloads
- [ ] Run a warm-up phase (30s) on each environment for each endpoint
- [ ] Benchmark each endpoint using wrk2 with open-loop model, recording throughput and latency percentiles
- [ ] Run the benchmark 3 times per endpoint per environment to assess variance
- [ ] Calculate the mean throughput and p95 latency for each endpoint on each PHP version
- [ ] Compute the performance delta: (new_value - old_value) / old_value * 100 for throughput and latency
- [ ] Document the results including PHP versions, OpCache/JIT settings, and benchmark configuration
- [ ] If throughput improves >=5% on critical endpoints, proceed with upgrade planning
- [ ] If improvement is neutral or negative, investigate configuration differences or workload-specific regressions

# Performance Checklist (from 04/06)
- [ ] Shared-nothing (FPM)
- [ ] Memory-resident (Octane)
- [ ] JIT compilation
- [ ] OpCache

# Security Checklist (from 04/06 - only if relevant)
- [ ] Always run a supported PHP version (currently 8.1+). Unsupported versions receive no security patches.
- [ ] PHP 7.4 and 8.0 have reached End of Life â€” no security fixes for known CVEs.
- [ ] Upgrade within 3 months of a new minor release to maintain security coverage.
- [ ] CVE exploits targeting known PHP vulnerabilities appear regularly for EOL versions.

# Reliability Checklist (from 04/05/06)
- [ ] **Deadlock**: PHP-FPM workers deadlocked on shared resource (file lock, database connection pool). Symptom: active workers plateau at max_children, no requests complete. Mitigation: Set request_terminate_timeout to kill stuck workers.
- [ ] **Memory exhaustion**: PHP worker exceeds memory_limit. Symptom: PHP Fatal error "Allowed memory size exhausted". Mitigation: Increase limit or optimize memory usage. Root cause analysis via memory profiler.
- [ ] **File descriptor exhaustion**: OpCache or PHP worker runs out of file descriptors. Symptom: "Too many open files" errors. Mitigation: Increase ulimit -n in systemd service file.
- [ ] **PHP version lifecycle**: Always run a supported PHP version (currently 8.1+). Each minor version brings 5-15% performance improvement. Upgrade within 3 months of release.
- [ ] **Configuration audit**: Check memory_limit, max_execution_time, max_input_vars, ealpath_cache_size are tuned for your application. Defaults are conservative.
- [ ] **Error handling**: display_errors=Off, log_errors=On, error_reporting=E_ALL. Never show errors to users.

# Testing Checklist (from 04/06)
- [ ] Current PHP version is supported (8.1+ as of 2026)
- [ ] Version upgrade plan includes baseline benchmark and post-upgrade validation
- [ ] Leapfrog strategy used when upgrading across multiple versions
- [ ] OpCache properly sized for application (memory_consumption, max_accelerated_files)
- [ ] Typed properties used throughout codebase
- [ ] Profiling performed to identify actual bottlenecks before optimization
- [ ] Security support timeline verified for target PHP version
- [ ] Performance delta measured and documented for all critical endpoints
- [ ] Variance across runs within acceptable range (<5%)
- [ ] Decision to upgrade or hold supported by data
- [ ] Migration plan includes rollback procedure if production performance doesn't match benchmarks
- [ ] Identical environments except for PHP version
- [ ] OpCache and JIT configured identically (or optimized per version)
- [ ] Minimum 3 benchmark runs per version per endpoint
- [ ] Variance within +/-5% across runs
- [ ] Performance delta calculated for throughput and latency
- [ ] Results documented with full environment metadata
- [ ] Decision made (upgrade or hold) based on data

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Jump multiple versions**: Upgrade from 7.4 directly to 8.2+ rather than stepping through each version. Each upgrade requires a testing cycle; minimize cycles by leapfrogging.
- [ ] **Benchmark before migrating**: Capture baseline throughput and latency before upgrading. Verify the expected gain materializes for your specific workload.
- [ ] **Prioritize OpCache and runtime over version bumps**: The 48.6% cumulative gain from 7.4 to 8.3 is dwarfed by OpCache tuning (2-4x) and runtime migration (3-15x). Optimize the bigger levers first.
- [ ] **Monitor for regressions**: PHP 8.4 showed a 5.2% regression under light I/O. Always benchmark in a staging environment before production rollout.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Upgrading without testing
- [ ] Avoid: Assuming all opcodes equal
- [ ] Avoid: Not using typed properties
- [ ] Avoid: Ignoring OpCache in dev
- [ ] Avoid: Under-sizing memory for large apps
- [ ] Avoid anti-pattern: **Chasing every minor version upgrade**: Upgrading from 8.3 to 8.4 to 8.5 sequentially wastes testing cycles for marginal gains. Leapfrog to the version you need.
- [ ] Avoid anti-pattern: **Assuming JIT solves all performance problems**: JIT provides 61-95% gains for CPU-bound workloads but 0-5% for I/O-bound web apps. Profile first, optimize second.
- [ ] Avoid anti-pattern: **Neglecting OpCache tuning while upgrading PHP**: A well-tuned OpCache on PHP 8.0 outperforms default OpCache on PHP 8.5. Tune configuration, not just version.
- [ ] Guard against anti-pattern: Assuming Version Upgrade Always Improves Performance
- [ ] Guard against anti-pattern: Skipping Direct Upgrades Without Performance Validation
- [ ] Guard against anti-pattern: Using Synthetic Benchmarks for Version Comparison
- [ ] Guard against anti-pattern: Ignoring BC Breaks in Pursuit of Performance
- [ ] Guard against anti-pattern: Chasing Every Minor Version Release
- [ ] Application-specific benchmark performed for current vs target version

# Production Readiness Checklist
- [ ] Configure monitoring and alerting
- [ ] Set up logging with appropriate verbosity levels
- [ ] Document operational runbooks
- [ ] **PHP version lifecycle**: Always run a supported PHP version (currently 8.1+). Each minor version brings 5-15% performance improvement. Upgrade within 3 months of release.
- [ ] **Configuration audit**: Check memory_limit, max_execution_time, max_input_vars, ealpath_cache_size are tuned for your application. Defaults are conservative.
- [ ] **Error handling**: display_errors=Off, log_errors=On, error_reporting=E_ALL. Never show errors to users.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **PHP 7.4 to 8.0**: ~26% throughput gain. JIT compiler, named arguments, match expression, union types, mixed type., **PHP 8.0 to 8.1**: ~10-15% gain. Fibers, readonly properties, Enums, intersection types, array unpacking with string keys., **PHP 8.1 to 8.2**: ~8-10% gain. Readonly classes, standalone types (true, null, false), random extension improvements, opcode optimizations., **PHP 8.2 to 8.3**: ~3-5% gain. Lazy objects (RFC), json_validate(), typed class constants, opcode improvements., **PHP 8.3 to 8.4**: ~3% gain (with noted 5.2% regression under light I/O in some benchmarks). Property hooks, asymmetric visibility, lazy objects stabilization.
**Rules:**
- General: Do Not Chase Minor Versions for Marginal Gains
**Skills:** Benchmark Design and Execution, Workload Benefit Assessment, Bottleneck-Driven Optimization
**Decision Trees:** Whether to upgrade PHP for performance vs security, Which version to target when upgrading, Whether to benchmark before upgrade
**Anti-Patterns:** Assuming Version Upgrade Always Improves Performance, Skipping Direct Upgrades Without Performance Validation, Using Synthetic Benchmarks for Version Comparison, Ignoring BC Breaks in Pursuit of Performance, Chasing Every Minor Version Release
**Related Topics:** PHP Version Numbering, Bytecode vs Native Code, PHP Execution Lifecycle, JIT Concepts and Terminology, Version Migration Planning

