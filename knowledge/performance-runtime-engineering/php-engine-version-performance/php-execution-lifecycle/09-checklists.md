# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** PHP Engine & Version Performance
**Knowledge Unit:** PHP Execution Lifecycle (Parse ? Compile ? Execute Opcode Pipeline)
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Enable OpCache**: Without OpCache, 100% of requests recompile all source files. With OpCache, only ~1-3ms overhead per request for autoloading + execution.
- [ ] **Understand the compilation cost**: First request after deployment is slow (cold cache). Preloading reduces cold-start latency.
- [ ] **Leverage typed properties**: Reduce opcode count â€” `public int $x` uses fewer ops than `public $x` with docblock. This reduces execution time in property-heavy code.
- [ ] OpCache enabled in production
- [ ] Understanding of the four-phase pipeline (lex, parse, compile, execute)
- [ ] Awareness of cold vs warm request behavior
- [ ] Preloading evaluated for cold-start optimization
- [ ] Typed properties used to reduce opcode count
- [ ] Execution lifecycle phase bottlenecks identified and addressed
- [ ] OpCache hit rate >99% confirmed
- [ ] Preloading configured for framework classes
- [ ] Before/after benchmark shows measurable improvement in request time
- [ ] JIT buffer utilization monitored (<80% full)
- [ ] Preloading configured for frequently-used classes
- [ ] Lifecycle phase optimization documented
- [ ] Before/after benchmark shows reduction in execution time
- [ ] **PHP version lifecycle**: Always run a supported PHP version (currently 8.1+). Each minor version brings 5-15% performance improvement. Upgrade within 3 months of release.
- [ ] **Configuration audit**: Check memory_limit, max_execution_time, max_input_vars, ealpath_cache_size are tuned for your application. Defaults are conservative.
- [ ] **Error handling**: display_errors=Off, log_errors=On, error_reporting=E_ALL. Never show errors to users.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Shared-nothing architecture** (PHP-FPM): Each request is isolated in a separate OS process. Maximizes fault isolation at the cost of per-request bootstrap overhead. Best for multi-tenant hosting where isolation is prioritized.
- [ ] **Memory-resident architecture** (Octane/Swoole): Boot once, handle many. Reduces latency by 60-90% for framework-heavy applications but introduces state management complexity. Best for dedicated API servers with controlled code deployments.
- [ ] **Event-driven coroutines** (Swoole/FrankenPHP): Single process handles many concurrent requests via coroutine switching. Memory efficiency is high but requires non-blocking I/O for all operations.
- [ ] **Zend Engine executor**: Uses `zend_execute_data` as its call frame structure. Each opcode is a `zend_op` struct containing opcode number, operands (op1, op2, result), and handler function pointer.
- [ ] **PHP 8.4 computed goto**: Faster opcode handler dispatch using `goto` for ~5-8% execution speedup. The executor loop is a while(1) that fetches, dispatches, and chains opcodes.
- [ ] **JIT interception**: `opcache.jit` intercepts at the opcode dispatch level, redirecting hot traces to compiled native code paths.
- [ ] Document and follow through on architectural decision: Which lifecycle phase to optimize
- [ ] Document and follow through on architectural decision: OpCache vs JIT vs preloading investment
- [ ] Document and follow through on architectural decision: Cold vs warm measurement methodology
- [ ] Ensure architecture aligns with core concept: **Lexing**: PHP source is tokenized into meaningful symbols (T_STRING, T_VARIABLE, etc.).
- [ ] Ensure architecture aligns with core concept: **Parsing**: Tokens are assembled into an Abstract Syntax Tree (AST) representing program structure.
- [ ] Ensure architecture aligns with core concept: **Compilation**: AST is walked to produce Zend opcodes â€” the bytecode instruction set of the Zend Virtual Machine.
- [ ] Ensure architecture aligns with core concept: **Execution**: Zend VM dispatches opcodes via a while(1) loop calling handler functions.
- [ ] Ensure architecture aligns with core concept: **OpCache interception**: On subsequent requests, OpCache serves pre-compiled opcodes from shared memory, skipping lex/parse/compile phases entirely.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Enable OpCache**: Without OpCache, 100% of requests recompile all source files. With OpCache, only ~1-3ms overhead per request for autoloading + execution.
- [ ] **Understand the compilation cost**: First request after deployment is slow (cold cache). Preloading reduces cold-start latency.
- [ ] **Leverage typed properties**: Reduce opcode count â€” `public int $x` uses fewer ops than `public $x` with docblock. This reduces execution time in property-heavy code.
- [ ] Measure baseline: profile a request and record wall time broken into bootstrap vs execution
- [ ] Check OpCache hit rate: if <99%, compilation overhead is inflating execution time â€” size OpCache memory and max files
- [ ] If OpCache hit rate >99% but execution still slow, check JIT utilization: if JIT buffer is >80% full, increase buffer size
- [ ] If preloading is not configured, identify the top 100 most-loaded classes from profiling data and add them to preload script
- [ ] Enable preloading: create `config/preload.php` with class list and configure `opcache.preload` in php.ini
- [ ] Benchmark before/after each optimization phase to measure individual impact
- [ ] Document the optimized configuration and lifecycle phase improvements

# Performance Checklist (from 04/06)
- [ ] Shared-nothing (FPM)
- [ ] Memory-resident (Octane)
- [ ] JIT compilation
- [ ] OpCache

