# Skill: Select Benchmarking Tools by Target Layer with Correct Load Type

## Purpose
Select the correct benchmarking tool for each system layer — PHP application (wrk2/k6 for HTTP), database (sysbench/pgbench), queue (custom producer script), cache (memtier_benchmark) — with open-loop for latency, closed-loop for throughput, and coordinating simultaneous multi-layer benchmarks to identify the true bottleneck.

## When To Use
- Planning a new benchmark campaign
- Building performance testing infrastructure
- Investigating multi-layer bottlenecks
- Selecting tools for CI integration

## When NOT To Use
- Single-layer benchmarks (simpler tool selection)
- Production monitoring (profiling, not benchmarking)

## Prerequisites
- Understanding of each layer in the application stack
- Knowledge of open-loop vs closed-loop requirements
- Tool installation permissions

## Inputs
- Application architecture diagram (PHP app, DB, queue, cache)
- Layer to benchmark
- Target metric (latency vs throughput)

## Workflow

### 1. Identify Layer to Benchmark

| Layer | Tool | Loop Type | Metric |
|-------|------|-----------|--------|
| PHP HTTP app | wrk2, k6 | Open-loop | Latency p95/p99 |
| PHP HTTP app | wrk | Closed-loop | Max throughput |
| Nginx/LB | wrk2 | Open-loop | Latency, throughput |
| MySQL/PostgreSQL | sysbench, pgbench | Built-in | QPS, latency p95 |
| Redis/Memcached | memtier_benchmark, redis-benchmark | Configurable | Ops/s, latency |
| Queue workers | Custom producer script | Open-loop | Throughput, latency |
| Laravel Octane | wrk2 | Open-loop | Latency, RPS/worker |

### 2. Select Loop Type
- Open-loop (wrk2 `--rate`, k6 constant arrival rate): for accurate latency measurement
- Closed-loop (wrk, ab): for maximum throughput discovery only
- Database tools: use their built-in load models (sysbench OLTP, pgbench TPC-B)
- Cache tools: memtier uses closed-loop by default — verify if latency is important

### 3. Configure Tool for the Layer
- wrk2: set rate just below expected capacity, increase gradually
- k6: configure stages for realistic load ramps
- sysbench: select workload (oltp_read_write, oltp_point_select)
- memtier: set key pattern and data size to match production

### 4. Run Layer-Specific Benchmarks in Isolation
- Test each layer independently first
- Database: bypass application with sysbench connecting directly
- Cache: bypass application with memtier connecting directly
- Document baseline performance for each layer
- Verify results against production monitoring data

### 5. Coordinate Multi-Layer Benchmarks
- Run application-level benchmarks (wrk2 hitting PHP endpoints)
- Simultaneously monitor each downstream layer (DB, cache, queue)
- Compare: application latency vs database query latency at same load
- If app latency rises but DB latency stays flat: bottleneck is in application layer
- If both rise together: bottleneck is in shared resource (DB connections, CPU)
- Identify the layer where queuing first appears

## Validation Checklist
- [ ] Tool selected matches target layer
- [ ] Loop type correct for target metric
- [ ] Each layer benchmarked in isolation first
- [ ] Multi-layer benchmarks coordinated with simultaneous monitoring
- [ ] Bottleneck identified by comparing latency across layers

## Related Rules
- wrk2/k6 for HTTP (`05-rules.md:1`)
- sysbench for DB (`05-rules.md:26`)
- memtier for cache (`05-rules.md:52`)
- Isolate then coordinate (`05-rules.md:79`)

## Related Skills
- wrk/wrk2 Usage and Lua Scripting
- k6 Scripting Thresholds Stages
- Coordinated Omission
- Continuous Profiling Strategy

## Success Criteria
- Correct tool selected for each target layer
- Open-loop used for latency benchmarks, closed-loop for throughput
- Each layer benchmarked in isolation with documented baseline
- Multi-layer benchmarks coordinated to identify true bottleneck
- Benchmark choices documented with rationale
