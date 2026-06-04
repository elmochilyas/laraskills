# Domain Analysis: Performance & Runtime Engineering

## Domain Overview

Performance & Runtime Engineering for PHP encompasses the systematic optimization of PHP application execution across the entire technology stack — from language-level engine features (JIT, OpCache, garbage collection) through process management (PHP-FPM, worker pools) to alternative application runtimes (Swoole, RoadRunner, FrankenPHP). The domain intersects systems engineering, compiler design, memory management, observability, and capacity planning. Its goal is maximizing throughput, minimizing latency, and ensuring resource efficiency under production workloads.

PHP 8.x represents the most performant era of the language (30-year history), with cumulative throughput gains of 48.6% over PHP 7.4 in real-world benchmarks. However, the performance landscape has fragmented: traditional PHP-FPM remains the default for 80%+ of deployments, while Laravel Octane and alternative runtimes now serve high-throughput API/microservice workloads with 3-15x throughput improvements. The critical industry insight is that **bottleneck location dictates optimization strategy** — CPU-bound workloads benefit from JIT (+80-95%), I/O-bound workloads require application server changes (coroutines, persistent workers), and memory-bound scenarios demand OpCache tuning and garbage collector management.

This domain is rapidly evolving. PHP 8.5 (late 2025) introduced the pipe operator and JIT refinements. FrankenPHP (v1.7+) continues to mature. Swoole 6.2 added io_uring support. The operational complexity spectrum spans from zero-config OpCache enablement to multi-worker coroutine runtime tuning with custom SAPI implementations.

---

## Domain Scope

### Belongs in Scope

- PHP engine version performance characteristics (8.0 through 8.5+)
- JIT compilation: modes (tracing, function), CRTO bitmask configuration, buffer sizing, hot-path thresholds
- OpCache: memory consumption, interned strings buffer, max accelerated files, preloading, inheritance cache
- PHP memory management: zval internals, reference counting, copy-on-write, cyclic garbage collector, persistent vs per-request allocators
- PHP-FPM: process manager modes (static, dynamic, ondemand), pool sizing (pm.max_children), worker recycling (pm.max_requests), request timeout management, slow log analysis
- Alternative runtimes: Swoole, RoadRunner, FrankenPHP, ReactPHP, AMPHP, OpenSwoole, Workerman
- Laravel Octane: driver selection (FrankenPHP, Swoole, RoadRunner), worker configuration, state management, service provider optimization
- Application servers: PHP-FPM + Nginx/Apache vs memory-resident architectures
- Profiling tools: Blackfire, Tideways, Xdebug, XHProf, SPX, Excimer, eBPF-based profilers
- Performance benchmarking: tools (wrk/wrk2, Apache Bench, k6, Vegeta), methodology (warm-up, sample size, coordinated omission), metrics (RPS, p50/p95/p99 latency, memory)
- Worker management: process supervision (Supervisor), health checks, graceful reloads, zero-downtime deployment
- Performance monitoring: APM integration (New Relic, Datadog), continuous profiling, SLO-based alerting

### Does Not Belong in Scope

- General database optimization (indexing, query tuning) — except where it intersects PHP-FPM pool connection management
- Frontend performance (LCP, CLS, INP, JS bundle optimization) — belongs to Web Performance domain
- CDN and edge caching configuration — belongs to Infrastructure/Delivery domain
- Application-level caching strategies (Redis/Memcached key design) — belongs to Caching domain
- HTTP server tuning beyond PHP interaction (Nginx worker_connections, Apache MPM) — belongs to Web Server domain
- OS kernel tuning (TCP stack, file descriptors, scheduler) — except for ulimit/FPM interaction
- Security hardening (except where performance-security tradeoffs exist, e.g., validate_timestamps=0)
- CI/CD pipeline design (except deployment-related cache invalidation)
- API design patterns (GraphQL, REST) — belongs to Application Architecture domain
- General code quality and algorithmic optimization beyond profiling-driven insights

---

## Major Subdomains

### S1: PHP Engine Performance & Version Migration
- PHP version performance deltas (7.4→8.0→8.1→8.2→8.3→8.4→8.5)
- Engine-level optimizations: Zend Engine improvements, opcode reduction, type specialization
- Language features with performance implications (readonly classes, typed constants, property hooks, fibers, lazy objects)
- Security support timelines and migration planning
- Version-specific regression awareness (e.g., PHP 8.4 5.2% regression under light I/O)

### S2: JIT Compilation
- JIT modes: tracing (1254), function (1205), on (1235), disable (0)
- CRTO bitmask: CPU optimization (C), Register allocation (R), Trigger type (T), Optimization level (O)
- JIT buffer sizing (64MB-256M), hot-path thresholds (jit_hot_loop, jit_hot_func)
- Workload-dependent benefit profiles (0-5% for I/O-bound, 61-95% for CPU-bound)
- JIT + OpCache integration, DynASM framework, compilation strategies in PHP 8.4+
- Memory overhead in long-running processes, ARM64 stability (PHP 8.4+)

### S3: OpCache Configuration & Preloading
- Memory sizing: opcache.memory_consumption (128MB-512MB), interned_strings_buffer (16MB-64MB)
- File management: max_accelerated_files (10000-100000+), hash table prime number rounding
- Production hardening: validate_timestamps=0, revalidate_freq interaction
- Preloading: opcache.preload script design, preload_user, cold-start latency reduction
- Inheritance cache (PHP 8.1+): class hierarchy resolution optimization
- File cache: file_cache_read_only (PHP 8.5+), container cold-start mitigation
- Monitoring: cache_full detection, hit rate analysis, OOM/hash restarts, waste management
- Deployment integration: opcache_reset(), opcache_invalidate(), PHP-FPM graceful reload

