# Throughput Optimization Rules

## Rule 1: Use Long Polling with Maximum Wait Time
- **Category**: Performance
- **Rule**: Always set ReceiveMessageWaitTimeSeconds to 20 for maximum long polling benefit
- **Reason**: Long polling reduces empty responses by 95%+; each empty poll costs $0.40/M; at 1 poll/sec/worker, 10 workers generate $1,036/year in empty polls; long polling reduces to $52/year
- **Bad Example**: Using 0-second wait time (short polling), polling SQS every second even when the queue is empty
- **Good Example**: Setting WaitTimeSeconds=20 so the worker waits up to 20 seconds for messages before returning
- **Exceptions**: Workers requiring sub-second notification of new messages (rare)
- **Consequences Of Violation**: 20x more API calls than necessary; significant SQS costs for empty polling

## Rule 2: Receive Maximum 10 Messages Per Poll
- **Category**: Performance
- **Rule**: Always set MaxNumberOfMessages=10 on SQS ReceiveMessage calls
- **Reason**: SQS charges per API call, not per message; receiving 10 messages costs the same as receiving 1, providing 10x throughput improvement per API call
- **Bad Example**: Receiving 1 message per poll, requiring 10 API calls to process 10 messages
- **Good Example**: Setting MaxNumberOfMessages=10, processing 10 messages with 1 API call
- **Exceptions**: FIFO queues where per-message-group ordering requires smaller batch sizes
- **Consequences Of Violation**: 10x higher API costs and 10x lower per-worker throughput

## Rule 3: Process Messages in Parallel Within a Batch
- **Category**: Performance
- **Rule**: Process received batch messages concurrently using async/parallel execution for I/O-heavy jobs
- **Reason**: Database queries and API calls have wait time; processing 5 messages concurrently reduces total batch time by 60-80% for I/O-bound workloads
- **Bad Example**: Receiving 10 messages and processing them one at a time synchronously (batch time = sum of all 10 job times)
- **Good Example**: Using Guzzle pool, ReactPHP, or Laravel's concurrent processing to process messages in parallel (batch time = max of job times, not sum)
- **Exceptions**: CPU-bound jobs where concurrent processing does not improve throughput and adds overhead
- **Consequences Of Violation**: 3-5x lower throughput for I/O-bound workers; more workers needed for same throughput

## Rule 4: Optimize Job Duration to Under 500ms
- **Category**: Performance
- **Rule**: Profile and optimize slow job classes, targeting job duration under 500ms
- **Reason**: Throughput = 1 / job_duration; optimizing a 2-second job to 200ms provides 10x throughput improvement = 90% fewer workers needed
- **Bad Example**: A job making N+1 database queries taking 3 seconds, with no profiling to identify the bottleneck
- **Good Example**: Adding eager loading, caching database results, and using bulk operations to reduce job execution to 200ms
- **Exceptions**: Inherently slow operations (PDF generation, image processing, external API calls) may have minimum feasible duration
- **Consequences Of Violation**: 3-10x more workers needed than necessary; proportional cost increase for worker fleet

## Rule 5: Separate Fast and Slow Jobs into Different Queues
- **Category**: Architecture
- **Rule**: Route fast jobs (<100ms) and slow jobs (>1s) to separate SQS queues with dedicated workers
- **Reason**: Slow jobs block workers from processing fast jobs; separation ensures fast jobs have dedicated workers and aren't delayed by slow processing
- **Bad Example**: Email sending (50ms) and PDF generation (5s) on the same queue; PDF blocks 50 email sends from processing during its execution
- **Good Example**: Email jobs on `fast-queue` with 2 workers, PDF jobs on `slow-queue` with 5 workers; both processed without blocking each other
- **Exceptions**: Jobs with similar execution times (<2x variance) can share a queue without significant impact
- **Consequences Of Violation**: Fast jobs experience latency proportional to slow jobs on the same queue; overall throughput reduced
