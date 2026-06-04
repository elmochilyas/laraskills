# KU-02-BATCH-PROCESSING: Batch Processing

## Metadata
- **ID**: KU-02-BATCH-PROCESSING
- **Subdomain**: Queue Worker Optimization
- **Topic**: Batch Processing
- **Source**: Queue Worker Optimization, AWS Documentation, Industry Research
- **Reliability**: High

## Executive Summary
Batch processing groups multiple queue messages into a single operation, dramatically reducing per-message overhead. For Laravel applications using SQS, batching reduces API calls (SQS ReceiveMessage/DeleteMessage), database transactions, and HTTP requests. SQS supports batches of up to 10 messages per request. For high-throughput apps, batching reduces SQS API costs by 90% and increases worker throughput by 3-10x.

## Core Concepts
- **SQS batch size**: Up to 10 messages per ReceiveMessage and DeleteMessageBatch call
- **Laravel queue batching**: `$batch = Bus::batch([...])->dispatch();` for grouping related jobs
- **Chunk processing**: Processing multiple queue messages in a single worker iteration
- **SQS API pricing**: $0.40/million requests; batching reduces requests 10x
- **Batch job tagging**: Tagging batch jobs for progress tracking and cancellation
- **Job batching vs message batching**: Job batching (Laravel) groups logical work; message batching (SQS) reduces API calls

## Mental Models
- Default: MaxNumberOfMessages=10 on all SQS receives
- Default: DeleteMessageBatch for batch deletions
- Separate fast (<1s) and slow (>1s) jobs into different queues

## Internal Mechanics
- Single-message processing: 10 messages = 10 ReceiveMessage + 10 DeleteMessage = 20 API calls
- Batch processing: 10 messages = 1 ReceiveMessage + 1 DeleteMessageBatch = 2 API calls (10x reduction)
- Worker throughput: Batch processing handles 100 msg/s/worker vs 10 msg/s/worker for single-message
- Latency per message: Same for batch (messages processed serially in batch); overall throughput higher
- SQS short polling vs long polling: Batch processing with long polling (WaitTimeSeconds=20) reduces empty responses

## Patterns
- Always set MaxNumberOfMessages=10
- Use DeleteMessageBatch
- Process batch in worker loop
- Use Laravel job batching for coordinated workflows
- Implement batch progress tracking
- Batch SQS SendMessage when dispatching multiple jobs

## Architectural Decisions
- Worker loop: Receive 10 messages -> process each (sync or async) -> delete 10 messages in batch
- Laravel's default worker uses single-message processing; custom worker for high throughput
- For SQS FIFO queues: MessageGroupId is required for ordering; batching works within same group
- Batch processing works best with short-duration jobs (<1 second each)
- For mixed-duration jobs, separate fast and slow jobs into different queues
- Monitor batch size metric (SQS `NumberOfMessagesReceived` / `ReceiveMessage` calls)

## Tradeoffs
**When To Use:**
- SQS message batching: Always (ReceiveMessage with MaxNumberOfMessages=10); no downsides
- Laravel job batching: Sequential jobs that must all succeed/fail together; batch progress tracking
- Chunk processing: High-throughput apps (1000+ jobs/sec); reduce per-job overhead
- SQS batch delete: Always batch DeleteMessage calls into DeleteMessageBatch
- SQS batch send: When dispatching multiple jobs at once (e.g., bulk notification sending)

**When NOT To Use:**
- SQS batching for single-message queues: Queue dispatches one message at a time; batching offers no benefit
- Laravel job batching for independent jobs: Batch adds tracking overhead for jobs that don't need coordination
- Chunk processing for slow jobs: If each job takes >10 seconds, processing sequentially in batch hurts latency
- Over-large batches: SQS limit is 10 messages; batch sizes > 10 require multiple requests

## Performance Considerations
- Single-message processing: 10 messages = 10 ReceiveMessage + 10 DeleteMessage = 20 API calls
- Batch processing: 10 messages = 1 ReceiveMessage + 1 DeleteMessageBatch = 2 API calls (10x reduction)
- Worker throughput: Batch processing handles 100 msg/s/worker vs 10 msg/s/worker for single-message
- Latency per message: Same for batch (messages processed serially in batch); overall throughput higher
- SQS short polling vs long polling: Batch processing with long polling (WaitTimeSeconds=20) reduces empty responses

## Production Considerations
- Batch deletion: Ensure all messages in batch are acknowledged before batch delete (no message loss)
- Partial batch failure: SQS batch operations can partially fail; handle `failed` entries in response
- Batch size limits: 10 messages max; sending >10 requires multiple batch calls
- Message deduplication (FIFO): Batch with MessageDeduplicationId per message
- IAM permissions: Minimum `sqs:ReceiveMessage`, `sqs:DeleteMessageBatch`, `sqs:ChangeMessageVisibility`

## Common Mistakes
- **MaxNumberOfMessages=1 default**: Using default SQS receive with 1 message per call (Cause: copy-paste from SQS tutorial; Consequence: 10x more API calls; $10/month could be $1/month; Better: always set MaxNumberOfMessages=10)
- **DeleteMessage (single) after batch receive**: Receiving 10 messages but deleting individually (Cause: not using DeleteMessageBatch; Consequence: 10 delete API calls per 10 messages; Better: collect receipt handles and use DeleteMessageBatch)
- **Batch processing without partial failure handling**: Processing batch of 10, 1 fails, all 10 are retried (Cause: assuming all-or-nothing batch processing; Consequence: 9 successful messages re-processed; wasted compute; Better: handle failures individually, delete only successfully processed messages)

## Failure Modes
- **Batching unrelated jobs into single Laravel batch**: Jobs that don't need coordination get batch overhead
- **Synchronous batch processing in web request**: Dispatching 50 jobs synchronously in controller; user waits 50x job time
- **Batch size > 10**: SQS returns error for >10 messages; handle pagination for larger batches

## Ecosystem Usage
- **Before**: worker receives 1 message, processes, deletes 1 message (10 API calls for 10 messages)
- **After**: worker receives 10 messages, processes, batch deletes (2 API calls for 10 messages)
- **Laravel batch**: `Bus::batch([$import->users(), $import->posts(), $import->comments()])->then(function() { notify user import complete; })->dispatch()`
- **Bulk dispatch**: `SendMessageBatch` with 10 emails per request for 10K email campaign = 1000 API calls vs 10000

## Related Knowledge Units
- Worker Scaling (ku-01)
- Throughput Optimization (ku-06)
- SQS Long Polling

## Research Notes
Derived from Queue Worker Optimization, AWS Documentation, Industry Research. See 04-standardized-knowledge.md for complete research details.