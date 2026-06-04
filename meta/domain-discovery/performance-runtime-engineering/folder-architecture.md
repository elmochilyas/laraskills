# Folder Architecture: Performance & Runtime Engineering

## Structure Rationale

The folder architecture follows a **domain-first, complexity-graduated** organization principle. The top-level directories map 1:1 to the major subdomains identified during domain discovery (S1-S10), allowing engineers to navigate by concern rather than tool. Each directory contains three layers of resource depth:

1. **Foundation** (`00-foundation/`) — Concept primers, terminology glossaries, version matrices, and relationship maps for newcomers.
2. **Core** (`10-core/`) — Configuration guides, operational procedures, and standard tuning references for day-to-day work.
3. **Advanced** (`90-advanced/`) — Internals documentation, deep-dive analyses, edge-case investigations for specialists.

Cross-cutting concerns (benchmarking, profiling) are elevated as first-class directories because they span all subdomains and serve as the primary discovery mechanism for all performance work. The `00-assets/` directory holds reusable resources (templates, calculators, reference tables) that multiple subdirectories reference, avoiding duplication.

Knowledge Units (KUs) are stored as individual markdown files with a prefix scheme (`KU-S1-001-brief-descriptive-slug.md`) for sortability and unambiguous reference. Each KU has exactly one canonical location; cross-references use relative path links rather than duplication.

The decision to separate "alternative runtimes" into individual directories (Swoole, RoadRunner, FrankenPHP) rather than keeping them bundled reflects the operational reality that each runtime requires distinct configuration expertise, deployment patterns, and debugging knowledge. They share a parent `06-alternative-runtimes/` for common comparison resources.

---

## Proposed ECC Folder Tree

