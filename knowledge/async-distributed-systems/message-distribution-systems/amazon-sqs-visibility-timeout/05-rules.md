# Rule 1: set-retry-after-less-than-visibility-timeout
`retry_after` must be 5-10 seconds less than the SQS visibility timeout to prevent double processing.

# Rule 2: use-long-polling
Set `WaitTimeSeconds=20` to reduce empty responses and API costs.

# Rule 3: set-redrive-policy-with-max-receive-count
Always configure a dead-letter queue with `maxReceiveCount` to prevent poison message cycles.

# Rule 4: use-message-group-id-for-fifo-ordering
Always include `MessageGroupId` for FIFO queues to enable per-entity ordered processing.

# Rule 5: match-queue-type-to-workload
Use Standard queues for high-throughput unordered work and FIFO for strict ordering.
