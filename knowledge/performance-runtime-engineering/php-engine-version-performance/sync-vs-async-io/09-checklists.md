# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** PHP Engine & Version Performance
**Knowledge Unit:** Synchronous vs Asynchronous I/O â€” Blocking vs Non-Blocking Operations
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Match concurrency model to I/O profile**: Async benefit is proportional to I/O wait time. Measure I/O wait before adopting async.
- [ ] **Profile before committing**: With sub-1ms database queries, async overhead (coroutine scheduling, event loop) can make Swoole 10% slower than FPM.
- [ ] **Use io_uring for maximum throughput**: With 50ms+ database queries, async yields 2-5x throughput improvements over synchronous FPM.
- [ ] **Understand auto-hooking**: Swoole automatically hooks PDO, MySQLi, Redis, and cURL â€” most PHP code runs without modification.
- [ ] I/O profile measured (average wait time per database/HTTP call)
- [ ] Concurrency model matched to I/O profile
- [ ] If using async: all I/O operations are non-blocking or auto-hooked
- [ ] Kernel version checked for io_uring compatibility (if applicable)
- [ ] Benchmark confirms async benefit before production deployment
- [ ] I/O profile accurately measured and documented
- [ ] Async vs sync decision justified by data
- [ ] If migrating to async: 24-hour soak test passed
- [ ] If staying synchronous: I/O wait time confirmed <20% of wall time
- [ ] Throughput improvement from async migration (if applicable) meets projections
- [ ] I/O wait time measured as percentage of wall time
- [ ] I/O wait broken down by dependency type
- [ ] If I/O wait >20%, async runtime evaluated
- [ ] Candidate async runtime benchmarked against synchronous baseline
- [ ] Decision documented with data
- [ ] Team trained on async programming patterns if migrating

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Shared-nothing architecture** (PHP-FPM): Each request is isolated in a separate OS process. Maximizes fault isolation at the cost of per-request bootstrap overhead. Best for multi-tenant hosting where isolation is prioritized.
- [ ] **Memory-resident architecture** (Octane/Swoole): Boot once, handle many. Reduces latency by 60-90% for framework-heavy applications but introduces state management complexity. Best for dedicated API servers with controlled code deployments.
- [ ] **Event-driven coroutines** (Swoole/FrankenPHP): Single process handles many concurrent requests via coroutine switching. Memory efficiency is high but requires non-blocking I/O for all operations.
- [ ] **Synchronous (FPM)**: Simple, blocking. Each worker handles one request at a time. More workers needed for I/O wait.
- [ ] **Asynchronous (Swoole)**: Non-blocking within coroutines. Single worker handles many concurrent requests during I/O wait.
- [ ] **io_uring**: Kernel-level async I/O with submission queue (SQ) and completion queue (CQ). Reduces syscall overhead by batching.
- [ ] Document and follow through on architectural decision: Synchronous vs asynchronous I/O model
- [ ] Document and follow through on architectural decision: Whether to use io_uring
- [ ] Ensure architecture aligns with core concept: **Synchronous I/O**: Process issues call -> kernel suspends process -> I/O completes -> process resumes. Simple but wastes CPU cycles during wait.
- [ ] Ensure architecture aligns with core concept: **Asynchronous I/O**: Process issues call -> kernel returns immediately -> process polls or uses event notification (epoll/kqueue/io_uring) for completion. Complex but maximizes CPU utilization during I/O.
- [ ] Ensure architecture aligns with core concept: **PHP-FPM is synchronous**: Each worker blocks during I/O. More workers needed to maintain throughput during slow I/O.
- [ ] Ensure architecture aligns with core concept: **Swoole coroutines auto-hook**: Synchronous PHP functions (PDO, MySQLi, Redis, cURL) become non-blocking transparently via coroutine scheduling.
- [ ] Ensure architecture aligns with core concept: **io_uring** (Swoole 6.2+): Linux kernel interface for true async I/O with submission/completion queues, reducing syscall overhead.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Match concurrency model to I/O profile**: Async benefit is proportional to I/O wait time. Measure I/O wait before adopting async.
- [ ] **Profile before committing**: With sub-1ms database queries, async overhead (coroutine scheduling, event loop) can make Swoole 10% slower than FPM.
- [ ] **Use io_uring for maximum throughput**: With 50ms+ database queries, async yields 2-5x throughput improvements over synchronous FPM.
- [ ] **Understand auto-hooking**: Swoole automatically hooks PDO, MySQLi, Redis, and cURL â€” most PHP code runs without modification.
- [ ] Profile a representative request to measure total I/O wait time vs PHP execution time
- [ ] Break down I/O wait by dependency: database, Redis, external APIs, file system
- [ ] If total I/O wait <20% of wall time, synchronous I/O (PHP-FPM) is sufficient â€” no need for async runtime
- [ ] If I/O wait >20%, identify the specific I/O operations that consume the most wait time
- [ ] For database-heavy workloads with queries >50ms: asynchronous coroutines (Swoole) provide the highest benefit
- [ ] For mixed I/O with moderate latency: RoadRunner's concurrent worker model handles parallel I/O efficiently
- [ ] For pure PHP async without extensions: ReactPHP or AMPHP (fiber-based) for CLI/streaming workloads
- [ ] Benchmark the candidate async model against the current synchronous baseline
- [ ] If async runtime provides <15% throughput improvement, stay with synchronous â€” added complexity not justified
- [ ] Document the decision with I/O profile data and benchmark results

# Performance Checklist (from 04/06)
- [ ] Shared-nothing (FPM)
- [ ] Memory-resident (Octane)
- [ ] JIT compilation
- [ ] OpCache

