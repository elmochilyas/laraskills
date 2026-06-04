# Decision Trees — Rate Limit Error Responses

## Tree 1: Limiter Type Selection

**Decision Context**: Choosing which rate limiter(s) to configure for a given API endpoint.

**Decision Criteria**:
- Endpoint sensitivity (auth vs general)
- Authentication tier (guest vs authenticated vs premium)
- Resource intensity
- Abuse risk

**Decision Tree**:
```
Is the endpoint authentication-related (login, register, password reset)?
├── YES → Use a dedicated AUTH rate limiter — stricter limits (5/10 per minute), separate from general API
└── NO → Is the endpoint general API?
    ├── YES → Does the endpoint serve different tiers of users (guest, authenticated, premium)?
    │   ├── YES → Use tier-specific limiters — guests 30/min, authenticated 60/min, premium 300/min
    │   └── NO → Use a general API limiter — 60/min standard
    └── NO → Is the endpoint resource-intensive (report generation, batch operations)?
        ├── YES → Use a dedicated endpoint-specific limiter — lower limits, protects server resources
        └── NO → General API limiter
```

**Rationale**: Different endpoints have different abuse profiles and capacity requirements. Separating limiters prevents auth brute force from blocking general API access.

**Recommended Default**: Auth endpoints: 5/min per IP. General API: 60/min per user. Premium: 300/min per user.

**Risks**: Single limiter for all endpoints allows auth brute force to exhaust the general API budget. Too many distinct limiters create configuration complexity.

---

## Tree 2: Retry-After Calculation

**Decision Context**: How to calculate the Retry-After value for 429 responses.

**Decision Criteria**:
- Rate limiter configuration (per-minute vs per-hour)
- Cache backend
- Consumer fairness

**Decision Tree**:
```
Is the rate limit configured as requests per minute?
├── YES → Retry-After = seconds until the next window starts (60 - seconds_elapsed_in_window)
└── NO → Is the rate limit configured as requests per hour?
    ├── YES → Retry-After = seconds until the next hour window starts
    └── NO → Is the rate limit a rolling window (e.g., 100 requests per 60 seconds)?
        ├── YES → Retry-After = time until the oldest request in the window expires
        └── NO → Retry-After = 60 (safe default — one minute)
```

**Rationale**: Retry-After should be the exact seconds until the client can make another request. This enables precise client backoff.

**Recommended Default**: Calculate from the rate limiter's window boundary. Never hardcode a fixed value.

**Risks**: Fixed Retry-After values waste retry opportunities or cause premature retries. Overly precise Retry-After calculation adds complexity.