### S4: PHP Memory Management & Garbage Collection
- zval structure: refcount, is_ref, type_info, value representation for scalar/compound types
- Copy-on-Write: sharing semantics, separation triggers, by-reference implications
- Reference counting: zend_refcounted_h, GC_ADDREF/GC_DELREF, TRY variants for immutable values
- Cyclic garbage collector: Bacon-Rajan algorithm, root buffer (10,000 default), mark-grey/scan/scan-black phases
- GC tuning: gc_threshold dynamic adjustment, gc_enable/gc_disable, gc_collect_cycles()
- Memory leak patterns: circular references, growing static collections, closure accumulation
- Persistent vs per-request allocators, GC_IMMUTABLE/GC_PERSISTENT flags
- WeakReference API for cycle prevention
- Memory profiling: gc_status(), memory_get_usage(), memory_get_peak_usage()

### S5: PHP-FPM Process & Worker Management
- Process manager modes: static (fixed pool), dynamic (min/max spare), ondemand (zero-idle)
- Pool sizing: pm.max_children calculation (available RAM / average worker RSS), P95-based safety margins
- Worker lifecycle: pm.start_servers, pm.min_spare_servers, pm.max_spare_servers, pm.max_requests
- Request management: request_terminate_timeout, request_slowlog_timeout, slow log analysis
- Connection handling: listen backlog, listen queue depth, Unix socket vs TCP
- Status page: active processes, max children reached, listen queue monitoring
- Per-pool isolation: multiple pool configurations for multi-tenant environments
- Memory drift detection and prevention through pm.max_requests recycling

### S6: Alternative PHP Runtimes
#### S6a: Swoole / OpenSwoole
- C/C++ PHP extension: coroutine-based event-driven architecture
- One-click coroutineization: automatic hooking of PDO, MySQLi, Redis, cURL
- io_uring support (Swoole 6.2): async I/O with Linux kernel interface
- Coroutine scheduling overhead under light I/O; dramatic advantage under high-latency I/O
- WebSocket, task workers, timer ticks
- OpenSwoole fork: community-maintained alternative, ~16% performance edge over original Swoole in some benchmarks

#### S6b: RoadRunner
- Go-based application server: goroutine scheduler + PHP worker pool via Goridge binary protocol
- 41-111% throughput improvement over PHP-FPM in benchmarks (light I/O, warm state)
- No PHP extension required: standard PHP workers managed by Go process supervisor
- Rich plugin ecosystem: queues, gRPC, WebSocket (Centrifugo), Temporal, metrics
- .rr.yaml configuration: worker pool, max_jobs, allocate_timeout, supervisor memory limits
- Laravel Octane first-class support; battle-tested in enterprise production

#### S6c: FrankenPHP
- Go-based Caddy module: PHP embedded via CGO, custom SAPI implementation
- Worker mode: persistent PHP threads, 3-5x throughput vs PHP-FPM
- Thread pool management: num_threads, max_threads, auto-scaling, max_wait_time
- Thread state machine: Reserved→Booting→Inactive→Ready→Done
- Built-in features: HTTP/3, automatic HTTPS (ACME), 103 Early Hints, hot reload
- Caddyfile configuration: php_server, php directives, worker definitions
- Zend String caching for $_SERVER keys, persistent zend_string allocation
- glibc vs musl performance implications; container memory management (GOMEMLIMIT)
- Max requests thread recycling for memory leak mitigation

### S7: Laravel Octane Performance
- Driver selection matrix: FrankenPHP (simplicity/performance), Swoole (features/raw speed), RoadRunner (stability/enterprise)
- Worker configuration: worker_num, max_request (1000-5000), task_worker_num
- State management: service provider optimization, singleton scoping, static property avoidance
- Service container: deferred providers, pre-resolved bindings
- Connection pooling: database, Redis across workers
- Benchmark ranges: 2.5-3.1x (mixed workloads) to 15-20x (API workloads) over PHP-FPM
- Watcher/hot reload integration for development
- Monitoring: php artisan octane:status, octane:profile-memory

### S8: Performance Benchmarking & Methodology
- Tool selection by layer: protocol load (k6, JMeter, Gatling, Locust), network/edge (wrk, wrk2, Vegeta, hey), browser (Lighthouse)
- Methodology: warm-up phases (30s+), sample size requirements (1k for p95, 10k for p99, 100k for p99.9)
- Coordinated omission: closed-loop (wrk) vs open-loop (wrk2) models
- Metrics: throughput (RPS), latency distribution (p50/p95/p99/max), error rate, memory footprint, CPU utilization
- PHPBench for micro-benchmarks: revs, iterations, warmup, param providers
- CI/CD integration: baseline comparison, threshold-based pass/fail, bencher.dev for continuous benchmarking
- Environment control: dedicated hardware, consistent dataset, network isolation

