# Decision Trees — Rate Limit Testing

## Tree 1: Rate Limit Exhaustion Test Approach

**Decision Context**: How to construct rate limit exhaustion tests — low limit configuration vs production limits vs clock manipulation.

**Decision Criteria**:
- Time window length (per minute vs per hour)
- Cache driver persistence requirements
- Test execution time budget

**Decision Tree**:
```
Can you configure a low rate limit for testing (throttle:5,1)?
├── YES → Use low limit (5 requests per minute) — send 5 successful requests + 1 more → assert 429
└── NO → Is the rate limit enforced per-minute or longer?
    ├── Per-minute → Send limit+1 requests sequentially; still feasible for up to 60 requests
    └── Per-hour or longer → Use Carbon::setTestNow() to manipulate time; send requests, fast-forward, send more
```

**Rationale**: Low test limits minimize request count per test. Time manipulation simulates long windows without waiting. Production-level limits make tests impractically slow.

**Recommended Default**: `throttle:5,1` configuration in test environment; send 6 requests → last returns 429.

**Risks**: Testing with `throttle:0,1` is interpreted as unlimited in some Laravel versions. Always set explicit low limits.

---

## Tree 2: Cache Driver Selection for Rate Limit Tests

**Decision Criteria**:
- Rate limit state persistence across requests within a single test
- Cache isolation between test classes
- CI environment cache availability

**Decision Tree**:
```
Is the default cache driver array?
├── YES → Change to file or redis for rate limit tests — array driver resets state between requests
└── NO → Is the cache driver shared with other tests?
    ├── YES → Use Cache::flush() in setUp() to prevent state bleed between test classes
    └── NO → Isolated cache is fine; ensure Cache::flush() between rate limit test classes
```

**Rationale**: The `array` cache driver resets between HTTP requests within a single test, making rate limit exhaustion impossible. Rate limit testing requires persistent cache across sequential requests.

**Recommended Default**: `CACHE_DRIVER=file` in phpunit.xml for rate limit tests; `Cache::flush()` in `setUp()`.

**Risks**: Using `array` cache causes rate limit tests to pass incorrectly (never reach 429). Using shared cache without flushing causes intermittent spillover failures.
