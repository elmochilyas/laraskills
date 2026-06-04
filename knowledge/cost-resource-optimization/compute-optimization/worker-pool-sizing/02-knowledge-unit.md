# KU-07-WORKER-POOL-SIZING: Worker Pool Sizing

## Metadata
- **ID**: KU-07-WORKER-POOL-SIZING
- **Subdomain**: Compute Optimization
- **Topic**: Worker Pool Sizing
- **Source**: Compute Optimization, AWS Documentation, Industry Research
- **Reliability**: High

## Executive Summary
Worker pool sizing determines how many concurrent PHP processes (workers) handle requests or process queue jobs. Whether using PHP-FPM, Octane, or queue workers, correct sizing balances memory availability against concurrency needs. Under-sized pools cause request queuing and latency; over-sized pools waste memory and cause context-switching overhead. Optimal sizing directly reduces server count by maximizing throughput per instance.

## Core Concepts
- **Worker**: PHP process handling exactly one request/job at a time
- **CPU-bound scaling**: Workers limited by CPU cores; context switching degrades beyond 2x cores
- **I/O-bound scaling**: Workers can exceed CPU cores because they spend time waiting (database, HTTP, cache)
- **Memory-bound scaling**: Workers limited by available RAM; each worker consumes 30-150MB
- **Concurrency**: Number of requests/jobs handled simultaneously (equals worker count)
- **Queue depth**: How many items are waiting for a worker; metric for under-provisioning

## Mental Models
- Default: workers = CPU cores for CPU-bound; 2-3x CPU cores for I/O-bound
- Always identify bottleneck (CPU, memory, I/O) before sizing
- Separate pools for web vs queue

## Internal Mechanics
- Context switching overhead: 0% at workers = cores, 10% at 2x cores, 30%+ at 4x+ cores
- Memory overhead: Each idle worker consumes ~20MB baseline memory
- Laravel boot overhead: PHP-FPM workers boot per-request (~30-80ms); Octane workers boot once
- Queue worker efficiency: Workers processing SQS jobs should batch (maxMessages=10) to reduce API calls
- Worker restart cost: PHP-FPM max_requests 500 = 0.2% CPU overhead; Octane max_jobs 500 = 0.1% overhead

## Patterns
- Calculate worker count from bottleneck
- Monitor idle worker percentage
- Use separate pools for different workloads
- Right-size queue workers for throughput
- Set max_workers with buffer

## Architectural Decisions
- PHP-FPM web: workers = (RAM - OS_reserve) / avg_worker_memory; cap at 2x CPU cores
- Octane workers: workers = CPU cores (+ 1 for management overhead)
- Queue workers: workers = 2-4x CPU cores (I/O heavy from database/SQS)
- Separate queue pools: `php artisan queue:work --queue=high,default --workers=4` for high priority
- Monitor queue wait time; if > 5 minutes, add workers or queue concurrency

## Tradeoffs
**When To Use:**
- CPU-bound pool: Workers = CPU cores (image processing, PDF generation, complex calculations)
- I/O-bound pool: Workers = 2-3x CPU cores (API calls, database queries, cache lookups)
- Memory-bound pool: Workers = Available RAM / worker_memory (large-file processing, memory-heavy jobs)
- Queue workers: Workers = 2-4x CPU cores (high I/O wait from SQS/Database)
- Octane workers: Workers = CPU cores (persistent process, less I/O wait)

**When NOT To Use:**
- Workers > 4x CPU cores: Context switching overhead destroys throughput gains
- Workers > RAM / 50MB: memory exhaustion causes OOM kills (PHP-FPM)
- Single worker for all queues: Different queue priorities need different worker counts
- Static worker count for variable load: Use dynamic scaling or queue autoscaling

## Performance Considerations
- Context switching overhead: 0% at workers = cores, 10% at 2x cores, 30%+ at 4x+ cores
- Memory overhead: Each idle worker consumes ~20MB baseline memory
- Laravel boot overhead: PHP-FPM workers boot per-request (~30-80ms); Octane workers boot once
- Queue worker efficiency: Workers processing SQS jobs should batch (maxMessages=10) to reduce API calls
- Worker restart cost: PHP-FPM max_requests 500 = 0.2% CPU overhead; Octane max_jobs 500 = 0.1% overhead

## Production Considerations
- Separate pool permissions: Queue workers may need different IAM roles than web workers
- Worker memory limits prevent resource exhaustion attacks
- Max execution time: `max_execution_time` or queue job timeout prevents runaway processes
- Isolate sensitive jobs: Financial processing should use dedicated worker pool

## Common Mistakes
- **Oversubscribed workers**: Setting workers = 50 on 2-core server with 2GB RAM (Cause: "concurrency = performance" misconception; Consequence: extreme context switching, OOM kills, throughput < 10 workers; Better: calculate from bottleneck, usually 4-8 on 2-core)
- **Equal workers for all queues**: Processing critical email jobs and slow PDF generation on same pool with equal workers (Cause: single queue listener; Consequence: PDF generation blocks email delivery; Better: separate queue pools with different worker counts)
- **No queue depth monitoring**: 1000 jobs waiting in queue but no alarm (Cause: not monitoring queue metrics; Consequence: hours of latency before detection; Better: set CloudWatch alarm on SQS queue depth > 100)

## Failure Modes
- **Fixed workers for variable load**: Static worker count regardless of traffic; wastes resources or under-provisions
- **Shared pool for web and queue**: One server handles HTTP + queue; queue jobs steal web workers
- **Workers > RAM capacity**: Setting worker count that exceeds available memory (guaranteed OOM)

## Ecosystem Usage
- **4-core web server (8GB RAM)**: PHP-FPM workers = 70 (based on memory), Octane workers = 4-8 (based on CPU)
- **Queue worker (2 cores, 4GB)**: 8 queue workers (I/O heavy), processing 500 jobs/min avg 3s each
- **Memory-bound processing (1GB RAM)**: 3 workers (1GB - 0.5GB OS = 500MB / 150MB per worker)

## Related Knowledge Units
- PHP-FPM Tuning (ku-03)
- Octane Resource Usage (ku-05)
- Queue Worker Scaling (ku-10)
- Context Switching (ku-08)

## Research Notes
Derived from Compute Optimization, AWS Documentation, Industry Research. See 04-standardized-knowledge.md for complete research details.