```
performance-runtime-engineering/
├── README.md
├── _index.md
│
├── S01-php-engine-version-performance/
│   ├── 00-foundation/
│   │   ├── KU-S1-001-php-version-lifecycle-timeline.md
│   │   ├── KU-S1-002-php-execution-pipeline-overview.md
│   │   └── KU-S1-003-version-performance-delta-matrix.md
│   ├── 10-core/
│   │   ├── KU-S1-101-engine-level-optimization-by-version.md
│   │   ├── KU-S1-102-language-features-with-performance-implications.md
│   │   ├── KU-S1-103-version-migration-planning-checklist.md
│   │   └── KU-S1-104-version-regression-catalog.md
│   ├── 90-advanced/
│   │   ├── KU-S1-901-zend-engine-opcode-analysis.md
│   │   ├── KU-S1-902-type-specialization-internals.md
│   │   └── KU-S1-903-fiber-implementation-benchmarks.md
│   └── _assets/
│       ├── php-version-support-calendar.csv
│       └── benchmark-deltas-by-version.json
│
├── S02-jit-compilation/
│   ├── 00-foundation/
│   │   ├── KU-S2-001-jit-concepts-and-terminology.md
│   │   ├── KU-S2-002-jit-mode-comparison-matrix.md
│   │   └── KU-S2-003-crto-bitmask-reference.md
│   ├── 10-core/
│   │   ├── KU-S2-101-jit-configuration-for-production.md
│   │   ├── KU-S2-102-jit-buffer-sizing-guidelines.md
│   │   ├── KU-S2-103-jit-hot-path-threshold-tuning.md
│   │   ├── KU-S2-104-workload-benefit-assessment-flow.md
│   │   └── KU-S2-105-arm64-jit-considerations.md
│   ├── 90-advanced/
│   │   ├── KU-S2-901-dynasm-framework-internals.md
│   │   ├── KU-S2-902-type-inference-and-guard-elimination.md
│   │   ├── KU-S2-903-jit-compilation-for-long-running-processes.md
│   │   ├── KU-S2-904-ffi-optimization-through-jit.md
│   │   └── KU-S2-905-jit-memory-layout-and-fragmentation.md
│   └── _assets/
│       ├── jit-config-templates.ini
│       └── jit-buffer-sizing-calculator.csv
│
├── S03-opcache-configuration/
│   ├── 00-foundation/
│   │   ├── KU-S3-001-opcache-purpose-and-mechanics.md
│   │   ├── KU-S3-002-opcache-configuration-directives-reference.md
│   │   └── KU-S3-003-opcache-lifecycle-and-invalidation.md
│   ├── 10-core/
│   │   ├── KU-S3-101-memory-sizing-for-different-frameworks.md
│   │   ├── KU-S3-102-max-accelerated-files-calculation.md
│   │   ├── KU-S3-103-production-hardening-settings.md
│   │   ├── KU-S3-104-preloading-script-design-patterns.md
│   │   ├── KU-S3-105-opcache-monitoring-and-hit-rate-analysis.md
│   │   └── KU-S3-106-deployment-cache-invalidation-strategies.md
│   ├── 90-advanced/
│   │   ├── KU-S3-901-inheritance-cache-deep-dive.md
│   │   ├── KU-S3-902-opcache-file-cache-and-container-cold-start.md
│   │   ├── KU-S3-903-optimization-level-bitmask-analysis.md
│   │   └── KU-S3-904-opcache-memory-allocator-internals.md
│   └── _assets/
│       ├── opcache-config-templates.ini
│       ├── framework-file-count-reference.csv
│       └── opcache-hit-rate-monitoring-script.sh
│
├── S04-memory-management-gc/
│   ├── 00-foundation/
│   │   ├── KU-S4-001-zval-structure-and-reference-counting.md
│   │   ├── KU-S4-002-copy-on-write-mechanics.md
│   │   └── KU-S4-003-garbage-collector-concepts.md
│   ├── 10-core/
│   │   ├── KU-S4-101-by-reference-implications-and-avoidance.md
│   │   ├── KU-S4-102-circular-reference-detection-and-fix-patterns.md
│   │   ├── KU-S4-103-gc-collect-cycles-strategic-calling.md
│   │   ├── KU-S4-104-weakreference-api-usage.md
│   │   ├── KU-S4-105-memory-leak-pattern-catalog.md
│   │   └── KU-S4-106-memory-profiling-techniques.md
│   ├── 90-advanced/
│   │   ├── KU-S4-901-bacon-rajan-algorithm-implementation.md
│   │   ├── KU-S4-902-root-buffer-dynamics-and-threshold-tuning.md
│   │   ├── KU-S4-903-persistent-vs-per-request-allocators.md
│   │   ├── KU-S4-904-gc-immutable-and-gc-persistent-flags.md
│   │   └── KU-S4-905-zend-memory-manager-chunked-allocator.md
│   └── _assets/
│       ├── gc-status-monitoring-template.php
│       ├── memory-leak-detection-script.php
│       └── zval-size-reference.csv
│
├── S05-php-fpm-worker-management/
│   ├── 00-foundation/
│   │   ├── KU-S5-001-fpm-process-manager-modes-overview.md
│   │   ├── KU-S5-002-pool-sizing-formula-and-rationale.md
│   │   └── KU-S5-003-request-lifecycle-in-fpm.md
│   ├── 10-core/
│   │   ├── KU-S5-101-pm-max-children-calculation-with-p95.md
│   │   ├── KU-S5-102-pm-max-requests-tuning-by-application-type.md
│   │   ├── KU-S5-103-request-timeout-configuration.md
│   │   ├── KU-S5-104-slow-log-configuration-and-analysis.md
│   │   ├── KU-S5-105-fpm-status-page-monitoring.md
│   │   ├── KU-S5-106-multi-pool-isolation-strategies.md
│   │   └── KU-S5-107-cpu-bound-vs-io-bound-worker-ratios.md
│   ├── 90-advanced/
│   │   ├── KU-S5-901-memory-drift-detection-and-mitigation.md
│   │   ├── KU-S5-902-oom-risk-calculation-and-safety-margins.md
│   │   ├── KU-S5-903-fpm-listen-queue-analysis.md
│   │   └── KU-S5-904-zero-downtime-fpm-reload-mechanics.md
│   └── _assets/
│       ├── fpm-pool-config-templates.conf
│       ├── fpm-status-scraping-script.sh
│       └── worker-rss-baseline-tracker.csv
│
├── S06-alternative-runtimes/
│   ├── 00-foundation/
│   │   ├── KU-S6-001-runtime-comparison-overview.md
│   │   ├── KU-S6-002-architecture-model-differences.md
│   │   └── KU-S6-003-runtime-selection-decision-tree.md
│   ├── S06a-swoole/
│   │   ├── 00-foundation/
│   │   │   ├── KU-S6a-001-swoole-architecture-and-coroutine-model.md
│   │   │   └── KU-S6a-002-swoole-vs-openswoole-differences.md
│   │   ├── 10-core/
│   │   │   ├── KU-S6a-101-swoole-installation-and-configuration.md
│   │   │   ├── KU-S6a-102-coroutine-hooks-and-compatibility.md
│   │   │   ├── KU-S6a-103-task-workers-and-timer-ticks.md
│   │   │   ├── KU-S6a-104-websocket-server-setup.md
│   │   │   └── KU-S6a-105-swoole-io-uring-integration.md
│   │   └── 90-advanced/
│   │       ├── KU-S6a-901-coroutine-scheduling-internals.md
│   │       ├── KU-S6a-902-memory-management-in-coroutine-context.md
│   │       └── KU-S6a-903-performance-benchmark-profiles-by-workload.md
│   ├── S06b-roadrunner/
│   │   ├── 00-foundation/
│   │   │   ├── KU-S6b-001-roadrunner-architecture-and-goridge.md
│   │   │   └── KU-S6b-002-roadrunner-ecosystem-overview.md
│   │   ├── 10-core/
│   │   │   ├── KU-S6b-101-roadrunner-installation-and-rr-yaml.md
│   │   │   ├── KU-S6b-102-worker-pool-configuration.md
│   │   │   ├── KU-S6b-103-plugin-integration-grpc-queues-websocket.md
│   │   │   ├── KU-S6b-104-process-supervision-and-recycling.md
│   │   │   └── KU-S6b-105-metrics-and-observability.md
│   │   └── 90-advanced/
│   │       ├── KU-S6b-901-goroutine-scheduler-advantage-analysis.md
│   │       └── KU-S6b-902-roadrunner-fpm-benchmark-deep-dive.md
│   ├── S06c-frankenphp/
│   │   ├── 00-foundation/
│   │   │   ├── KU-S6c-001-frankenphp-architecture-caddy-cgo-sapi.md
│   │   │   └── KU-S6c-002-worker-vs-standard-mode-comparison.md
│   │   ├── 10-core/
│   │   │   ├── KU-S6c-101-frankenphp-installation-and-caddyfile.md
│   │   │   ├── KU-S6c-102-thread-pool-sizing-and-auto-scaling.md
│   │   │   ├── KU-S6c-103-worker-mode-configuration.md
│   │   │   ├── KU-S6c-104-early-hints-and-http3-setup.md
│   │   │   ├── KU-S6c-105-container-deployment-and-gomemlimit.md
│   │   │   └── KU-S6c-106-glibc-vs-musl-performance-implications.md
│   │   ├── 90-advanced/
│   │   │   ├── KU-S6c-901-frankenphp-sapi-internals.md
│   │   │   ├── KU-S6c-902-thread-state-machine-and-lifecycle.md
│   │   │   ├── KU-S6c-903-cgo-bridge-and-memory-pinning.md
│   │   │   ├── KU-S6c-904-zend-string-caching-for-server-variables.md
│   │   │   └── KU-S6c-905-thread-pool-splitting-for-slow-endpoints.md
│   │   └── _assets/
│   │       ├── Caddyfile-templates
│   │       └── frankenphp-docker-compose.yml
│   ├── S06d-reactphp-amphp/
│   │   ├── KU-S6d-001-event-loop-architecture-comparison.md
│   │   ├── KU-S6d-002-use-cases-and-performance-characteristics.md
│   │   └── KU-S6d-003-fiber-based-structured-concurrency-with-amphp.md
│   └── _assets/
│       ├── runtime-benchmark-summary.csv
│       └── runtime-selection-matrix.md
│
├── S07-laravel-octane/
│   ├── 00-foundation/
│   │   ├── KU-S7-001-octane-architecture-and-execution-model.md
│   │   ├── KU-S7-002-driver-comparison-selection-guide.md
│   │   └── KU-S7-003-performance-gain-estimation-methodology.md
│   ├── 10-core/
│   │   ├── KU-S7-101-octane-installation-and-configuration.md
│   │   ├── KU-S7-102-service-provider-optimization-for-persistence.md
│   │   ├── KU-S7-103-state-management-and-leak-prevention.md
│   │   ├── KU-S7-104-connection-pooling-strategies.md
│   │   ├── KU-S7-105-worker-configuration-by-driver.md
│   │   ├── KU-S7-106-deferred-providers-and-pre-resolved-bindings.md
│   │   └── KU-S7-107-monitoring-and-octane-status.md
│   ├── 90-advanced/
│   │   ├── KU-S7-901-octane-service-container-lifecycle.md
│   │   ├── KU-S7-902-concurrent-task-execution-patterns.md
│   │   ├── KU-S7-903-static-property-audit-methodology.md
│   │   └── KU-S7-904-package-compatibility-matrix.md
│   └── _assets/
│       ├── octane-config-templates.php
│       ├── service-provider-audit-checklist.md
│       └── octane-benchmark-data.csv
│
├── S08-benchmarking-methodology/
│   ├── 00-foundation/
│   │   ├── KU-S8-001-benchmarking-concepts-and-terminology.md
│   │   ├── KU-S8-002-tool-selection-by-testing-layer.md
│   │   └── KU-S8-003-metrics-definition-and-interpretation.md
│   ├── 10-core/
│   │   ├── KU-S8-101-wrk-wrk2-usage-and-lua-scripting.md
│   │   ├── KU-S8-102-k6-scripting-thresholds-and-stages.md
│   │   ├── KU-S8-103-ab-hey-and-quick-smoke-tests.md
│   │   ├── KU-S8-104-phpbench-for-micro-benchmarks.md
│   │   ├── KU-S8-105-methodology-warmup-sample-size-environment.md
│   │   ├── KU-S8-106-coordinated-omission-and-open-vs-closed-loop.md
│   │   └── KU-S8-107-ci-integration-and-baseline-comparison.md
│   ├── 90-advanced/
│   │   ├── KU-S8-901-hdr-histogram-analysis.md
│   │   ├── KU-S8-902-statistical-significance-in-benchmarking.md
│   │   ├── KU-S8-903-bencher-and-continuous-benchmarking-platforms.md
│   │   └── KU-S8-904-database-query-benchmarking-integration.md
│   └── _assets/
│       ├── wrk-lua-script-templates
│       ├── k6-test-templates.js
│       └── benchmark-methodology-reference.pdf
│
├── S09-profiling-observability/
│   ├── 00-foundation/
│   │   ├── KU-S9-001-profiling-types-and-tradeoffs.md
│   │   ├── KU-S9-002-tool-comparison-matrix.md
│   │   └── KU-S9-003-production-vs-development-profiling.md
│   ├── 10-core/
│   │   ├── KU-S9-101-xdebug-profiling-setup-and-analysis.md
│   │   ├── KU-S9-102-blackfire-installation-and-triggered-profiling.md
│   │   ├── KU-S9-103-tideways-setup-and-continuous-monitoring.md
│   │   ├── KU-S9-104-spx-self-hosted-profiling.md
│   │   ├── KU-S9-105-callgraph-inclusive-vs-exclusive-time.md
│   │   ├── KU-S9-106-flame-graph-interpretation.md
│   │   └── KU-S9-107-performance-regression-detection.md
│   ├── 90-advanced/
│   │   ├── KU-S9-901-ebpf-php-profiling-with-pyroscope-parca.md
│   │   ├── KU-S9-902-slo-driven-profiling-activation.md
│   │   ├── KU-S9-903-adaptive-sampling-strategies.md
│   │   ├── KU-S9-904-apm-integration-patterns.md
│   │   └── KU-S9-905-profiling-cost-management-at-scale.md
│   └── _assets/
│       ├── blackfire-config-templates.ini
│       ├── tideways-config-samples.ini
│       └── xdebug-profiler-helper.php
│
├── S10-deployment-cache-invalidation/
│   ├── 00-foundation/
│   │   ├── KU-S10-001-deployment-cache-invalidation-landscape.md
│   │   └── KU-S10-002-consistency-models-for-cache-invalidation.md
│   ├── 10-core/
│   │   ├── KU-S10-101-php-fpm-graceful-reload-patterns.md
│   │   ├── KU-S10-102-opcache-reset-strategies.md
│   │   ├── KU-S10-103-preloading-update-procedure.md
│   │   ├── KU-S10-104-blue-green-deployment-with-separate-opcache.md
│   │   ├── KU-S10-105-containerized-deployment-cache-strategies.md
│   │   └── KU-S10-106-ci-cd-pipeline-cache-invalidation-steps.md
│   ├── 90-advanced/
│   │   ├── KU-S10-901-multi-instance-cache-coordination.md
│   │   ├── KU-S10-902-rolling-deployment-opcache-coherence.md
│   │   └── KU-S10-903-canary-deployment-performance-verification.md
│   └── _assets/
│       ├── deployment-cache-invalidation-flowchart.md
│       └── ci-cd-pipeline-integration-snippets
│
├── Z0-enterprise-architecture/
│   ├── KU-Z0-001-capacity-planning-methodology.md
│   ├── KU-Z0-002-horizontal-scaling-architecture.md
│   ├── KU-Z0-003-slo-definition-and-error-budget-management.md
│   ├── KU-Z0-004-cost-performance-optimization-framework.md
│   ├── KU-Z0-005-migration-planning-from-74-to-8x.md
│   ├── KU-Z0-006-fpm-to-octane-migration-guide.md
│   ├── KU-Z0-007-multi-region-deployment-considerations.md
│   ├── KU-Z0-008-autoscaling-strategies-for-php.md
│   └── KU-Z0-009-disaster-recovery-performance-considerations.md
│
├── Z9-domain-reference/
│   ├── KU-Z9-001-dependency-map.md
│   ├── KU-Z9-002-glossary.md
│   ├── KU-Z9-003-acronyms-and-abbreviations.md
│   ├── KU-Z9-004-source-list-with-annotations.md
│   └── KU-Z9-005-knowledge-audit-changelog.md
│
└── _assets/
    ├── templates/
    │   ├── ku-template.md
    │   └── decision-record-template.md
    ├── calculators/
    │   ├── pm-maxchildren-calculator.xlsx
    │   ├── jit-buffer-size-calculator.md
    │   └── memory-requirement-estimator.html
    └── references/
        ├── php-version-support-timeline.png
        ├── runtime-benchmark-comparison-2026.pdf
        └── opcache-settings-by-framework.csv
```

