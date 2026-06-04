# Decision Trees — Rate Limiting Strategies

## Tree 1: Rate Limiter Selection

**Decision Context**: Choosing between `throttle` middleware and custom rate limiters.

**Decision Criteria**:
- Multiple rate limit configurations needed
- Role-based or tiered limits
- Dynamic limits based on user attributes

**Decision Tree**:
```
Are static limits sufficient (all users get the same limit)?
├── YES → Is a single limit needed for the endpoint?
│   ├── YES → Use throttle:60,1 — simple roll-your-own syntax
│   └── NO → Use named rate limiter with RateLimiter facade — multiple named configs
└── NO → Are limits dynamic based on user role/tier/user attributes?
    ├── YES → Use named rate limiter with dynamic closure — return different limits per user
    └── NO → Is there a need for separate limits per action for the same endpoint?
        ├── YES → Use named rate limiters with different names per action
        └── NO → Use throttle middleware — simplest option
```

**Rationale**: Static limits use `throttle` middleware. Dynamic limits need named rate limiters with closures.

**Recommended Default**: Named rate limiter in `AppServiceProvider::boot()` for flexibility. `throttle` middleware for quick setup.

**Risks**: Static limits don't differentiate user tiers. Named rate limiters without cleanup accumulate unused definitions.

---

## Tree 2: Per-User vs Per-IP Rate Limiting

**Decision Context**: Whether to rate limit by authenticated user or by IP address.

**Decision Criteria**:
- Authentication status
- Abuser identification
- Guest access requirements

**Decision Tree**:
```
Is the user authenticated?
├── YES → Rate limit by user ID — users are identifiable and accountable
└── NO → Is there a guest rate limit needed?
    ├── YES → Rate limit by IP — no user identity available
    └── NO → Does the endpoint require authentication?
        ├── YES → No guest access — only authenticated rate limiting applies
        └── NO → Set separate lower limits for guest IPs and higher limits for authenticated
```

**Rationale**: Per-user is more precise and fair. Per-IP is necessary for unauthenticated access.

**Recommended Default**: Per-user for authenticated endpoints. Per-IP with lower limits for public endpoints.

**Risks**: IP-based limiting penalizes users behind shared IPs (offices, NAT). User-based limiting without guest fallback leaves public endpoints unprotected.
