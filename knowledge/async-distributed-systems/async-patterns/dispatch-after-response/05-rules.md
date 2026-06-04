# Rule Card: K062 — dispatchAfterResponse

---

## Rule 1

**Rule Name:** use-dispatch-after-response-for-non-critical

**Category:** Prefer

**Rule:** Prefer `dispatchAfterResponse` for non-critical tasks that should not delay the HTTP response.

**Reason:** `dispatchAfterResponse` runs synchronously in the same request lifecycle after the response is sent — the client gets the response immediately, but the task runs in the web process.

**Bad Example:**
```php
// Queue email confirmation — unnecessary overhead for a non-critical task
dispatch(new SendConfirmationEmail($order))); // Goes to queue worker — adds latency
```

**Good Example:**
```php
// Send confirmation after response — immediate user feedback, minimal overhead
$this->dispatchAfterResponse(new SendConfirmationEmail($order));
```

**Exceptions:** Tasks that must be durable (survive a PHP crash after response) — these still need the queue.

**Consequences Of Violation:** A simple confirmation email dispatch goes through the full queue pipeline (serialize, Redis push, worker pop, deserialize) — the web process could have sent it directly after response in under 1ms without any infrastructure dependency.

---

## Rule 2

**Rule Name:** never-use-for-crash-critical-work

**Category:** Never

**Rule:** Never use `dispatchAfterResponse` for work that must survive a PHP crash.

**Reason:** If PHP crashes during the "after response" phase, the task is lost — no queue, no retry.

**Bad Example:**
```php
$this->dispatchAfterResponse(new ChargeCustomer($order)); // Lost if PHP crashes
```

**Good Example:**
```php
dispatch(new ChargeCustomer($order)); // Durable — survives crash, will retry
```

**Exceptions:** Tasks where losing the execution is acceptable (analytics, logging).

**Consequences Of Violation:** PHP runs out of memory during the `dispatchAfterResponse` execution after sending the response — `ChargeCustomer` never runs, the order is not charged, and there's no record of the failure.

---

## Rule 3

**Rule Name:** use-for-sync-side-effects-only

**Category:** Prefer

**Rule:** Prefer `dispatchAfterResponse` for side effects that the user needs to see happen immediately.

**Reason:** The user gets their response and the side effect runs immediately in the same process.

**Bad Example:**
```php
// User submits a form and waits for the session data to be cleared
dispatch(new ClearUserSessionData($user)); // User has to wait
```

**Good Example:**
```php
// User submits form, gets response immediately, session data clears after
$this->dispatchAfterResponse(new ClearUserSessionData($user));
```

**Exceptions:** Duration-sensitive tasks that take more than a few seconds.

**Consequences Of ViolATION:** A user's browser waits 5 seconds for the response while the session data is being cleared — the user hits "Submit" again, causing a duplicate request.
