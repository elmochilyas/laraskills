# Batch Processing Rules

## Rule 1: Always Set MaxNumberOfMessages=10
- **Category**: Performance
- **Rule**: Always configure SQS ReceiveMessage with MaxNumberOfMessages=10
- **Reason**: SQS charges per API request, not per message; receiving 10 messages costs the same as receiving 1, reducing API calls by 90% and dropping cost from $3.60/M to $0.36/M
- **Bad Example**: Using default configuration of 1 message per poll; handling 10K messages requires 10K API calls
- **Good Example**: Setting MaxNumberOfMessages=10; handling 10K messages requires 1K API calls
- **Exceptions**: FIFO queues where per-message-group ordering may limit effective batch size
- **Consequences Of Violation**: 10x higher SQS API costs for equivalent message volume

## Rule 2: Use DeleteMessageBatch
- **Category**: Cost Management
- **Rule**: Always batch DeleteMessage calls into DeleteMessageBatch (up to 10 receipt handles per request)
- **Reason**: Delete requests cost the same as receive requests; batching deletes reduces API cost by 90% for the delete operation
- **Bad Example**: Receiving 10 messages via batch but deleting them individually with 10 separate DeleteMessage calls
- **Good Example**: Collecting all 10 receipt handles and calling DeleteMessageBatch with a single API request
- **Exceptions**: When only 1 message was successfully processed (batch delete with 1 entry still saves vs individual call)
- **Consequences Of Violation**: 10x more delete API calls than necessary; paying double for batch receives without batch deletes

## Rule 3: Process Batch in a Worker Loop
- **Category**: Performance
- **Rule**: Implement a worker loop that continuously receives and processes message batches
- **Reason**: A warm worker receiving batches sequentially reduces polling overhead and processes up to 10 jobs per iteration, achieving 10x throughput improvement vs single-message processing
- **Bad Example**: A worker process that polls for 1 message, processes it, deletes it, and exits; each new job requires a new worker cold start
- **Good Example**: `while ($messages = $sqs->receive(['MaxNumberOfMessages' => 10])) { processBatch($messages); deleteBatch($messages); }`
- **Exceptions**: Jobs with very long execution times (>5 minutes) where a single-message worker loop is simpler
- **Consequences Of Violation**: 10x lower throughput; higher compute cost for the same job volume due to cold starts

## Rule 4: Handle Partial Batch Failures
- **Category**: Reliability
- **Rule**: Handle each message in a batch individually and delete only successfully processed messages
- **Reason**: Batch operations can partially fail; deleting all messages when some failed causes data loss; retrying all when some succeeded wastes compute
- **Bad Example**: Processing a batch of 10, where 1 fails; the entire batch is retried, wasting the 9 successfully processed messages' compute
- **Good Example**: Processing each message individually, tracking success/failure, and calling DeleteMessageBatch with only successfully processed receipt handles
- **Exceptions**: Atomic batch operations where all messages must succeed together; all must retry on any failure
- **Consequences Of Violation**: Data loss from deleting unprocessed messages, or wasted compute from re-processing successful ones

## Rule 5: Use Laravel Job Batching for Coordinated Workflows Only
- **Category**: Architecture
- **Rule**: Use Laravel's Bus::batch() only for coordinated multi-step workflows that need success/failure callbacks
- **Reason**: Laravel job batching adds tracking overhead (progress, cancellation) that is unnecessary for independent jobs; simple dispatch is more efficient
- **Bad Example**: Using Bus::batch([$job1, $job2, $job3]) for three independent email notifications that have no coordination requirement
- **Good Example**: Using Bus::batch([$importUsers, $importPosts, $importComments])->then(fn() => notifyUser()) for a data import workflow
- **Exceptions**: User-facing progress bars for bulk operations benefit from batch tracking even without coordination
- **Consequences Of Violation**: Unnecessary complexity and overhead for independent jobs that don't need coordination

## Rule 6: Batch SendMessage for Bulk Dispatching
- **Category**: Performance
- **Rule**: Use SendMessageBatch when dispatching multiple messages at once (up to 10 per batch call)
- **Reason**: Bulk dispatching (e.g., email campaign to 1000 users) becomes 100 API requests vs 1000; 10x reduction in write API cost
- **Bad Example**: Sending 1000 individual SendMessage calls for a bulk notification campaign
- **Good Example**: Grouping into 100 SendMessageBatch calls with 10 messages each
- **Exceptions**: Real-time dispatches where waiting to accumulate 10 messages adds unacceptable latency
- **Consquences Of Violation**: 10x higher SQS write costs for bulk dispatching operations