---

## Domain-to-Subdomain Mapping

| Directory | Subdomain | Primary Skills / Knowledge |
|-----------|-----------|---------------------------|
| `S01-php-engine-version-performance/` | S1 | Version deltas, migration planning, engine internals, regression catalogs |
| `S02-jit-compilation/` | S2 | CRTO bitmask, tracing/function modes, buffer sizing, hot-path tuning, DynASM |
| `S03-opcache-configuration/` | S3 | Memory sizing, preloading, cache invalidation, hit-rate monitoring, file cache |
| `S04-memory-management-gc/` | S4 | zval, refcounting, CoW, cycle collector, WeakReference, leak patterns |
| `S05-php-fpm-worker-management/` | S5 | pm mode selection, pool sizing, worker recycling, slow log, status page |
| `S06-alternative-runtimes/` | S6 | Runtime comparison, Swoole/RR/FrankenPHP/ReactPHP/AMPHP architecture |
| `S06a-swoole/` | S6a | Coroutine model, io_uring, WebSocket, task workers, hooks |
| `S06b-roadrunner/` | S6b | Goridge, .rr.yaml, plugins (gRPC/queues), process supervision |
| `S06c-frankenphp/` | S6c | CGO bridge, thread pool, SAPI internals, Caddyfile, ZTS |
| `S06d-reactphp-amphp/` | S6d | Event loops, fiber-based concurrency, async patterns |
| `S07-laravel-octane/` | S7 | Driver selection, service provider optimization, state management, sub-50ms tuning |
| `S08-benchmarking-methodology/` | S8 | wrk/wrk2, k6, ab, phpbench, methodology (warmup/sample size/coordinated omission), CI integration |
| `S09-profiling-observability/` | S9 | Blackfire, Tideways, Xdebug, SPX, eBPF, flame graphs, SLO-driven profiling |
| `S10-deployment-cache-invalidation/` | S10 | Graceful reload, opcache_reset, blue-green, container cold-start, CI/CD integration |
| `Z0-enterprise-architecture/` | Cross-cutting | Capacity planning, SLOs, migration, autoscaling, multi-region, cost optimization |
| `Z9-domain-reference/` | Meta | Glossary, dependency map, source annotations, knowledge audit |