### S9: PHP Profiling & Observability
- Production profiling tools: Blackfire (triggered, low-overhead, CI assertions), Tideways (always-on APM, sampled traces, alerts), SPX (self-hosted, private environments)
- Development profiling: Xdebug (cachegrind output, KCacheGrind/QCacheGrind visualization, flame graphs)
- Legacy/niche: XHProf (Facebook-originated, production-safe but limited), Excimer (Wikimedia, eBPF-sampling), php-spx (modern UI)
- Callgraph analysis: inclusive vs exclusive time, self vs total memory, call count
- Flame graph interpretation: wide frames = time sinks, tall stacks = deep call chains, p50 vs p95 comparison
- Production guardrails: SLO-driven profiling activation, canary pool isolation, feature-flag gating
- eBPF for system-level profiling: near-zero overhead, CPU sampling, php-fpm PID scoping
- APM integration: New Relic, Datadog, Sentry for end-to-end transaction tracing

### S10: Deployment & Cache Invalidation Strategy
- Zero-downtime deployments with PHP-FPM graceful reload
- OpCache reset strategies: php-fpm restart, opcache_reset() web endpoint, cachetool CLI
- Preloading updates: full PHP-FPM restart requirement
- Blue-green deployment with separate OpCache instances
- Containerized deployment: immutable infrastructure, OpCache file cache for cold-start
- CI/CD pipeline integration: opcache invalidation step, health check verification
- Multi-instance cache coordination in horizontal scaling

---

## Complete Knowledge Inventory

### Foundation Tier (F1: Concepts & Terminology)
1. F1.1 PHP execution lifecycle: parse → compile → execute (opcode pipeline)
2. F1.2 Bytecode vs native code: OpCache stores opcodes, JIT compiles to machine code
3. F1.3 PHP version numbering: minor releases (8.3, 8.4, 8.5), security vs active support
4. F1.4 web server architectures: CGI, FastCGI, PHP-FPM SAPI, embedded SAPI
5. F1.5 Shared-nothing architecture: PHP-FPM's process-per-request model
6. F1.6 Memory-resident architecture: boot-once, handle-many model
7. F1.7 Synchronous vs asynchronous I/O: blocking vs non-blocking operations
8. F1.8 Concurrency models: process-based (FPM), thread-based (FrankenPHP), coroutine-based (Swoole), goroutine-based (RoadRunner)
9. F1.9 Profiling vs monitoring: deterministic snapshots vs continuous aggregation
10. F1.10 Benchmarking vs load testing: throughput capacity vs user-journey simulation

### Foundation Tier (F2: Key Relationships)
11. F2.1 Bottleneck location determines optimization strategy (CPU vs I/O vs memory)
12. F2.2 Framework overhead proportion shrinks as I/O wait grows
13. F2.3 Memory-resident runtimes trade per-worker memory for per-request speed
14. F2.4 OpCache hit rate inversely correlates with CPU load
15. F2.5 JIT benefit correlates with CPU-bound proportion of request lifecycle
16. F2.6 pm.max_children and worker RSS jointly determine server capacity ceiling
17. F2.7 pm.max_requests counteracts memory drift at cost of process spawn overhead
18. F2.8 Preloading reduces cold-start latency at cost of startup time and baseline memory
19. F2.9 Coroutine scheduling adds overhead under zero-I/O conditions
20. F2.10 validate_timestamps=0 trades automatic cache invalidation for throughput

### Foundation Tier (F3: Basic Skills)
21. F3.1 Check PHP version: php -v
22. F3.2 List loaded extensions: php -m
23. F3.3 Verify OpCache status: opcache_get_status()
24. F3.4 Clear OpCache: opcache_reset()
25. F3.5 Check JIT status: php -i | grep jit
26. F3.6 Measure worker RSS: ps --no-headers -o rss -C php-fpm
27. F3.7 Enable PHP-FPM status page: pm.status_path configuration
28. F3.8 Read PHP-FPM slow log: request_slowlog_timeout configuration
29. F3.9 Reload PHP-FPM gracefully: systemctl reload php8.x-fpm
30. F3.10 Basic benchmark with Apache Bench: ab -n 1000 -c 10

### Intermediate Tier (I1: Configuration & Tuning)
31. I1.1 OpCache optimization: memory_consumption, max_accelerated_files, interned_strings_buffer
32. I1.2 JIT optimization: opcache.jit (1255/tracing), jit_buffer_size, hot-path triggers
33. I1.3 CRTO bitmask: CPU opt (0/1), Register (0/1/2), Trigger (0-5), Opt level (0-5)
34. I1.4 PHP-FPM pool sizing: pm.max_children = (total_RAM - reserved) / avg_worker_RSS
35. I1.5 PHP-FPM mode selection: static vs dynamic vs ondemand by traffic pattern
36. I1.6 Worker recycling: pm.max_requests tuning (300-1000 by workload)
37. I1.7 Request timeout management: request_terminate_timeout, max_execution_time, max_input_time
38. I1.8 realpath cache: realpath_cache_size=4096K, realpath_cache_ttl=600
39. I1.9 Composer autoloader optimization: --optimize, --classmap-authoritative
40. I1.10 OPcache preloading script design: opcache_compile_file() vs include, conditional declarations

### Intermediate Tier (I2: Runtime Selection & Operation)
41. I2.1 Swoole installation and configuration: ext-swoole, worker_num, max_request, task_worker_num
42. I2.2 RoadRunner installation: rr binary download, .rr.yaml configuration, Goridge protocol
43. I2.3 FrankenPHP installation: single binary, Caddyfile, php_server directive, worker mode
44. I2.4 Laravel Octane setup: composer require laravel/octane, driver selection, config/octane.php
45. I2.5 Alternative runtime comparison by workload: RoadRunner for high-throughput APIs, Swoole for high-latency I/O, FrankenPHP for simplicity
46. I2.6 Process supervision: Supervisor configuration for PHP-FPM and workers
47. I2.7 Health check endpoint design for persistent workers
48. I2.8 Graceful reload vs restart: zero-downtime worker rotation
49. I2.9 Container memory management: GOMEMLIMIT for FrankenPHP, OOM risk calculation
50. I2.10 Multi-FPM pool isolation: per-tenant pm.max_children budgeting

