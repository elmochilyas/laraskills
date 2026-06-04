# Rule Card: K019 — `$backoff` Array for Progressive Delays

---

## Rule 1

**Rule Name:** match-array-to-tries-minus-one

**Category:** Always

**Rule:** Always set `$backoff` array length to exactly `$tries - 1`.

**Reason:** Extra elements are never used and mislead; missing elements silently reuse the last value.

**Bad Example:**
```php
public $tries = 3;
public $backoff = [10, 30, 60, 120]; // 4 elements for 2 retries — last 2 never used
```

**Good Example:**
```php
public $tries = 3;
public $backoff = [10, 30]; // 2 elements for 2 retries
```

**Exceptions:** When the last backoff value is intentionally the maximum and repeating it is fine, the array can be shorter.

**Consequences Of Violation:** Misleading configuration — a reviewer sees 4 backoff values and assumes 5 total attempts, but only 3 are configured.

---

## Rule 2

**Rule Name:** first-backoff-element-greater-than-zero

**Category:** Never

**Rule:** Never set the first `$backoff` array element to 0.

**Reason:** Even transient errors need a moment to resolve — a 0-second first retry re-fails immediately.

**Bad Example:**
```php
public $backoff = [0, 30, 60]; // First retry is immediate — no recovery window
```

**Good Example:**
```php
public $backoff = [10, 30, 60]; // First retry waits 10 seconds — transient errors resolve
```

**Exceptions:** Testing environments where immediate retry behavior needs verification.

**Consequences Of Violation:** The first retry runs immediately — the same transient condition (network glitch, deadlock) is likely still present, causing immediate re-failure and wasting the first retry.

---

## Rule 3

**Rule Name:** prefer-gradual-doubling

**Category:** Prefer

**Rule:** Prefer gradual doubling of backoff values over steep jumps.

**Reason:** Steep jumps either waste time on early retries or cause excessively long waits on later retries.

**Bad Example:**
```php
public $backoff = [5, 600, 3600]; // Steep jump — retry 2 waits 10 minutes
```

**Good Example:**
```php
public $backoff = [10, 20, 40, 80]; // Gradual doubling — smooth progression
```

**Exceptions:** When an external API documents specific retry timing (e.g., "retry after 429 in 60 seconds"), match the documented behavior.

**Consequences Of Violation:** Early retries are too aggressive (no recovery time) and later retries are too conservative (waste time) — the pattern doesn't match real recovery behavior.

---

## Rule 4

**Rule Name:** calculate-total-retry-window

**Category:** Always

**Rule:** Always calculate the total retry window to ensure it fits within SLA.

**Reason:** Sum of backoff delays + total execution time = maximum time before permanent failure — may exceed acceptable limits.

**Bad Example:**
```php
public $tries = 5;
public $backoff = [300, 600, 1800, 3600]; // Total wait: 6300s = 1.75 hours
```

**Good Example:**
```php
public $tries = 4;
public $backoff = [30, 60, 120]; // Total wait: 210s = 3.5 minutes — fits SLA
```

**Exceptions:** Batch processing and non-critical jobs may tolerate longer retry windows.

**Consequences Of Violation:** A critical job takes 2 hours to fail permanently — the user has already received a timeout response and retried, creating duplicates or frustration.
