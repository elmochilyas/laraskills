# Rule Card: retryUntil — Dynamic Deadline-Based Retry

---

## Rule 1

**Rule Name:** pair-retryuntil-with-tries-cap

**Category:** Always

**Rule:** Always set a `$tries` cap when implementing `retryUntil()`.

**Reason:** A deadline without an attempt cap can lead to thousands of retries when backoff is short — a 24-hour deadline with 1-second backoff would retry 86,400 times. The `$tries` cap prevents resource exhaustion.

**Bad Example:**
```php
class ProcessPayment implements ShouldQueue
{
    public function retryUntil(): \DateTime
    {
        return CarbonImmutable::now()->addHours(24); // No $tries — potentially 86400 retries
    }

    public $backoff = 1;
}
```

**Good Example:**
```php
class ProcessPayment implements ShouldQueue
{
    public $tries = 10;

    public function retryUntil(): \DateTime
    {
        return CarbonImmutable::now()->addMinutes(15);
    }

    public $backoff = [5, 10, 30, 60];
}
```

**Exceptions:** None. Always set a `$tries` cap. The cap provides a backstop even if the deadline is miscalculated.

**Consequences Of Violation:** Queue exhaustion from thousands of retries, Horizon worker starvation, database bloat from failed_jobs entries.

---

## Rule 2

**Rule Name:** use-immutable-carbon-for-deadline

**Category:** Always

**Rule:** Always use `CarbonImmutable` (or `Carbon::now()->copy()`) inside `retryUntil()` closures.

**Reason:** In Laravel 10+, the `retryUntil()` closure is re-evaluated before each retry. Mutable Carbon instances like `Carbon::now()->addMinutes(15)` modify the original instance — the deadline shifts with each evaluation.

**Bad Example:**
```php
public function retryUntil(): \DateTime
{
    $deadline = Carbon::now();   // Mutable
    return $deadline->addMinutes(15); // Deadline shifts on re-evaluation
}
```

**Good Example:**
```php
public function retryUntil(): \DateTime
{
    return CarbonImmutable::now()->addMinutes(15); // Immutable — consistent deadline
}
```

**Exceptions:** None. `CarbonImmutable` is always preferred. If `Carbon` must be used, call `->copy()->addMinutes(15)`.

**Consequences Of Violation:** Deadline drifts forward with each retry evaluation. The job keeps retrying past the intended cutoff because `addMinutes(15)` is applied on top of the mutated instance.

---

## Rule 3

**Rule Name:** match-backoff-to-deadline-window

**Category:** Always

**Rule:** Ensure the configured `$backoff` delay does not exceed the remaining time until the deadline.

**Reason:** If the backoff delay pushes the next attempt past the deadline, the job is released to the queue but fails immediately when picked up — wasting a queue cycle and creating a confusing failure entry.

**Bad Example:**
```php
public function retryUntil(): \DateTime
{
    return CarbonImmutable::now()->addMinutes(2);
}
public $backoff = 300; // 5 minutes — always past the deadline on retry
```

**Good Example:**
```php
public function retryUntil(): \DateTime
{
    return CarbonImmutable::now()->addMinutes(5);
}
public $backoff = [10, 30, 60]; // All delays are well within the 5-minute window
```

**Exceptions:** When using a dynamic backoff closure that adjusts based on remaining time, the check is built in.

**Consequences Of Violation:** Jobs are re-queued with a delay but fail immediately on pickup because the deadline has passed. Wasted queue cycles, misleading failure logs.

---

## Rule 4

**Rule Name:** specify-timezone-in-business-deadlines

**Category:** Always

**Rule:** Always specify the timezone explicitly when `retryUntil()` encodes a business-hours deadline.

**Reason:** Server timezone may differ from business timezone. `Carbon::now()` reads the application timezone (`config('app.timezone')`), but "5 PM" might mean 5 PM Eastern, not UTC.

**Bad Example:**
```php
public function retryUntil(): \DateTime
{
    return CarbonImmutable::now()->setTime(17, 0, 0); // 5 PM in whatever timezone the server uses
}
```

**Good Example:**
```php
public function retryUntil(): \DateTime
{
    return CarbonImmutable::now('America/New_York')->setTime(17, 0, 0);
}
```

**Exceptions:** When the application timezone is already set to the business timezone and all servers are configured identically.

**Consequences Of Violation:** Job stops retrying at the wrong hour. 5 PM UTC vs 5 PM EST is a 5-hour difference. Business operations may fail during actual business hours or retry deep into the night.

---

## Rule 5

**Rule Name:** test-deadlines-with-time-travel

**Category:** Prefer

**Rule:** Prefer testing `retryUntil()` behavior using time travel (`Carbon::setTestNow()`, Pest `travelTo()`) rather than real-time waits.

**Reason:** A 15-minute deadline test should not take 15 minutes to run. Time travel enables millisecond verification of deadline-based behavior.

**Bad Example:**
```php
test('job stops retrying after deadline', function () {
    // No time travel — test either waits 15 minutes or doesn't test deadline
})->skip();
```

**Good Example:**
```php
test('job stops retrying after deadline', function () {
    Carbon::setTestNow(now());
    $job = new ProcessPayment('pay_123');

    $response = $job->retryUntil();
    expect($response)->toBeGreaterThan(now());

    Carbon::setTestNow(now()->addMinutes(20));
    expect($job->retryUntil())->toBeLessThanOrEqual(now());
});
```

**Exceptions:** Integration tests that verify real queue worker retry behavior may require real waits, but these should be rare and use short deadlines (seconds).

**Consequences Of Violation:** Slow test suites, skipped deadline tests, untested retry behavior, production bugs from untested deadline logic.