### Intermediate Tier (I3: Profiling & Diagnosis)
51. I3.1 Xdebug profiling: xdebug.mode=profile, cachegrind output, KCacheGrind visualization
52. I3.2 Blackfire setup: probe installation, agent configuration, triggered profiling
53. I3.3 Tideways setup: extension, daemon, API key, sample rate, tracepoint configuration
54. I3.4 Flame graph generation and interpretation: wide-frame identification, tall-stack analysis
55. I3.5 Inclusive vs exclusive time analysis in call graphs
56. I3.6 GC telemetry: gc_status(), root buffer monitoring, collection frequency
57. I3.7 Memory leak detection: memory_get_usage() checkpoints, gc_collect_cycles() at boundaries
58. I3.8 Slow query identification through profiling tool SQL analysis
59. I3.9 wrk/wrk2 benchmark execution: thread/connection tuning, Lua scripting, HDR histograms
60. I3.10 k6 test scripting: stages, thresholds, checks, custom metrics

### Intermediate Tier (I4: Garbage Collection & Memory)
61. I4.1 Reference counting fundamentals: refcount increment/decrement lifecycle
62. I4.2 Copy-on-Write semantics: sharing until mutation, separation trigger points
63. I4.3 by-reference implications: opt-out of CoW, zend_reference container, unexpected copies
64. I4.4 zval structure: type/value, is_ref, refcount for scalar vs compound types
65. I4.5 Circular reference formation: parent-child back-pointers, event listener accumulation
66. I4.6 Cyclic GC algorithm: root buffer, mark-grey (decrement), scan (evaluate), sweep (free)
67. I4.7 gc_collect_cycles() strategic calling: batch boundaries, not per-iteration
68. I4.8 gc_enable/gc_disable: time-sensitive code sections, gc_status() pre/post disable
69. I4.9 WeakReference API: cycle prevention through weak back-references
70. I4.10 Persistent vs per-request allocation: GC_IMMUTABLE, interned strings, shared memory integration

### Advanced Tier (A1: Deep JIT & OpCache Internals)
71. A1.1 DynASM framework: IR construction, register allocation, native code generation
72. A1.2 Tracing JIT region identification: hot-path detection heuristics, loop analysis
73. A1.3 Type inference in JIT: typed property optimization, guard elimination
74. A1.4 JIT integration with OpCache: opcode transition optimization, compilation caching
75. A1.5 JIT memory layout: buffer allocation, code segment reuse, fragmentation management
76. A1.6 OpCache inheritance cache: class hierarchy pre-resolution, method table caching
77. A1.7 OpCache file cache: shared file-backed storage, read-only mode (PHP 8.5+)
78. A1.8 OpCache optimization level bitmask: safe vs unsafe optimization passes
79. A1.9 JIT compilation for long-running processes: persistent code caching, compilation latency amortization
80. A1.10 FFI optimization through JIT: reduced syscall overhead, better caching

### Advanced Tier (A2: Zend Engine & SAPI Internals)
81. A2.1 Zend Engine opcode pipeline: lexer → parser → compiler → executor
82. A2.2 Custom SAPI implementation: SG(server_context), php_module_startup(), php_request_startup()
83. A2.3 ZTS (Zend Thread Safety): TSRM, thread-local globals, resource isolation
84. A2.4 Zend Memory Manager: per-request heap, persistent allocations, chunked allocator
85. A2.5 CGO bridge design: Go↔PHP memory pinning, callback dispatch, thread index routing
86. A2.6 FrankenPHP SAPI: frankenphp_sapi_module, worker request startup/shutdown lifecycle
87. A2.7 Zend string caching: persistent zend_string for $_SERVER keys, interned string deduplication
88. A2.8 runtime.Pinner: Go GC interaction with C/PHP stable pointer requirements
89. A2.9 Thread state machine: Reserved→Booting→Inactive→TransitionRequested→Ready→Done
90. A2.10 php_static_analysis and extension loading in embedded contexts

### Enterprise Tier (E1: Production Architecture)
91. E1.1 Capacity planning: pm.max_children × P95 RSS × safety factor (1.2-1.5) ≤ available RAM
92. E1.2 P95-based sizing vs average-based sizing: avoiding OOM under peak variance
93. E1.3 CPU-bound vs I/O-bound worker ratio: 2-4/core (CPU-bound) vs 8-12/core (I/O-bound)
94. E1.4 Database connection budgeting: pm.max_children must not exceed DB max_connections
95. E1.5 Horizontal scaling: load balancer configuration, sticky sessions vs stateless design
96. E1.6 Zero-downtime deployment: PHP-FPM graceful reload, OpCache pre-warming, health check sequencing
97. E1.7 Blue-green deployment: separate OpCache instances, traffic drain, atomic cutover
98. E1.8 Container resource limits: dockerd --memory, Kubernetes resource.requests/limits, OOM safety calculation
99. E1.9 Multi-region deployment: latency budgets, database replication lag, cache coherence
100. E1.10 Autoscaling: CPU-based (OpCache warm), request-based (SQS queue depth), scheduled (traffic patterns)

