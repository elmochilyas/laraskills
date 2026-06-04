# Command — Anti-Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | Backend Architecture & Design |
| Subdomain | Design Patterns & Principles |
| Knowledge Unit | Command pattern in PHP/Laravel context |
| Anti-Pattern Count | 5 |

## Repository-Wide Anti-Patterns

| # | Name | Severity |
|---|------|----------|
| 1 | Command Containing Too Much Data | High |
| 2 | Command Performing Logic in __construct | Critical |
| 3 | Inconsistent ShouldQueue Implementation | Medium |
| 4 | Commands Depending on Container-Resolved Services | Critical |
| 5 | Commands with Non-Serializable Properties | High |

---

## 1. Command Containing Too Much Data

### Category
Performance

### Description
A command/job class contains large amounts of data (full model instances, large arrays, serialized objects), causing large queue payloads and serialization overhead.

### Why It Happens
Passing entire objects or large data sets to a command for convenience.

### Warning Signs
- Command containing serialized Eloquent models with all relations
- Large JSON payloads in queue
- Queue messages exceeding size limits
- Slow job dispatch time
- Serialization memory errors

### Why Harmful
Large payloads increase Redis/DB storage, network transfer time, and serialization cost. Some queue drivers have message size limits.

### Consequences
- Slow dispatch and processing
- Queue backpressure from large payloads
- Storage cost increase
- Job failure from size limits

### Alternative
Pass only identifiers (IDs, UUIDs) and fetch fresh data in the handler. For bulk data, use chunked processing or reference external storage.

### Refactoring Strategy
1. Replace model instances with IDs in command
2. Fetch fresh data in handler
3. Use external storage references for large data
4. Implement chunking for bulk operations
5. Reduce command payload size

### Detection Checklist
- [ ] Review command properties for large objects
- [ ] Measure queue payload size
- [ ] Check for serialization limits

### Related Rules/Skills/Trees
- Skills: Command, Job Design, Queue Optimization

---

## 2. Command Performing Logic in __construct

### Category
Reliability

### Description
Command constructor performs business logic, database queries, or side effects that execute during serialization (before dispatch) and again during deserialization (on the worker).

### Why It Happens
Developers not understanding that the constructor runs twice: once during `dispatch()` and once after `unserialize()` on the worker.

### Warning Signs
- Constructor has DB queries, API calls, or file operations
- Logic executed twice (once at dispatch, once at process)
- Unexpected side effects from job creation
- Jobs behaving differently on first vs retry attempt

### Why Harmful
Constructor logic runs during serialization (dispatch) AND during deserialization (worker). Side effects occur at unexpected times. Data fetched at dispatch may be stale by the time the job runs.

### Consequences
- Duplicate execution of logic
- Unexpected side effects at dispatch time
- Stale data in jobs
- Hard-to-debug behavior differences

### Alternative
Keep constructors simple: assign properties only. Move all logic to the `handle()` method. Fetch dependencies in `handle()`.

### Refactoring Strategy
1. Remove logic from constructor
2. Move to handle() method
3. Fetch fresh data in handle()
4. Verify no side effects at dispatch

### Detection Checklist
- [ ] Review constructor for logic beyond assignment
- [ ] Test serialization/deserialization behavior
- [ ] Verify handle() has all needed data

### Related Rules/Skills/Trees
- Skills: Command, Job Lifecycle, Queue Basics

---

## 3. Inconsistent ShouldQueue Implementation

### Category
Architecture

### Description
Some commands implement `ShouldQueue` (async) while others don't (sync), with no consistent policy or documentation about which is which.

### Why It Happens
Commands added over time. Some developers add `ShouldQueue` for future-proofing, others don't.

### Warning Signs
- Mix of sync and async commands for similar operations
- No documentation of dispatch mode
- Performance surprises from slow sync commands
- Confusion about whether a command runs synchronously

### Why Harmful
Inconsistent dispatch mode makes performance unpredictable. Slow operations running synchronously block the request. Fast operations queued add unnecessary overhead.

### Consequences
- Unpredictable response times
- Some requests blocked by sync commands
- Queue overhead for fast operations
- Confusion and bugs

### Alternative
Define a clear policy: I/O-heavy operations → queue; light operations → sync. Document each command's dispatch mode. Use configuration for environment-specific dispatching.

### Refactoring Strategy
1. Review all commands for ShouldQueue consistency
2. Apply consistent policy
3. Document dispatch decisions
4. Add CI check for policy compliance

### Detection Checklist
- [ ] Inventory all commands and their dispatch mode
- [ ] Evaluate performance impact of sync commands
- [ ] Document ShouldQueue policy

### Related Rules/Skills/Trees
- Skills: Command, Queue Configuration, Job Dispatching
- Decision Trees: Sync vs Async Dispatch

---

## 4. Commands Depending on Container-Resolved Services

### Category
Reliability

### Description
Command classes inject services (repositories, API clients, mailers) into the constructor, which are serialized but not available after queue deserialization.

### Why It Happens
Dependency injection in commands works for sync dispatch (services are resolved). Developers don't realize services can't be serialized for async dispatch.

### Warning Signs
- Command constructor type-hinting service classes
- `Serialization of 'Closure' is not allowed` errors
- Jobs failing after deserialization
- Untyped `$this->service` calls in handle()

### Why Harmful
Services resolved at dispatch time are serialized and deserialized on the worker. Most services (HTTP clients, database connections) cannot be serialized, causing job failure.

### Consequences
- Job failures
- Serialization errors
- Broken async behavior
- Worker crashes

### Alternative
Commands should contain only data (IDs, primitives). Handlers resolve their own dependencies from the container.

### Refactoring Strategy
1. Remove service dependencies from command constructor
2. Replace with data (IDs, primitives)
3. Services resolved in handle() via DI
4. Test async serialization

### Detection Checklist
- [ ] Check command constructors for service type hints
- [ ] Verify serialization test
- [ ] Test async dispatch and processing

### Related Rules/Skills/Trees
- Skills: Command, Job Design, Dependency Injection in Queues
- Decision Trees: Sync vs Async Dispatch

---

## 5. Commands with Non-Serializable Properties

### Category
Reliability

### Description
Command contains properties that cannot be serialized (closures, resources, open streams, file handles), causing job dispatch to fail.

### Why It Happens
Closures, file resources, or database connections are assigned to command properties.

### Warning Signs
- Closure properties in commands
- Resource-type properties (file handles, DB connections)
- `Serialization of 'Closure' is not allowed` errors
- Intermittent job failures

### Why Harmful
Jobs cannot be dispatched to async queues. If `ShouldQueue` is added later, existing commands with non-serializable properties will fail.

### Consequences
- Dispatch failures
- Cannot use async queues
- Serialization errors in production
- Blocked deployments

### Alternative
Only store serializable data (scalars, arrays, stdClass, models with proper casts). Replace closures with class references or identifiers.

### Refactoring Strategy
1. Identify non-serializable properties
2. Replace with serializable equivalents (IDs, data arrays)
3. Remove closures, resources, and connections
4. Add serialization tests
5. Verify compatibility with queue driver

### Detection Checklist
- [ ] Scan command properties for non-serializable types
- [ ] Test serialization
- [ ] Verify async dispatch

### Related Rules/Skills/Trees
- Skills: Command, Serialization, Queue Basics
- Decision Trees: Sync vs Async Dispatch
