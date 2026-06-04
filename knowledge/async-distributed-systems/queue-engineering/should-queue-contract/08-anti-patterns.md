# Anti-Patterns: ShouldQueue Contract and Queueable Types

## Metadata

| Attribute | Value |
|---|---|
| Domain | Async & Distributed Systems |
| Subdomain | Queue Engineering |
| Knowledge Unit | K006 — ShouldQueue Contract and Queueable Types |
| Classification | Foundation |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Conditional Interface Removal for Sync | Design | Critical |
| 2 | Missing SerializesModels on Listeners | Reliability | High |
| 3 | Mail::send() in Production | Performance | High |
| 4 | Confusing ShouldQueue with Dispatchable | Design | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| Inconsistent ShouldQueue Implementation Across Queueable Types | should-queue-contract, queueable-mail-notifications-broadcast | High |
| Mixing Sync and Async in Same Job Class Without dispatchSync | should-queue-contract, pending-dispatch-lifecycle | Medium |
| Using Raw Model Serialization Instead of ModelIdentifier | should-queue-contract, serializes-models-trait | Critical |

---

## Anti-Pattern 1: Conditional Interface Removal for Sync

### Category
Design — Contract Violation

### Description
Removing the `ShouldQueue` interface from a job class because some callers need synchronous execution. This changes the class contract for all callers, making it impossible for other callers to dispatch asynchronously.

### Why It Happens
Developers think of `ShouldQueue` as a sync/async toggle rather than a class contract. When a new use case requires synchronous dispatch, the quickest perceived fix is to remove the interface. Developers are unaware that `dispatchSync()` exists as an alternative.

### Warning Signs
- `implements ShouldQueue` removed from a job class in a commit message mentioning "sync"
- Job class has no `implements ShouldQueue` but has a `handle()` method
- Multiple callers exist but some use `dispatch()` and others call the class directly
- `dispatch()` calls exist on the class but fail silently because the interface is missing

### Why Harmful
Removing `ShouldQueue` breaks the contract for all callers — every dispatch becomes synchronous. If a queue worker is added later, the job class must be refactored. The class no longer signals its queueable nature to developers reading the code.

### Real-World Consequences
A `ProcessPayment` job removes `ShouldQueue` because the refund path needs sync execution. Meanwhile, the main checkout path that previously dispatched async now runs synchronously — users wait 2-5 seconds for payment processing during checkout. The team discovers the performance regression weeks later during load testing.

### Preferred Alternative
Always implement `ShouldQueue` on job classes. Use `dispatchSync()` for synchronous callers.

### Refactoring Strategy
1. Add `implements ShouldQueue` back to the job class
2. Add `use Dispatchable` trait if not already present
3. Replace direct synchronous calls with `Job::dispatchSync()`
4. Verify all async callers use `Job::dispatch()` and continue working
5. Test that sync callers complete inline while async callers push to the queue

### Detection Checklist
- [ ] Job class lacks `implements ShouldQueue`
- [ ] Multiple callers exist but none use `dispatchSync()`
- [ ] Class has `handle()` but no `implements ShouldQueue`
- [ ] Git history shows interface removed in a sync-related commit

### Related Rules/Skills/Decision Trees
- **Rule 1**: always-implement-should-queue (`05-rules.md`)
- **Rule 4**: dont-remove-shouldqueue-for-sync (`05-rules.md`)
- **Decision 1**: Async vs Sync Execution for Event Listeners (`07-decision-trees.md`)

---

## Anti-Pattern 2: Missing SerializesModels on Listeners

### Category
Reliability — Serialization Failure

### Description
Queued event listeners implement `ShouldQueue` but omit the `SerializesModels` trait. Without it, the entire event payload is serialized naively — Eloquent models in the event are serialized in full, causing payload bloat and potential serialization failures for non-serializable properties.

### Why It Happens
Developers are unaware that `CallQueuedListener` serializes the entire event object by default. The `SerializesModels` trait seems optional or is forgotten during initial implementation. The problem only surfaces in production when payloads include models with relationships or non-serializable properties.

### Warning Signs
- Queued listener class has `implements ShouldQueue` but no `use SerializesModels`
- Queue payload size exceeds expected model identifier size
- Serialization exceptions in queue worker logs (e.g., "Serialization of 'Closure' is not allowed")
- Redis memory usage spikes for queue payloads containing model data
- Tests pass because payload size is not measured in test assertions

### Why Harmful
Full model serialization bloats queue payloads by 10-100x, increasing Redis memory usage and queue latency. Non-serializable properties (closures, resources, file handles) cause job failures. The listener cannot be retried because the serialized payload is corrupted.

### Real-World Consequences
An `OrderShipped` listener serializes the full Order model (including a `$callback` property from a third-party package). Every dispatch fails with a serialization error, and the shipment confirmation email is never sent. The team spends hours debugging before discovering `SerializesModels` was missing.

### Preferred Alternative
Always add `use SerializesModels` to queued event listeners. This replaces model instances with lightweight `ModelIdentifier` objects that are re-retrieved from the database when the job runs.

### Refactoring Strategy
1. Add `use SerializesModels` to the listener class
2. Verify the listener's event contains only Eloquent models (or serializable data)
3. Test that the listener handles re-retrieved models correctly (the model is fresh from DB)
4. Monitor queue payload sizes before and after the change
5. Remove any workarounds that manually serialize/deserialize models

### Detection Checklist
- [ ] Listener has `implements ShouldQueue` but no `SerializesModels` trait
- [ ] Queue payload contains full model data (check Redis/DB queue storage)
- [ ] Queue worker shows serialization exceptions for the listener
- [ ] Listener event includes models with non-serializable properties

