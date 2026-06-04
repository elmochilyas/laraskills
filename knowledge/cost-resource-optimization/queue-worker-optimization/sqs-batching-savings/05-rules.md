# SQS Batching Savings Rules

## Rule 1: Batch All Three SQS Operations
- **Category**: Cost Management
- **Rule**: Always use batch versions of Send, Receive, and Delete SQS operations (up to 10 messages per request)
- **Reason**: Each batch request counts as 1 API call regardless of message count; batching all three operations reduces total API calls by up to 93%
- **Bad Example**: Receiving 10 messages via batch but deleting them individually with DeleteMessage, generating 11 API calls for 10 messages
- **Good Example**: Using ReceiveMessage (1 call) + DeleteMessageBatch (1 call) = 2 API calls for 10 messages instead of 20
- **Exceptions**: Single-message operations where queuing does not accumulate messages for batching
- **Consequences Of Violation**: 10x higher API costs than necessary; paying $3.60/M requests instead of $0.36/M for equivalent message volume

## Rule 2: Receive Maximum 10 Messages Per Poll
- **Category**: Performance
- **Rule**: Always set MaxNumberOfMessages=10 when calling SQS ReceiveMessage
- **Reason**: SQS charges per API call, not per message; receiving 10 messages costs the same as receiving 1
- **Bad Example**: Using default SDK behavior (MaxNumberOfMessages=1) and processing 10 messages with 10 API calls
- **Good Example**: Setting `'MaxNumberOfMessages' => 10` and processing all 10 messages in a single worker iteration
- **Exceptions**: FIFO queues where per-message-group ordering may require smaller batch sizes
- **Consequences Of Violation**: 10x more API calls for the same throughput; unnecessary SQS costs

## Rule 3: Handle Partial Batch Failures
- **Category**: Reliability
- **Rule**: Always handle partial failures in batch SQS operations by checking per-entry success/failure responses
- **Reason**: SQS batch operations can partially fail—some messages succeed while others fail; ignoring partial failures causes message loss or unnecessary retries
- **Bad Example**: Processing 10 messages in a batch, 1 fails, and the worker deletes all 10 (data loss for the failed message)
- **Good Example**: Processing each message individually within the batch, tracking success/failure per message, and deleting only successfully processed messages via DeleteMessageBatch
- **Exceptions**: Idempotent jobs where re-processing is safe; still delete only successfully processed messages to avoid waste
- **Consequences Of Violation**: Data loss from deleting unprocessed messages or wasted compute from retrying successfully processed messages

## Rule 4: Combine Batching with Long Polling
- **Category**: Cost Management
- **Rule**: Always use both batch operations (MaxNumberOfMessages=10) and long polling (WaitTimeSeconds=20) together
- **Reason**: Batching reduces per-message request cost by 10x; long polling eliminates empty receive costs; together they reduce SQS costs by 95-99%
- **Bad Example**: Using batching but short polling—each poll returns instantly even when empty, generating 2.6M empty polls/month
- **Good Example**: Configuring both MaxNumberOfMessages=10 and WaitTimeSeconds=20 for maximum cost efficiency
- **Exceptions**: None—both should always be enabled for SQS consumers
- **Consequences Of Violation**: Achieving only 50% of potential SQS cost savings by using one optimization without the other

## Rule 5: Size Individual Messages for Batch Constraints
- **Category**: Performance
- **Rule**: Keep individual message payloads under 64KB even when using batch operations
- **Reason**: Each message in a batch is independently chunked in 64KB increments; a batch of 10 65KB messages costs 20 chunks instead of 10
- **Bad Example**: Batching 10 messages of 65KB each, paying for 20 chunks instead of 10
- **Good Example**: Compressing each message to under 64KB before batching, ensuring each batch of 10 costs only 10 chunks
- **Exceptions**: Messages that cannot be compressed below 64KB; consider S3 claim-check pattern as alternative
- **Consequences Of Violation**: Batch cost doubling due to individual messages exceeding the 64KB threshold
