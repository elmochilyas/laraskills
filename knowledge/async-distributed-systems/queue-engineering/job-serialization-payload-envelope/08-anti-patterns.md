# Anti-Patterns: Job Serialization and Payload Envelope Structure

## Metadata

| Attribute | Value |
|---|---|
| Domain | Async & Distributed Systems |
| Subdomain | Queue Engineering |
| Knowledge Unit | K004 — Job Serialization and Payload Envelope Structure |
| Classification | Advanced |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Passing Full Eloquent Models Instead of IDs | Performance | Critical |
| 2 | Bloated Payloads with Unnecessary Data | Performance | High |
| 3 | Modifying Job Properties After Construction | Reliability | High |
| 4 | Closures in Batch Callbacks | Reliability | High |
| 5 | SQS Payload Exceeding 256KB Limit | Reliability | Critical |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| Models with Loaded Relations Serialized | job-serialization-payload-envelope, serializes-models-trait | High |
| Base64 Encoding Bloat Ignored | job-serialization-payload-envelope, queue-driver-architecture | Medium |
| No Payload Size Monitoring | job-serialization-payload-envelope, queue-observability | Medium |

---

## Anti-Pattern 1: Passing Full Eloquent Models Instead of IDs

### Category
Performance — Payload Bloat

### Description
Passing full Eloquent model instances directly to job constructors instead of model IDs. Serializing a model with loaded relations serializes the entire object graph, creating large payloads, stale data, and N+1 deserialization queries.

### Why It Happens
Convenience — developers pass the model directly from the controller to the job without considering serialization cost. The `SerializesModels` trait masks the problem by reducing serialized size, but still creates a `find()` query per model property on deserialization.

### Warning Signs
- Job constructor takes `Order $order` instead of `int $orderId`
- Payload sizes are >1KB for simple jobs
- Queue worker logs show multiple `find()` queries before `handle()` starts
- Redis memory grows proportionally with queue depth
- SQS payloads approach the 256KB limit

### Why Harmful
Each loaded relation adds another serialized `ModelIdentifier` — a model with 5 loaded relations serializes into 6 separate entries, each triggering a `find()` query on deserialization. Payloads are 10-100x larger than necessary. Data is stale by processing time.

### Real-World Consequences
A `GenerateInvoicePdf` job receives an `Order` model with 5 loaded relations (items, customer, address, payments, shipments). The payload is 15KB instead of 4 bytes (order ID). On deserialization, 6 separate `find()` queries execute before `handle()` starts — adding milliseconds of latency per job. At 1000 jobs/hour, this adds 6,000 unnecessary queries per hour to the database.

### Preferred Alternative
Pass model IDs and re-fetch the model in `handle()`.

### Refactoring Strategy
1. Change constructor from `Order $order` to `int $orderId`
2. In `handle()`, add `$order = Order::find($this->orderId)`
3. Handle the null case where the model was deleted
4. Remove `SerializesModels` trait if no longer needed
5. Verify payload size reduction in queue storage

### Detection Checklist
- [ ] Job constructor accepts model instances
- [ ] Payload size >1KB for ID-based jobs
- [ ] Deserialization triggers multiple `find()` queries
- [ ] Redis/SQS storage shows full model serialization

### Related Rules/Skills/Decision Trees
- **Rule 1**: pass-ids-not-models (`05-rules.md`)
- **Decision 1**: Pass IDs vs Pass Models to Jobs (`07-decision-trees.md`)
- **Decision 3**: Payload Size Optimization Strategy (`07-decision-trees.md`)

---

## Anti-Pattern 2: Bloated Payloads with Unnecessary Data

### Category
Performance — Throughput Reduction

### Description
Passing large or unnecessary data structures to job constructors — entire request payloads, large arrays, or objects with properties the job doesn't need. Payload size directly impacts Redis memory, SQS network transfer, and deserialization time.

### Why It Happens
Developers pass the data they have available (entire request DTOs, full API responses) rather than selecting only the fields the job needs. Refactoring to extract only necessary fields is perceived as overhead.