### Enterprise Tier (E2: Observability & SRE)
101. E2.1 SLO definition: endpoint-specific p50/p95/p99 targets derived from user experience requirements
102. E2.2 Error budget calculation: SLO attainment vs burn rate, deployment gating
103. E2.3 Continuous profiling strategy: baseline sampling (1-5Hz), burst sampling (50-100Hz on SLO breach)
104. E2.4 Profiling cost management: canary-only profiling, feature-flag gating, health check exclusion
105. E2.5 APM integration: trace sampling rate (10-20%), transaction grouping, percentile calculation
106. E2.6 Alert design: response time thresholds, failure rate thresholds, release comparison, slow SQL detection
107. E2.7 Performance regression detection: CI baseline comparison, threshold-based pass/fail, bencher.dev integration
108. E2.8 Flame graph SLO-driven analysis: p50 vs p95 comparison, cache hit vs miss paths, N+1 identification
109. E2.9 Capacity forecasting: request growth modeling, worker scaling calculations, hardware upgrade planning
110. E2.10 Cost-performance optimization: right-sizing analysis, reservation vs on-demand, Graviton/ARM64 price-performance

### Enterprise Tier (E3: Migration & Transformation)
111. E3.1 PHP version migration planning: dependency compatibility audit, deprecation remediation, benchmark baseline capture
112. E3.2 PHP 7.4→8.x migration: JIT evaluation, OpCache reconfiguration, preloading implementation
113. E3.3 FPM→Octane migration: service provider audit, static property elimination, singleton scoping, state leak testing
114. E3.4 Legacy compatibility: extensions not supporting ZTS, global state patterns, third-party library audit
115. E3.5 Runtime migration: FrankenPHP→RoadRunner or vice versa, configuration translation, benchmark comparison
116. E3.6 Shared hosting→VPS migration: OpCache enablement, PHP-FPM tuning, resource isolation
117. E3.7 Monolith→microservice runtime split: per-service runtime selection based on workload profile
118. E3.8 Containerization strategy: image size optimization, OpCache pre-warming, startup probe design
119. E3.9 Deployment automation: CI/CD pipeline integration, OpCache invalidation step, canary analysis
120. E3.10 Rollback planning: stateful service rollback (Octane), OpCache version mismatch handling

---

## Knowledge Classification

### By Criticality (Production Impact)

| Level | Knowledge Items | Description |
|-------|----------------|-------------|
| **Critical** (must know) | F1.1-F1.10, F2.1-F2.10, F3.1-F3.10, I1.1-I1.10, I2.1, I4.1-I4.8, E1.1-E1.4, E2.1-E2.2 | Directly prevents outages, OOM, 502 errors, or catastrophic performance degradation |
| **Important** (should know) | I2.2-I2.10, I3.1-I3.10, E1.5-E1.10, E2.3-E2.10 | Enables performance optimization, cost reduction, and operational excellence |
| **Specialist** (deep expertise) | A1.1-A1.10, A2.1-A2.10, E3.1-E3.10, I4.9-I4.10 | Required for internal tooling, custom SAPI work, large-scale migration, or extreme optimization |

### By Learning Curve

| Level | Items | Estimated Time |
|-------|-------|----------------|
| **Quick wins** (15 min to apply) | F3.1-F3.10, I1.1-I1.4, I1.7, I1.8, I1.10 | Minutes to hours |
| **Standard tuning** (hours to master) | I1.5-I1.6, I1.9, I2.1-I2.5, I3.1-I3.6, I4.1-I4.5 | Days to weeks |
| **Deep optimization** (weeks to internalize) | I3.7-I3.10, I4.6-I4.10, A1.1-A1.6, E1.1-E1.5 | Weeks to months |
| **Expertise** (months of practice) | A1.7-A1.10, A2.1-A2.10, E1.6-E1.10, E2.1-E2.10, E3.1-E3.10 | Months to years |

### Adoption Maturity

| Maturity Level | Knowledge | Adoption Rate |
|----------------|-----------|---------------|
| **Standard practice** | OpCache enablement, PHP version upgrades, basic PHP-FPM tuning | >80% of production PHP deployments |
| **Common** | JIT enablement, Laravel Octane, Composer optimization, preloading | 30-60% |
| **Emerging** | FrankenPHP adoption, eBPF profiling, continuous profiling in CI | 5-20% |
| **Leading edge** | Custom SAPI development, SLO-driven adaptive profiling, io_uring with Swoole | <5% |

---

## Dependency Map

### Internal Domain Dependencies

```
PHP Engine (S1)
  ├── JIT Compilation (S2)         → requires S1 (OpCache must be enabled)
  ├── OpCache (S3)                 → requires S1 (Zend Engine extension)
  └── Memory Management (S4)       → requires S1 (zval implementation)

PHP-FPM (S5)
  ├── OpCache (S3)                 → S5 shares OpCache memory across pool
  └── Memory Management (S4)       → per-request allocator lifecycle tied to worker

Alternative Runtimes (S6)
  ├── S6a Swoole:                  → PHP extension (S1), coroutine hooks into PDO/MySQLi
  ├── S6b RoadRunner:              → external Go binary, communicates via pipes (PHP S1)
  └── S6c FrankenPHP:             → CGO-embedded PHP (S1), custom SAPI, depends on ZTS compilation

Laravel Octane (S7)
  ├── S6a/b/c:                     → Octane abstracts driver (Swoole/RR/FrankenPHP)
  └── S4 Memory Management:        → state leak prevention, static property management

Benchmarking (S8)
  ├── S1 (engine perf deltas)
  ├── S5 (FPM throughput)
  └── S6 (runtime comparison)

Profiling (S9)
  ├── All subdomains:              → profilers must understand all layers
  └── S4 (memory profiling)

Deployment (S10)
  ├── S3 (OpCache invalidation)
  ├── S5 (FPM graceful reload)
  └── S6 (worker health check)
```

