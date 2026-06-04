# Anti-Patterns: Queue Dispatching for Analytics Event Processing

## Shared Queue with Application Jobs
Analytics event jobs are dispatched to the same queue as password reset emails, notifications, and other application jobs. An analytics data import pushes 500K events into the queue, delaying all time-sensitive application jobs.

**Solution:** Always configure a dedicated queue connection for analytics processing. Use separate Redis database or SQS queue.

## Dispatching Raw Request Objects
The entire `$request` object is passed to the queued job. Laravel cannot serialize the full `Request` object (it contains non-serializable resources like uploaded files). Jobs fail with serialization errors in production.

**Solution:** Extract required data into a simple DTO or array before dispatch. Only serialize what the processing job needs.

## No Dead-Letter Queue for Analytics
Failed analytics jobs are retried indefinitely or silently discarded. Failed events are lost without any trace, creating data quality issues that are invisible to operators.

**Solution:** Implement a dead-letter queue or failed job table for analytics events. Review and reprocess failed events regularly.

## Ignoring Queue Worker Saturation
Adding more queue workers to process analytics events faster. More workers increase database write concurrency, causing database contention, lock waits, and slower overall processing.

**Solution:** Monitor the entire pipeline throughput, not just queue depth. Match worker count to database write capacity. Use batching for efficient writes.

## Environment-Polluted Queue Names
Development, staging, and production environments all dispatch to the same queue. Developers' test events appear in production analytics dashboards. Production jobs fail because they process test data.

**Solution:** Prefix all queue names with the environment identifier. Use environment-specific queue configuration.