### Warning Signs
- Job payload includes full request data: `__construct(public array $requestData)`
- Payload contains large text fields, JSON blobs, or serialized objects
- Payload size >5KB for jobs that only need a few identifiers
- Redis memory grows faster than expected for queue depth
- Queue throughput decreases as payload sizes increase

### Why Harmful
Payload size directly impacts Redis memory, SQS network transfer time, and (de)serialization CPU cost. A 10KB payload takes 10x longer to serialize, store, and deserialize than a 1KB payload. At scale, this reduces job throughput proportionally.

### Real-World Consequences
An analytics job passes the entire API request payload (50KB) to its constructor, even though it only needs `userId` and `eventType`. At 10,000 jobs/hour, the queue consumes 500MB of Redis memory per hour. Serialization adds 200ms per dispatch. After refactoring to pass only `userId` and `eventType` (48 bytes), Redis memory drops to 480KB/hour and dispatch latency is negligible.

### Preferred Alternative
Only pass the data the job's `handle()` method actually needs. Decompose complex objects into individual scalar parameters.

### Refactoring Strategy
1. Audit each job's `handle()` method to identify all data it uses
2. List the exact parameters needed
3. Refactor constructor to accept only those parameters
4. Update all dispatch call sites to pass the specific data
5. Measure payload size before and after

### Detection Checklist
- [ ] Job constructor accepts arrays or large objects
- [ ] Payload includes fields never used in `handle()`
- [ ] Payload size >5KB for simple jobs
- [ ] Dispatch call sites pass full request/response data

### Related Rules/Skills/Decision Trees
- **Rule 2**: keep-payloads-minimal (`05-rules.md`)
- **Decision 3**: Payload Size Optimization Strategy (`07-decision-trees.md`)

---

## Anti-Pattern 3: Modifying Job Properties After Construction

### Category
Reliability — Silent Data Loss

### Description
Modifying job object properties after the constructor but before dispatch. The payload is serialized once when the `PendingDispatch` destructor fires — post-construction changes may not be reflected in the serialized payload.

### Why It Happens
Developers construct a job, set additional properties conditionally, then dispatch the variable. This pattern works with `dispatchSync()` (no serialization) but silently drops data when serialized.

### Warning Signs
- Job properties set after `new Job()` but before `dispatch()`
- Conditional data added to job via setters after construction
- Jobs work correctly in testing with sync driver but miss data with real queue
- Dispatch pattern: `$job = new Job($id); $job->extra = 'value'; $job->dispatch();`

### Why Harmful
Data set after construction is silently lost at serialization time. The job runs without the expected data, causing logic errors that are extremely difficult to trace because the payload looks correct at serialization time.

### Real-World Consequences
A developer constructs a `ProcessOrder` job, then conditionally sets `$job->priority = 'high'` based on a complex check. With `QUEUE_CONNECTION=sync`, the priority is always set correctly. In production with Redis, the `priority` property is never serialized — all orders process at default priority. Urgent orders are delayed, and the team can't reproduce the bug locally.

### Preferred Alternative
Set all job data in the constructor. Use constructor parameters for all data the job needs.

### Refactoring Strategy
1. Identify all properties set after construction
2. Add them as constructor parameters
3. Update all dispatch call sites
4. Remove any post-construction property assignment
5. Test with a real queue backend to verify serialization

### Detection Checklist
- [ ] Job properties modified after constructor
- [ ] Setters or public property assignments after `new Job()`
- [ ] Jobs work with sync but fail with Redis/SQS
- [ ] Missing data in job payload when inspecting queue storage

### Related Rules/Skills/Decision Trees
- **Rule 4**: dont-modify-job-properties-after-construction (`05-rules.md`)

---

## Anti-Pattern 4: Closures in Batch Callbacks

### Category
Reliability — Fragile Serialization

### Description
Using closures as batch callbacks (`then`, `catch`, `finally`). Closure serialization is fragile across deployments — if the closure's source code changes between dispatch and execution, deserialization may fail.