### External Domain Dependencies

| Dependency | External Domain | Explanation |
|------------|----------------|-------------|
| InnoDB buffer pool, query execution plans | Database Engineering | FPM max_children must respect DB max_connections; slow queries are primary source of FPM pool exhaustion |
| TLS termination, HTTP/2 multiplexing | Web Server Engineering | Connection handling affects PHP-FPM listen queue; Nginx proxy_buffering affects Octane response streaming |
| Container resource limits, kernel tuning | Infrastructure Engineering | OOM kills from mis-sized FPM pools; ulimit for file descriptors; cgroup CPU/memory isolation |
| CMS/plugin architecture | Application Architecture | WordPress plugin memory leaks drive pm.max_requests; Drupal preloading patterns differ from Laravel |
| CDN cache hit ratio | Delivery Engineering | Reduces origin load, changing FPM sizing requirements; cache invalidation timing affects cold-start patterns |
| Queue worker concurrency | Message Queue Engineering | Background worker FPM config differs from web; Supervisor manages both process types |

---

## Missing Knowledge Risk Analysis

| Gap | Risk Level | Impact | Mitigation |
|-----|-----------|--------|------------|
| **PHP 8.6 performance characteristics** (unreleased) | Medium | May require retuning if engine regressions appear (cf. PHP 8.4 5.2% regression) | Monitor PHP internals mailing list; benchmark betas in staging |
| **Real-world FrankenPHP at scale** (multi-tenant, 1000+ concurrent) | Medium | Thread scheduling under extreme load not fully characterized | Follow PHPBenchLab and FrankenPHP GitHub issues; run own soak tests |
| **eBPF-based PHP profiling ecosystem** (rapidly evolving) | Medium | Tooling landscape in flux; best practices not yet standardized | Track Pyroscope, Parca, and OTel eBPF developments |
| **Swoole 6.x + io_uring production profiles** | Low-Medium | Mainly Linux 5.19+; not yet widely deployed | Monitor Swoole changelog; test on compatible kernels |
| **ARM64-specific PHP JIT behavior** | Low-Medium | PHP 8.4 fixed stability issues but perf delta vs x86_64 needs more data | Run ARM64 benchmarks; monitor Graviton/Optimized instances |
| **PHP memory leak patterns in long-running workers** (comprehensive catalog) | Low | Understanding is fragmented across community experience | Compile internal runbook from real incidents |
| **Integration of Octane with complex third-party packages** | Low | Most Laravel packages not designed for persistent workers | Maintain compatibility matrix; contribute to package ecosystem |
| **Multi-architecture opcache file cache behavior** | Low | File cache format may differ across PHP minor versions | Test across all target architectures in CI |

---

## Research Findings

### Recurring Recommendations (Across All Sources)

1. **Enable OpCache first** — Provides the highest ROI with zero code changes. Single most impactful optimization. Ensures >99% hit rate with proper memory sizing.

2. **Disable timestamp validation in production** (`opcache.validate_timestamps=0`) — Eliminates stat() syscall overhead per file per request. Requires PHP-FPM restart or opcache_reset() after deployments.

3. **Calculate pm.max_children from measured P95 worker RSS, not averages** — Average-based sizing fails under peak variance. Formula: (total_RAM - reserved) / (P95_RSS × 1.2 safety factor).

4. **Set pm.max_requests to 500-1000** — Prevents memory fragmentation growth from doubling worker RSS over 12+ hours. Zero is never appropriate in production.

5. **Benchmark with realistic workloads** — Hello World benchmarks mislead. Real application profiles with database queries, template rendering, and caching layers reveal different bottlenecks.

6. **JIT is not a universal accelerator** — Workload-dependent: 61-95% gains for CPU-bound, 0-5% for I/O-bound. Always benchmark before enabling in production. Enable on all servers anyway (harmless at worst, beneficial for cron/queue tasks).

7. **OpCache preloading benefits fast APIs (<100ms) most** — For slow apps (1s+ response), the 10-16ms autoloading savings yield <1% improvement. For high-throughput APIs at ~20ms, it's a 10% gain.

8. **RoadRunner dominates for high-throughput APIs** — 41-111% throughput improvement over PHP-FPM in benchmarks. Go goroutine scheduler efficient even with minimal I/O. Best all-around application server for Laravel Octane.

9. **FrankenPHP excels at operational simplicity** — Single binary replacing Nginx + PHP-FPM + certbot. Best for containerized deployments, memory-constrained environments, and teams wanting minimal infrastructure complexity.

10. **Swoole only outperforms alternatives under high-latency I/O** — Coroutine advantage requires meaningful blocking time. With sub-1ms queries, coroutine scheduling overhead makes Swoole slower than FPM.

11. **Prefer profiling over guessing** — Xdebug (local), Blackfire (on-demand production), Tideways (continuous APM). "Don't guess, measure" is the universal recommendation.