### Non-overlapping Guarantee

Each KU belongs to exactly one directory. Cross-cutting concerns (e.g., "JIT impact on Octane performance") are placed in the directory of the primary concern (S07-laravel-octane) with a relative cross-reference back to the supporting directory (S02-jit-compilation). The `Z0-enterprise-architecture/` directory holds only content that genuinely spans all subdomains (capacity planning, migration methodology). No KU is duplicated.

---

## Future Growth Considerations

### 1. New PHP Version Branches
When PHP 8.6, 8.7, or 9.0 releases, add version-specific content under `S01-php-engine-version-performance/` as new KUs. The `_assets/php-version-support-calendar.csv` should be updated, and the version delta matrix in KU-S1-003 should be extended with new rows. No structural changes needed.

### 2. New Runtimes
If a new runtime emerges (e.g., a Rust-based PHP application server), add a new subdirectory under `S06-alternative-runtimes/` (e.g., `S06e-newruntime/`) following the same 00-foundation/10-core/90-advanced/ pattern. Update KU-S6-001 (comparison overview) and the runtime selection decision tree.

### 3. PHP Profiling Tool Consolidation
As the eBPF profiling ecosystem matures, consider promoting eBPF content from `S09-profiling-observability/90-advanced/` to `10-core/`. If a particular tool achieves market dominance, a dedicated subdirectory may be warranted.