### Why It Happens
Inline closures are the simplest way to add batch callbacks. Developers don't realize that batch callbacks are serialized and stored alongside the batch, surviving queue worker restarts and deployments.

### Warning Signs
- Batch `then`/`catch`/`finally` callbacks use closures instead of class jobs
- Batch callback payloads contain closure serialization markers
- Serialization failures on batch completion after deployment
- "SerializableClosure" or "Opis\Closure" errors in batch processing
- Batch callbacks fail intermittently after code changes

### Why Harmful
A deployment that changes the closure's source code breaks serialization of in-flight batch callbacks. The batch completes but the `then` callback never fires — the post-batch processing (notifications, cleanup) never happens.

### Real-World Consequences
A team deploys a code change that modifies a batch's `then` closure (adds a parameter). 50 in-flight batches have the old closure serialized in storage. When these batches complete, the old closure deserializes against the new code — the captured scope doesn't match, and deserialization fails. Post-batch processing for 50 data exports is silently lost.

### Preferred Alternative
Use queued job classes for batch callbacks. Dispatch the job class from the callback instead of using inline closures.

### Refactoring Strategy
1. Replace closure callbacks with dispatch calls to class jobs
2. `$batch->then(function () { SendNotification::dispatch(); })`
3. Pass batch results to the dispatched job for context
4. Test callback execution after a code change to verify serialization stability
5. Remove closure imports from batch configuration

### Detection Checklist
- [ ] Batch `then`/`catch`/`finally` uses closures
- [ ] Serialization errors on batch completion
- [ ] Post-batch processing fails after deployments
- [ ] Batch callback payload contains closure markers

### Related Rules/Skills/Decision Trees
- **Rule 3**: avoid-closures-for-complex-jobs (`05-rules.md`)
- **Decision 2**: Class Jobs vs Closure Jobs (`07-decision-trees.md`)

---

## Anti-Pattern 5: SQS Payload Exceeding 256KB Limit

### Category
Reliability — Job Rejection

### Description
Dispatching jobs to SQS queues with payloads exceeding 256KB. SQS rejects messages larger than 256KB — the job is never queued, and no error is raised in the dispatch path.

### Why It Happens
Teams add more data to job payloads over time without monitoring payload size. The 256KB limit is generous for most jobs, but serialized models, large arrays, and closure scopes can push payloads over the limit.

### Warning Signs
- SQS queue driver with jobs passing models or large data structures
- Jobs dispatched to SQS that never appear in the queue
- No error in application logs (dispatch succeeds, SQS rejects silently)
- Payload size approaches 200KB (danger zone)
- Queue monitoring shows dispatches but no corresponding SQS messages

### Why Harmful
Jobs exceeding 256KB are silently rejected by SQS API. The `dispatch()` call succeeds (PHP serialization works), but the SQS API returns an error that may not propagate. The job is lost without trace.

### Real-World Consequences
A team switches from Redis to SQS for a queue that processes order exports. The job payload includes serialized order data, and some large orders produce payloads of 300KB. SQS silently rejects these messages. For 2 weeks, large orders are never exported. The team discovers the issue when customers complain about missing export files.

### Preferred Alternative
Keep payloads under 256KB by passing IDs instead of models. Use Laravel 11+ SQS overflow storage for legitimate large payloads. Split large jobs into smaller sub-jobs.

### Refactoring Strategy
1. Measure payload sizes for all job types on the SQS queue
2. Refactor any job approaching 200KB to pass IDs instead of models/data
3. For unavoidable large payloads: use Laravel 11+ SQS overflow storage
4. For extremely large payloads: split the job into smaller parts
5. Add payload size monitoring and alerting

### Detection Checklist
- [ ] SQS queue driver configured
- [ ] Jobs pass models, large arrays, or complex objects
- [ ] Payload size not measured or monitored
- [ ] Dispatched jobs don't appear in SQS queue
- [ ] No overflow storage configured for large payloads

### Related Rules/Skills/Decision Trees
- **Rule 1**: pass-ids-not-models (`05-rules.md`)
- **Decision 3**: Payload Size Optimization Strategy (`07-decision-trees.md`)