12. **Monitor the FPM status page** — listen_queue > 0 is the earliest indicator of pool saturation. Active processes = max_children means imminent 502 errors.

### Common Patterns

**Pattern 1: Bootstrap Dominance** — Framework bootstrap time dominates fast requests. For API endpoints returning in <50ms, bootstrap can account for 60-80% of total time. Fix: Octane/persistent workers.

**Pattern 2: Memory Drift** — FPM workers start at ~65MB RSS and grow to ~120MB over 12h due to PHP memory fragmentation. Fix: pm.max_requests = 500.

**Pattern 3: OpCache Thrashing** — Under-provisioned memory_consumption or max_accelerated_files causes cache eviction and recompilation. Fix: monitor cache_full and hit rate; size for all files + 20% headroom.

**Pattern 4: JIT Compilation Overhead** — CPU cycles spent analyzing and compiling hot code become net-negative when I/O wait dominates. At 200ms DB latency, JIT provides 0% benefit and 0-2% overhead.

**Pattern 5: Cold-Start Latency Cascade** — PHP-FPM restart → OpCache empty → first N requests slow → workers pile up → listen queue grows → 502 errors. Fix: preloading + warm-up requests.

**Pattern 6: Concurrent Connection Budgeting** — FPM max_children × DB connections per request must not exceed database max_connections. At 40 workers with 2 connections each = 80 DB connections needed.

### Known Trade-offs

| Decision | Pro | Con |
|----------|-----|-----|
| validate_timestamps=0 | Eliminates stat() per file per request; 1-3% throughput gain | Requires explicit cache invalidation on deploy; risk of stale code serving |
| pm=static | Zero spawn latency; predictable memory | Full memory cost always paid; no adaptation to traffic changes |
| pm=dynamic | Adapts to varying traffic; memory-efficient at low load | Spawn latency during traffic spikes; tuning complexity |
| Preloading all classes | Eliminates autoloading entirely; faster first request | Higher baseline memory; PHP-FPM may fail to start if errors exist |
| Octane with Swoole | Highest raw throughput; coroutines for concurrency | PHP extension dependency; async compatibility issues with some libraries |
| Octane with FrankenPHP | Single binary; HTTP/3; automatic HTTPS | Newer, less battle-tested; thread pool tuning needed |
| Octane with RoadRunner | Best all-around performance; no PHP extension; enterprise features | More complex config; Go binary dependency in deployment |
| JIT enabled universally | Helps cron/queue/background tasks; future-proofing | 128MB+ RAM committed to buffer; slight overhead on I/O-bound paths |
| Low max_requests (100-200) | Aggressive memory leak protection | High worker spawn overhead; CPU wasted on constant recycling |
| High max_requests (5000+) | Minimal recycling overhead | Memory leak risk accumulates; worker RSS may drift significantly |

### Common Misconceptions

1. **"JIT makes PHP as fast as C"** — JIT provides dramatic gains for CPU-bound code (up to 95%) but I/O-bound web apps see <5% improvement. PHP remains an interpreted script language for most real-world workloads.

2. **"More FPM workers = more throughput"** — Over-provisioning workers causes OOM kills and swap thrashing. Past the optimal point, more workers degrades performance. Right-size, don't over-size.

3. **"Octane is a drop-in replacement for FPM"** — Octane requires service provider auditing, static property management, and state leak prevention. Many packages are not Octane-compatible without modification.

4. **"Apache Bench is sufficient for benchmarking"** — ab is single-threaded, closed-loop, and cannot simulate realistic user journeys. Use wrk2 (open-loop) for tail latency, k6 for user-journey load testing.

5. **"OpCache is just 'on or off'"** — OpCache has 15+ tunable parameters. Defaults are designed for compatibility, not performance. Proper tuning yields 2-4x throughput vs default configuration.

6. **"Swoole is always the fastest runtime"** — Swoole only excels under high-latency I/O. With fast queries (<1ms), RoadRunner (2.1x vs FPM) outperforms Swoole (0.9x vs FPM).

7. **"Xdebug can be used in production"** — Xdebug profiler adds significant overhead (50-200% slowdown). Never enable in production. Use Blackfire or Tideways for production profiling.

8. **"PHP version upgrade is the biggest performance lever"** — While meaningful (48.6% cumulative from 7.4→8.3), proper OpCache tuning (2-4x) and runtime upgrades (3-15x) dwarf version gains.

9. **"Preloading always helps"** — Preloading benefits fast APIs (<100ms) significantly but yields <1% improvement for apps with 1s+ response times. Measure autoloading cost before implementing.

10. **"GC should always be enabled"** — Cycle collection is a stop-the-world pause. For time-sensitive code, gc_disable() during critical sections with gc_collect_cycles() at boundaries is the correct pattern.

---

## Future Expansion Opportunities

1. **PHP 8.6/8.5+ Performance Characterization** — Early benchmarks expected late 2026. May include SIMD optimizations, predictive inlining, further JIT+GC integration improvements.

2. **eBPF-based Continuous Profiling Maturation** — Tools like Pyroscope and Parca are converging on open standards. PHP-specific symbol resolution, USDT probes, and adaptive sampling rates are active development areas.

3. **Swoole 6.x io_uring Production Patterns** — Linux kernel io_uring interface enables true async I/O. Production deployment patterns, monitoring, and compatibility matrices need documentation.

4. **FrankenPHP Multi-Tenant/Cluster Architectures** — As adoption grows, patterns for shared hosting, worker isolation, and cluster-wide OpCache coordination will emerge.

