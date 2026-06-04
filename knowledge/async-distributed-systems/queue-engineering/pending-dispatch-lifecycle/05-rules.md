# Rule Card: K007 — `PendingDispatch` Lifecycle

---

## Rule 1

**Rule Name:** dont-assign-dispatch-to-variable

**Category:** Never

**Rule:** Never assign `dispatch()` to a variable unless you intend to delay dispatch.

**Reason:** The job doesn't queue until the destructor fires when the `PendingDispatch` variable goes out of scope.

**Bad Example:**
```php
$pending = ProcessOrder::dispatch($order);
// Job not dispatched yet — destructor hasn't fired
```

**Good Example:**
```php
ProcessOrder::dispatch($order);
// No assignment — PendingDispatch destructor fires immediately
```

**Exceptions:** When you need to conditionally add chain methods before dispatch completes (e.g., in a factory method), assignment is intentional.

**Consequences Of Violation:** Jobs dispatch later than expected — the timeline between dispatch and execution is unpredictable, causing race conditions and debugging confusion.

---

## Rule 2

**Rule Name:** prefer-dispatch-if-unless

**Category:** Prefer

**Rule:** Prefer `dispatchIf()` / `dispatchUnless()` for conditional dispatch.

**Reason:** These methods bypass `PendingDispatch` entirely and dispatch directly — cleaner intent and less overhead.

**Bad Example:**
```php
if ($shouldProcess) {
    ProcessOrder::dispatch($order);
}
```

**Good Example:**
```php
ProcessOrder::dispatchIf($shouldProcess, $order);
```

**Exceptions:** When the condition involves complex logic that doesn't fit into a single boolean expression, the if-block approach is clearer.

**Consequences Of Violation:** Unnecessary `PendingDispatch` objects are created and destroyed, and the conditional intent is less explicit.

---

## Rule 3

**Rule Name:** handle-exceptions-in-dispatch-chain

**Category:** Always

**Rule:** Always handle exceptions inside the dispatch chain.

**Reason:** If a chained method (e.g., `onQueue()`) throws, the destructor never fires — the job is silently lost.

**Bad Example:**
```php
ProcessOrder::dispatch($order)->onQueue($dynamicQueue);
// If $dynamicQueue is invalid, onQueue() throws — job never dispatches
```

**Good Example:**
```php
$job = new ProcessOrder($order);
$job->onQueue($this->resolveQueueName($order));
ProcessOrder::dispatch($job);
```

**Exceptions:** When chained methods are all side-effect-free property setters (no validation in chain methods), exceptions are unlikely.

**Consequences Of Violation:** Jobs silently disappear — no error log, no failed job entry, just a missing business outcome.

---

## Rule 4

**Rule Name:** use-bus-dispatchtosqueue-pattern

**Category:** Prefer

**Rule:** Prefer `Bus::dispatchToQueue()` when you need explicit control over dispatch timing.

**Reason:** `dispatch()` relies on the `PendingDispatch` destructor — `dispatchToQueue()` dispatches immediately.

**Bad Example:**
```php
// Relying on destructor timing — non-deterministic
$pending = ProcessOrder::dispatch($order);
```

**Good Example:**
```php
use Illuminate\Support\Facades\Bus;
Bus::dispatchToQueue(new ProcessOrder($order));
// Dispatched immediately — no destructor dependency
```

**Exceptions:** Standard `dispatch()` is the right choice for 95% of use cases — `dispatchToQueue()` is for situations where destructor timing is problematic.

**Consequences Of Violation:** In edge cases with complex object lifecycles, destructor ordering may cause jobs to dispatch in unexpected order or not at all.
