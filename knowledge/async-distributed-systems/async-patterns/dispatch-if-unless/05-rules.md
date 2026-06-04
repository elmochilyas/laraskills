# Rule Card: K063 — dispatchIf / dispatchUnless

---

## Rule 1

**Rule Name:** prefer-dispatchIf-over-manual-guards

**Category:** Prefer

**Rule:** Prefer `dispatchIf` over wrapping `dispatch` in an `if` statement.

**Reason:** `dispatchIf` communicates intent directly — the condition is part of the dispatch expression.

**Bad Example:**
```php
if ($user->isSubscribed()) {
    ProcessSubscription::dispatch($user); // Condition is separated from dispatch
}
```

**Good Example:**
```php
ProcessSubscription::dispatchIf($user->isSubscribed(), $user); // Condition colocated
```

**Exceptions:** Complex conditions with multiple branches that can't be expressed as a single boolean.

**Consequences Of ViolATION:** A code review misses that the dispatch is conditionally wrapped — `dispatchIf` makes the conditional nature explicit and self-documenting.

---

## Rule 2

**Rule Name:** avoid-side-effects-in-condition

**Category:** Avoid

**Rule:** Avoid placing side-effect-heavy expressions in the condition parameter.

**Reason:** The condition is evaluated eagerly — side effects happen regardless of the result.

**Bad Example:**
```php
ProcessSubscription::dispatchIf(
    $this->logAndCheck($user), // Side effect runs even if dispatch is skipped
    $user
);
```

**Good Example:**
```php
$isSubscribed = $this->checkSubscription($user); // No side effects
ProcessSubscription::dispatchIf($isSubscribed, $user);
```

**Exceptions:** None — conditions should be free of side effects.

**Consequences Of ViolATION:** `$this->logAndCheck()` logs "checking subscription" and sends an audit event every time — even when the condition is false and no job is dispatched, the audit log is flooded with unnecessary entries.

---

## Rule 3

**Rule Name:** evaluate-condition-in-caller-process

**Category:** Always

**Rule:** Always evaluate the condition in the caller process (HTTP request), not inside the job.

**Reason:** `dispatchIf` prevents queuing the job entirely — the condition is evaluated in the current process.

**Bad Example:**
```php
// All orders dispatch the job — the job checks subscription status
class ProcessSubscription implements ShouldQueue
{
    public function handle(): void
    {
        if (!$this->user->isSubscribed()) {
            return; // Job was queued unnecessarily — wasted resources
        }
    }
}
```

**Good Example:**
```php
// Only dispatch if condition is met — no queue waste
ProcessSubscription::dispatchIf($user->isSubscribed(), $user);
```

**Exceptions:** Conditions that can only be evaluated at job runtime (e.g., timing-dependent checks).

**Consequences Of ViolATION:** 80% of orders are from unsubscribed users — 80% of queued jobs are no-ops. Workers waste time deserializing and immediately returning, consuming queue capacity for nothing.

---

## Rule 4

**Rule Name:** use-dispatchUnless-for-negative-logic

**Category:** Prefer

**Rule:** Prefer `dispatchUnless` when the condition is naturally negative.

**Reason:** Avoids double negation — `dispatchUnless(!$condition)` is confusing.

**Bad Example:**
```php
SendWelcomeMail::dispatchIf(!$user->isBanned(), $user); // Double negative
```

**Good Example:**
```php
SendWelcomeMail::dispatchUnless($user->isBanned(), $user); // Clear intent
```

**Exceptions:** Codebase conventions that consistently use `dispatchIf`.

**Consequences Of ViolATION:** A developer reads `dispatchIf(!$user->isBanned())` and has to mentally negate — more cognitive load and higher chance of misreading during code review.