### Related Rules/Skills/Decision Trees
- **Rule 2**: add-serializes-models-to-listeners (`05-rules.md`)
- **Skill 1**: Implement ShouldQueue Correctly Across All Queueable Types (`06-skills.md`)
- **Decision 1**: Async vs Sync Execution for Event Listeners (`07-decision-trees.md`)

---

## Anti-Pattern 3: Mail::send() in Production

### Category
Performance — Blocking I/O

### Description
Using `Mail::send()` instead of `Mail::queue()` in production environments. This blocks the HTTP request while the SMTP call completes, adding unpredictable network latency to every response that sends email.

### Why It Happens
Development habits carry over to production — `Mail::send()` works fine in local development where SMTP is instant or faked. Developers forget to switch to `Mail::queue()` when deploying. Convenience APIs encourage synchronous usage because they are the first autocomplete result.

### Warning Signs
- Production response times spike on routes that send email
- SMTP relay latency directly correlates with web response time
- HTTP response includes SMTP handshake time in logs
- `Mail::send()` appears in production code paths
- Queue worker processes zero mail jobs (because they're never queued)

### Why Harmful
SMTP calls are network-bound and unpredictable — a slow SMTP relay can add 5-30 seconds to response time. At peak traffic, synchronous mail delivery compounds delays, reducing request throughput. Users experience timeouts on registration, order confirmation, and password reset routes.

### Real-World Consequences
An e-commerce site sends order confirmation emails synchronously during checkout. The SMTP relay experiences a slowdown, adding 8 seconds to each checkout response. Conversion rate drops by 15% because users abandon the page before the confirmation loads.

### Preferred Alternative
Always use `Mail::queue()` in production. Reserve `Mail::send()` for development environments or exceptional immediate-delivery needs.

### Refactoring Strategy
1. Replace `Mail::send()` with `Mail::queue()` across all production code paths
2. Configure a dedicated mail queue with adequate worker capacity
3. Set an appropriate `$timeout` on queueable mailables for large attachments
4. Add monitoring on the mail queue to detect delivery failures
5. Test that mail sending is decoupled from HTTP response time

### Detection Checklist
- [ ] `Mail::send()` appears in non-test production code
- [ ] Email-sending routes show correlated latency with SMTP relay
- [ ] Queue worker processes fewer mail jobs than expected
- [ ] SMTP timeout errors appear in HTTP responses

### Related Rules/Skills/Decision Trees
- **Rule 3**: never-mail-send-in-production (`05-rules.md`)
- **Decision 2**: Queueable Mail vs Synchronous Mail (`07-decision-trees.md`)
- **Skill 1**: Implement ShouldQueue Correctly Across All Queueable Types (`06-skills.md`)

---

## Anti-Pattern 4: Confusing ShouldQueue with Dispatchable

### Category
Design — Interface Misunderstanding

### Description
Treating `ShouldQueue` as if it provides the `dispatch()` method, or confusing the marker interface with the `Dispatchable` trait. This leads to missing `dispatch()` method calls, incorrect class structures, and inconsistencies across queueable types.

### Why It Happens
Both `ShouldQueue` and `Dispatchable` are involved in the dispatch pipeline, and new developers often assume the interface provides the method. Documentation examples sometimes conflate the two. The naming similarity suggests related functionality.

### Warning Signs
- Class implements `ShouldQueue` but lacks `use Dispatchable` and has no `dispatch()` calls
- Developer refers to "ShouldQueue dispatch" in code reviews
- `ShouldQueue` interface treated as having methods (it's empty)
- Manual dispatch via `dispatch(new Job())` instead of `Job::dispatch()`
- Inconsistent pattern across queueable types (some use trait, others don't)

### Why Harmful
Classes without `Dispatchable` cannot use the fluent dispatch API (`onQueue()`, `onConnection()`, `delay()`). Dispatch code becomes inconsistent across the codebase — some jobs use the trait, others are dispatched manually. New team members misunderstand the purpose of each component.

### Real-World Consequences
A team creates 50 job classes but only 30 use `Dispatchable`. The remaining 20 are dispatched manually via `Queue::push()`, losing fluent configuration. When the queue connection changes, developers must update 20 dispatch call sites instead of one class property.

### Preferred Alternative
`ShouldQueue` is an empty marker interface that signals async processing. `Dispatchable` is the trait that provides the `dispatch()` method and fluent API. Use both together on job classes.

### Refactoring Strategy
1. Add `use Dispatchable` to all job classes that implement `ShouldQueue` but lack the trait
2. Replace manual `Queue::push()` or `dispatch()` calls with `Job::dispatch()` syntax
3. Standardize all job classes to use the same pattern
4. Update tests to use the fluent dispatch API
5. Add a code review checklist item verifying both `ShouldQueue` and `Dispatchable`

### Detection Checklist
- [ ] Job class with `ShouldQueue` lacks `use Dispatchable`
- [ ] `Queue::push()` used instead of `Job::dispatch()`
- [ ] Inconsistent job creation patterns across the codebase
- [ ] Manual `new Job()` followed by dispatch call

### Related Rules/Skills/Decision Trees
- **Rule 1**: always-implement-should-queue (`05-rules.md`)
- **Skill 1**: Implement ShouldQueue Correctly Across All Queueable Types (`06-skills.md`)
- **Decision 1**: Async vs Sync Execution for Event Listeners (`07-decision-trees.md`)