# Security Checklist (from 04/06 - only if relevant)
- [ ] OpCache operates at the opcode level â€” stale opcodes can serve outdated code if not properly invalidated
- [ ] validate_timestamps=0 trades automatic cache invalidation for performance â€” requires explicit opcache_reset() on deploy
- [ ] Never disable OpCache in production; the performance impact is severe

# Reliability Checklist (from 04/05/06)
- [ ] **Deadlock**: PHP-FPM workers deadlocked on shared resource (file lock, database connection pool). Symptom: active workers plateau at max_children, no requests complete. Mitigation: Set request_terminate_timeout to kill stuck workers.
- [ ] **Memory exhaustion**: PHP worker exceeds memory_limit. Symptom: PHP Fatal error "Allowed memory size exhausted". Mitigation: Increase limit or optimize memory usage. Root cause analysis via memory profiler.
- [ ] **File descriptor exhaustion**: OpCache or PHP worker runs out of file descriptors. Symptom: "Too many open files" errors. Mitigation: Increase ulimit -n in systemd service file.
- [ ] **PHP version lifecycle**: Always run a supported PHP version (currently 8.1+). Each minor version brings 5-15% performance improvement. Upgrade within 3 months of release.
- [ ] **Configuration audit**: Check memory_limit, max_execution_time, max_input_vars, ealpath_cache_size are tuned for your application. Defaults are conservative.
- [ ] **Error handling**: display_errors=Off, log_errors=On, error_reporting=E_ALL. Never show errors to users.

# Testing Checklist (from 04/06)
- [ ] OpCache enabled in production
- [ ] Understanding of the four-phase pipeline (lex, parse, compile, execute)
- [ ] Awareness of cold vs warm request behavior
- [ ] Preloading evaluated for cold-start optimization
- [ ] Typed properties used to reduce opcode count
- [ ] JIT configuration understood in relation to execution phase
- [ ] Execution lifecycle phase bottlenecks identified and addressed
- [ ] OpCache hit rate >99% confirmed
- [ ] Preloading configured for framework classes
- [ ] Before/after benchmark shows measurable improvement in request time
- [ ] JIT buffer utilization monitored (<80% full)
- [ ] Preloading configured for frequently-used classes
- [ ] Lifecycle phase optimization documented
- [ ] Before/after benchmark shows reduction in execution time

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Enable OpCache**: Without OpCache, 100% of requests recompile all source files. With OpCache, only ~1-3ms overhead per request for autoloading + execution.
- [ ] **Understand the compilation cost**: First request after deployment is slow (cold cache). Preloading reduces cold-start latency.
- [ ] **Leverage typed properties**: Reduce opcode count â€” `public int $x` uses fewer ops than `public $x` with docblock. This reduces execution time in property-heavy code.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Disabling OpCache in production
- [ ] Avoid: Not understanding cold vs warm
- [ ] Avoid: Ignoring compilation cost
- [ ] Avoid: Not using typed properties
- [ ] Avoid anti-pattern: **Forgetting the pipeline exists**: All performance tuning operates on one of these phases. OpCache on compilation, JIT on execution, preloading on bootstrap.
- [ ] Avoid anti-pattern: **Tuning execution without optimizing compilation**: OpCache provides 2-4x gain with zero code changes. Always start with OpCache before optimizing code.
- [ ] Avoid anti-pattern: **Measuring only execution time**: Cold requests (post-deployment) include compilation time. Design benchmarks to measure both cold and warm states.
- [ ] Guard against anti-pattern: Disabling OpCache in Production
- [ ] Guard against anti-pattern: Measuring Only Execution Time Without Accounting for Compilation
- [ ] Guard against anti-pattern: Ignoring Cold vs Warm Request Behavior
- [ ] Guard against anti-pattern: Tuning Execution Without Optimizing Compilation
- [ ] Guard against anti-pattern: Confusing the Pipeline Stage Being Optimized
- [ ] `opcache.enable=1` in production php.ini
- [ ] `opcache_get_status()` returns valid cache data with hits

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
**Core Concepts:** **Lexing**: PHP source is tokenized into meaningful symbols (T_STRING, T_VARIABLE, etc.)., **Parsing**: Tokens are assembled into an Abstract Syntax Tree (AST) representing program structure., **Compilation**: AST is walked to produce Zend opcodes â€” the bytecode instruction set of the Zend Virtual Machine., **Execution**: Zend VM dispatches opcodes via a while(1) loop calling handler functions., **OpCache interception**: On subsequent requests, OpCache serves pre-compiled opcodes from shared memory, skipping lex/parse/compile phases entirely.
**Rules:**
- General: Distinguish Which Lifecycle Phase an Optimization Targets
**Skills:** OpCache Monitoring and Hit Rate Analysis, Preloading Script Design Patterns, Composer Autoloader Optimization
**Decision Trees:** Which lifecycle phase to optimize, OpCache vs JIT vs preloading investment, Cold vs warm measurement methodology
**Anti-Patterns:** Disabling OpCache in Production, Measuring Only Execution Time Without Accounting for Compilation, Ignoring Cold vs Warm Request Behavior, Tuning Execution Without Optimizing Compilation, Confusing the Pipeline Stage Being Optimized
**Related Topics:** Bytecode vs Native Code, OpCache Purpose and Mechanics, JIT Concepts and Terminology, PHP Preloading, Zend Engine Opcode Pipeline

