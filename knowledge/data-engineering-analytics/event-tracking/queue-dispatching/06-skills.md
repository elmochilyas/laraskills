# Skills: Queue Dispatching for Analytics Event Processing

## Skill: Designing Analytics Queue Topology
**Purpose:** Architect a queue topology for analytics event processing that scales independently.
**When to use:** Setting up the queue infrastructure for a new analytics pipeline.
**Steps:**
1. Identify pipeline stages (capture, enrichment, storage, export)
2. Create a dedicated queue connection for analytics in `config/queue.php`
3. Define queue names per pipeline stage with environment prefix
4. Configure retry-after and timeout per stage characteristics
5. Set up `ShouldBeUnique` on capture jobs to prevent duplicates
6. Implement payload size limits and monitoring
7. Configure worker processes per stage with appropriate concurrency
8. Set up queue depth monitoring and alerts

## Skill: Implementing Queue Backpressure
**Purpose:** Prevent analytics queue overload from causing data loss or pipeline failure.
**When to use:** High-throughput analytics pipelines where ingestion can exceed processing capacity.
**Steps:**
1. Monitor queue depth on critical pipeline queues
2. Define threshold for backpressure activation
3. Implement sampling in dispatch middleware when backpressure is active
4. Log sampling rate and queue depth during backpressure events
5. Auto-disable backpressure when queue depth returns to normal
6. Alert on sustained backpressure (> 5 minutes continuous)

## Skill: Analytics Event Deduplication via Queue
**Purpose:** Prevent duplicate analytics event processing when middleware fires multiple times.
**When to use:** Ensuring exactly-once semantics for analytics event capture.
**Steps:**
1. Generate a unique event ID at the middleware capture point
2. Implement `ShouldBeUnique` on the capture queue job
3. Configure `uniqueFor()` with a short window (5-10s)
4. Set up Redis for uniqueness lock storage
5. Monitor uniqueness lock contention in high-throughput scenarios
6. Handle edge case: legitimate unique events that arrive within the window