### 4. Continuous Benchmarking Platform
If bencher.dev or similar continuous benchmarking platforms become standard practice, add a new `10-core/` KU under `S08-benchmarking-methodology/`. If the ecosystem fragments, a dedicated subdirectory for benchmarking tools may be warranted.

### 5. AI/ML PHP Workloads
If PHP AI/ML workloads become mainstream (FFI + ONNX, TensorFlow), add a new subdirectory `S11-ai-ml-workloads/` with KUs covering JIT optimization for inference, memory management for model loading, and runtime selection for compute-heavy pipelines.

### 6. Serverless PHP
If serverless PHP (AWS Lambda custom runtime, Vercel) matures significantly, add `S12-serverless-php/` covering cold-start optimization, OpCache file cache for Lambda, and minimal boot sequence design.

### 7. ARM64/NVIDIA Grace Architecture
As ARM64 adoption grows, expand `S01-php-engine-version-performance/` with ARM64-specific JIT behavior KUs. Cross-reference from `S02-jit-compilation/` (KU-S2-105 already reserved for ARM64 considerations).

### 8. Directory Deprecation Policy
When a subdomain becomes obsolete (e.g., PHP-FPM being fully replaced by Octane-era runtimes), move the directory to `_archive/` with a deprecation notice in the README rather than deleting. Content remains for historical reference and legacy system maintenance.

### 9. Maximum Directory Depth
The architecture enforces a maximum depth of 4 levels (e.g., `S06-alternative-runtimes/S06c-frankenphp/10-core/`). Any deeper hierarchy indicates a need for restructuring or subdomain splitting. New subdomains should be added as peers, not nested deeper.

### 10. Scaling Projection
At full maturity, this directory tree will contain approximately 200-250 KUs across all subdomains. At the current rate of PHP runtime evolution (2-3 significant changes per year per subdomain), the structure supports 3-5 years of growth before needing reorganization. The tree can be rebalanced by promoting subdirectories to top-level if any runtime (e.g., FrankenPHP) develops sufficient knowledge mass to warrant its own primary domain.
