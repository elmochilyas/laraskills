# KU-06-THROUGHPUT-OPTIMIZATION: Throughput Optimization

## Metadata
- **ID**: KU-06-THROUGHPUT-OPTIMIZATION
- **Subdomain**: Queue Worker Optimization
- **Topic**: Throughput Optimization
- **Source**: Queue Worker Optimization, AWS Documentation, Industry Research
- **Reliability**: High

## Executive Summary
Queue worker throughput optimization maximizes the number of jobs processed per worker per second. Higher throughput means fewer workers needed, reducing compute costs directly. For Laravel applications, throughput is limited by SQS polling patterns, batch sizes, job processing time, and database I/O. Optimizing these factors can increase per-worker throughput by 3-10x, directly translating to 60-90% cost reduction for the worker fleet.

## Core Concepts
- **Jobs-per-second per worker**: Primary throughput metric
- **SQS polling interval**: Time between ReceiveMessage calls (default 0.1-10s)
- **Long polling**: WaitTimeSeconds=20 reduces empty responses and API calls
- **Message batching**: Receive up to 10 messages per poll (MaxNumberOfMessages=10)
- **Job processing time**: Time from receive to delete; shorter = higher throughput
- **SQS API limits**: 120,000 API calls/second per queue (standard); rarely limiting
- **Overlapping execution**: Processing next message while waiting for I/O on current (async workers)

## Mental Models
- Default: WaitTimeSeconds=20, MaxNumberOfMessages=10
- Default: separate fast and slow job queues
- Profile job durations; optimize slowest first
- Consider parallel processing for I/O-heavy jobs

## Internal Mechanics
- Long polling (20s): 1 API call per 20 seconds (vs 1 per second for short polling) = 95% fewer API calls
- Batch processing: 10x throughput for same API calls (10 messages per batch)
- Parallel processing: 5 concurrent I/O jobs = 3-5x throughput for I/O-bound workers
- Chunk processing: Batch import of 1000 records = 1 API call + 1 DB transaction vs 1000 separate calls
- SQS API limits: 120,000 req/s per queue (standard); highly unlikely to be bottleneck
- Worker CPU: 30-50% utilization target for optimal throughput (below means under-utilized, above means bottlenecked)

## Patterns
- Use long polling with WaitTimeSeconds=20
- Receive maximum 10 messages per poll
- Process messages in parallel within a batch
- Optimize job duration to < 500ms
- Use SQS extended client for large messages (>256KB)
- Separate fast and slow jobs into different queues

## Architectural Decisions
- Worker configuration: ReceiveMessage with MaxNumberOfMessages=10, WaitTimeSeconds=20
- Process messages in parallel (Guzzle pool, ReactPHP, or Laravel's `@async`)
- Use separate queues for fast (<100ms) and slow (>1s) jobs
- Monitor throughput: jobs_per_second, avg_job_duration, batch_size
- Optimize slowest 5% of jobs first (biggest impact on throughput)
- Use SQS Extended Client for messages > 256KB

## Tradeoffs
**When To Use:**
- Throughput optimization: High-volume queue processing (>100 jobs/sec)
- Long polling: Always; reduces empty polls and SQS API costs
- Message batching: Always; 10x fewer API calls for same throughput
- Short polling: Never; use long polling for all queue consumers
- Async processing: Workers making HTTP/DB calls that can overlap I/O wait
- Chunk processing: Multiple independent jobs processed together (batch import, bulk notifications)

**When NOT To Use:**
- Over-optimizing for <10 jobs/sec: Worker utilization is low; optimization yields minimal savings
- Async processing for simple jobs: If jobs are CPU-bound and short (<10ms), async adds overhead
- Very large batches: SQS limit is 10 messages; larger batches need custom implementation
- Aggressive polling (0.1s interval): Wasteful for queues with low message volume

## Performance Considerations
- Long polling (20s): 1 API call per 20 seconds (vs 1 per second for short polling) = 95% fewer API calls
- Batch processing: 10x throughput for same API calls (10 messages per batch)
- Parallel processing: 5 concurrent I/O jobs = 3-5x throughput for I/O-bound workers
- Chunk processing: Batch import of 1000 records = 1 API call + 1 DB transaction vs 1000 separate calls
- SQS API limits: 120,000 req/s per queue (standard); highly unlikely to be bottleneck
- Worker CPU: 30-50% utilization target for optimal throughput (below means under-utilized, above means bottlenecked)

## Production Considerations
- Long polling is safe (same IAM permissions as short polling)
- Parallel processing shares worker memory; ensure isolation between jobs
- Large messages stored in S3 need S3 IAM permissions
- SQS API throttling can be triggered by aggressive polling; use exponential backoff
- Monitor for rapid polling as potential abuse indicator

## Common Mistakes
- **Short polling default**: Using 0-second WaitTimeSeconds (short polling) for SQS receive (Cause: default configuration; Consequence: 20x more API calls, $100+/year empty poll costs per worker; Better: set WaitTimeSeconds=20 for long polling)
- **Single message receive**: Receiving only 1 message per poll (Cause: not setting MaxNumberOfMessages; Consequence: 10x more API calls for same throughput; Better: always set MaxNumberOfMessages=10)
- **Processing jobs serially within batch**: Receiving 10 messages but processing one at a time synchronously (Cause: natural PHP execution model; Consequence: batch time = sum of all job times; Better: process concurrently with async/parallel for I/O-heavy jobs)
- **Not profiling job durations**: Blind to which jobs are slow (Cause: no job duration telemetry; Consequence: 10% of jobs consume 90% of throughput; Better: log job duration, optimize slowest jobs first)

## Failure Modes
- **1-second polling interval**: Wastes 95% of API calls; use long polling
- **All jobs on same queue**: Fast and slow jobs mixed; slow jobs block fast ones
- **No throughput monitoring**: Cannot measure optimization impact; flying blind
- **Receiving 1 message per poll**: Wasting 90% of API call capacity

## Ecosystem Usage
- **Before**: short polling, 1 message/receive, serial processing; 10 workers achieve 50 jobs/sec
- **After**: long polling (20s), 10 messages/receive, async processing; 4 workers achieve 100 jobs/sec (2x throughput, 60% fewer workers)
- **Fast/slow queue separation**: Email sending (50ms) on fast queue; PDF generation (5s) on slow queue; each queue has appropriate worker count
- **Parallel processing**: `$messages = $sqs->receive(['MaxNumberOfMessages' => 10]); async_process($messages);` using Guzzle pool for concurrent HTTP calls

## Related Knowledge Units
- Batch Processing (ku-02)
- Worker Scaling (ku-01)
- SQS Long Polling

## Research Notes
Derived from Queue Worker Optimization, AWS Documentation, Industry Research. See 04-standardized-knowledge.md for complete research details.