# Security Checklist (from 04/06 - only if relevant)
- [ ] Asynchronous I/O introduces complexity in error handling â€” uncaught exceptions in coroutines may be silent
- [ ] Connection pooling in async runtimes requires careful handling of authentication context
- [ ] io_uring operates at kernel level â€” verify kernel version compatibility
- [ ] Coroutine state can persist unexpectedly if not properly managed

# Reliability Checklist (from 04/05/06)
- [ ] **Deadlock**: PHP-FPM workers deadlocked on shared resource (file lock, database connection pool). Symptom: active workers plateau at max_children, no requests complete. Mitigation: Set request_terminate_timeout to kill stuck workers.
- [ ] **Memory exhaustion**: PHP worker exceeds memory_limit. Symptom: PHP Fatal error "Allowed memory size exhausted". Mitigation: Increase limit or optimize memory usage. Root cause analysis via memory profiler.
- [ ] **File descriptor exhaustion**: OpCache or PHP worker runs out of file descriptors. Symptom: "Too many open files" errors. Mitigation: Increase ulimit -n in systemd service file.
- [ ] **PHP version lifecycle**: Always run a supported PHP version (currently 8.1+). Each minor version brings 5-15% performance improvement. Upgrade within 3 months of release.
- [ ] **Configuration audit**: Check memory_limit, max_execution_time, max_input_vars, ealpath_cache_size are tuned for your application. Defaults are conservative.
- [ ] **Error handling**: display_errors=Off, log_errors=On, error_reporting=E_ALL. Never show errors to users.

# Testing Checklist (from 04/06)
- [ ] I/O profile measured (average wait time per database/HTTP call)
- [ ] Concurrency model matched to I/O profile
- [ ] If using async: all I/O operations are non-blocking or auto-hooked
- [ ] Kernel version checked for io_uring compatibility (if applicable)
- [ ] Benchmark confirms async benefit before production deployment
- [ ] Error handling verified for async context
- [ ] I/O profile accurately measured and documented
- [ ] Async vs sync decision justified by data
- [ ] If migrating to async: 24-hour soak test passed
- [ ] If staying synchronous: I/O wait time confirmed <20% of wall time
- [ ] Throughput improvement from async migration (if applicable) meets projections
- [ ] I/O wait time measured as percentage of wall time
- [ ] I/O wait broken down by dependency type
- [ ] If I/O wait >20%, async runtime evaluated
- [ ] Candidate async runtime benchmarked against synchronous baseline
- [ ] Decision documented with data
- [ ] Team trained on async programming patterns if migrating

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Match concurrency model to I/O profile**: Async benefit is proportional to I/O wait time. Measure I/O wait before adopting async.
- [ ] **Profile before committing**: With sub-1ms database queries, async overhead (coroutine scheduling, event loop) can make Swoole 10% slower than FPM.
- [ ] **Use io_uring for maximum throughput**: With 50ms+ database queries, async yields 2-5x throughput improvements over synchronous FPM.
- [ ] **Understand auto-hooking**: Swoole automatically hooks PDO, MySQLi, Redis, and cURL â€” most PHP code runs without modification.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Using async for CPU-bound work
- [ ] Avoid: Expecting async gains with fast queries
- [ ] Avoid: Blocking in coroutines
- [ ] Avoid: Ignoring io_uring compatibility
- [ ] Avoid anti-pattern: **Using synchronous I/O everywhere**: For high-concurrency I/O-heavy workloads, synchronous FPM wastes resources. Use async runtimes for these workloads.
- [ ] Avoid anti-pattern: **Assuming async is always faster**: Async has overhead (event loop, coroutine scheduling). It only pays off when I/O wait exceeds this overhead.
- [ ] Avoid anti-pattern: **Blocking in async context**: Calling sleep(), file_get_contents() (without stream wrappers), or other blocking operations inside a coroutine defeats the purpose.
- [ ] Guard against anti-pattern: Applying Async Everywhere Without I/O Profile Analysis
- [ ] Guard against anti-pattern: Blocking the Event Loop in Async Contexts
- [ ] Guard against anti-pattern: Using Async for CPU-Bound Workloads
- [ ] Guard against anti-pattern: Expecting Async Gains with Sub-Millisecond I/O
- [ ] Guard against anti-pattern: Ignoring io_uring Kernel Compatibility
- [ ] I/O wait time measured per operation type
- [ ] Sync vs async benchmark performed before deciding

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
**Core Concepts:** **Synchronous I/O**: Process issues call -> kernel suspends process -> I/O completes -> process resumes. Simple but wastes CPU cycles during wait., **Asynchronous I/O**: Process issues call -> kernel returns immediately -> process polls or uses event notification (epoll/kqueue/io_uring) for completion. Complex but maximizes CPU utilization during I/O., **PHP-FPM is synchronous**: Each worker blocks during I/O. More workers needed to maintain throughput during slow I/O., **Swoole coroutines auto-hook**: Synchronous PHP functions (PDO, MySQLi, Redis, cURL) become non-blocking transparently via coroutine scheduling., **io_uring** (Swoole 6.2+): Linux kernel interface for true async I/O with submission/completion queues, reducing syscall overhead.
**Skills:** Concurrency Model Selection, Runtime Comparison Overview, Swoole Architecture and Coroutine Model
**Decision Trees:** Synchronous vs asynchronous I/O model, Whether to use io_uring
**Anti-Patterns:** Applying Async Everywhere Without I/O Profile Analysis, Blocking the Event Loop in Async Contexts, Using Async for CPU-Bound Workloads, Expecting Async Gains with Sub-Millisecond I/O, Ignoring io_uring Kernel Compatibility
**Related Topics:** Concurrency Models, Swoole Architecture and Coroutine Model, Sync vs Async PHP Runtimes, Programming Concepts