5. **AI/ML Workloads on PHP** — PHP 8.4+ JIT improvements make PHP viable for inference workloads. FFI integration with ONNX Runtime, TensorFlow, and other ML frameworks is an emerging subdomain.

6. **WebAssembly PHP Runtimes** — PHP compiled to WebAssembly (via emscripten) for edge computing. Performance characteristics and deployment patterns are nascent.

7. **Serverless PHP Optimization** — Cold-start optimization for AWS Lambda (custom runtimes), Vercel, and similar platforms. OpCache file cache, preloading, and minimal boot sequences.

8. **ARM64/NVIDIA Grace Optimization** — Graviton and Grace CPU architectures have different cache hierarchies and memory bandwidth. PHP JIT and OpCache tuning patterns for ARM64 are under-documented.

9. **Observability-Driven Adaptive Runtime** — Future systems may auto-tune OpCache, JIT, and FPM settings based on real-time telemetry. Machine learning-driven pool sizing and cache configuration.

10. **Cross-Language Runtime Comparison** — Formal benchmarking frameworks comparing PHP (JIT+Octane) vs Go, Node.js, Java (GraalVM), and Rust for equivalent workloads. PHP's competitive positioning in a multi-runtime architecture.

---

## Sources Consulted

### Tier 1: Primary Research & Benchmarks
1. PHPBenchLab — Swoole vs RoadRunner vs FrankenPHP (2026-04)
2. PHPBenchLab — PHP 8.5 JIT I/O Latency Benchmark (2026-05)
3. PHPBenchLab — PHP 8.3 vs 8.4 vs 8.5 Real-World Benchmark (2026-02)
4. PHPBenchLab — PHP 8.5 Application Server Showdown (2026-04)
5. PHPBenchLab — PHP 8.5 JIT in the Real World (2026-03)
6. Tideways — PHP Benchmarks: 8.4 Performance (2025-05)
7. Deploynix — PHP-FPM vs Laravel Octane Benchmarks (2026-04)
8. Richard Joseph Porter — Laravel Octane Sub-50ms Response Times (2026-01)
9. mochavin/fpm-vs-swoole-vs-franken — Laravel 12 Docker Benchmark (2026-02)
10. toadbeatz/PHP-Runtime-Benchmark — Multi-runtime HTTP Server Comparison (2026-02)

### Tier 2: Official Documentation & Reference
11. PHP Manual — OPcache Runtime Configuration
12. PHP Manual — Reference Counting Basics
13. PHP Manual — Collecting Cycles / Performance Considerations
14. PHP Internals Book — Memory Management / Zvals
15. php-src — ext/opcache/jit/README.md
16. php-src — Zend/zend_gc.c
17. php.github.io — Reference Counting Internals
18. FrankenPHP Documentation — Performance Configuration
19. FrankenPHP DeepWiki — Architecture Overview / PHP Runtime Embedding / Request Pipeline
20. Laravel Octane Documentation

### Tier 3: Expert Analysis & Community
21. phparch.com — FrankenPHP Worker Mode (2026-01)
22. php.watch — JIT in Depth
23. dev.to — PHP-FPM Tuning Cheat Sheet: 5 Settings That Decide Your p99 (2026-05)
24. dev.to — Your pm.max_children Math Is Wrong (2026-03)
25. medium.com — PHP 8.4 JIT Under the Microscope (2025-11)
26. medium.com — JIT Compilation in PHP 8.4 (2025-01)
27. tideways.com — Fine-Tune OPcache Configuration (2026-03)
28. tideways.com — Should You Use OPcache Preloading (2025-07)
29. tideways.com — The 6 Best PHP Profilers (2025-02)
30. blackfire.io — Mastering OPcache Optimization (2024-07)

### Tier 4: Practitioner Guides & Industry
31. hosted.cloud — PHP 8.3+ Performance Gains (2026-03)
32. voxfor.com — Configure OPcache for Maximum Performance (2026-02)
33. devproportal.com — Mastering PHP Configuration for Production (2025-11)
34. massivgrid.com — PHP Version Performance Upgrade (2026-03)
35. codesoltech.com — PHP 8.x Benchmarks: 3x Faster than 7.4 (2026-03)
36. deploynix.io — OPcache Configuration for Laravel (2026-04)
37. deploynix.io — Tuning PHP-FPM for Laravel (2026-04)
38. deploynix.io — Laravel Octane: FrankenPHP, Swoole & RoadRunner (2026-04)
39. intramweb.com — PHP-FPM Tuning on Linux (2026-03)
40. andej.prus.dev — PHP Profiling: Blackfire, Tideways & SPX (2026-03)
41. andej.prus.dev — PHP Benchmarking 101 (2026-04)
42. your-digital-hub.com — PHP Engines in 2026
43. devproportal.com — Profiling with Xdebug vs Blackfire (2025-12)
44. differ.blog — FrankenPHP vs RoadRunner for Laravel Octane (2026-05)
45. symfony.com — Performance Documentation
46. webhosting.de — PHP OPcache Explained in Depth (2025-12)
47. qaskills.sh — wrk and wrk2 HTTP Benchmarking Complete Guide (2026-05)
48. dev.to — Performance Testing PHP Applications: K6 and Artillery (2026-05)
49. thecodeforge.io — PHP Memory Management Explained (2026-03)
50. linkedin.com — Laravel 12 Performance Face-Off (2025-07)
