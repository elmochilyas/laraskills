# Pre-and-Post-Middleware Code — Decision Trees

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Middleware Pipeline
- **KU:** Pre-and-Post-Middleware Code
- **Last Updated:** 2026-06-02

---

## Decision Inventory

| # | Decision | Typical Context | Impact |
|---|----------|-----------------|--------|
| 1 | Pre-middleware vs post-middleware placement | Choosing where logic goes relative to `$next($request)` | Correctness; performance; security |
| 2 | Pre/post in one middleware vs split into two | Related inbound/outbound logic | Cohesion; reusability; testability |
| 3 | Short-circuit guard placement | Putting guard middleware before or after other middleware | Security; audit completeness |

---

## Decision 1: Pre-Middleware vs Post-Middleware Placement

### Decision Context
A piece of middleware logic can run on the inbound request (pre) or the outbound response (post). Choose the correct side of `$next($request)`.

### Decision Criteria
- **Reads/modifies request?** → Pre-middleware (before `$next`)
- **Reads/modifies response?** → Post-middleware (after `$next`)
- **Blocks unauthorized access?** → Pre-middleware (before controller)
- **Logs/records outcome?** → Post-middleware (after response known)
- **Needs to short-circuit?** → Pre-middleware (return early)
- **Both request and response access needed?** → Both sides (CORS, timing)

### Decision Tree
```
Where does this logic belong?
├── Operates on the REQUEST (inbound)
│   ├── Authentication, validation, rate limiting
│   │   └── PRE-middleware — before $next($request)
│   ├── Request transformation (trim strings, encrypt cookies)
│   │   └── PRE-middleware — modify request before downstream
│   └── Request logging (capture method, path, headers)
│       └── PRE-middleware — log before processing
├── Operates on the RESPONSE (outbound)
│   ├── Response headers (CORS, cache-control, security headers)
│   │   └── POST-middleware — after $next($request)
│   ├── Response transformation (compress, format)
│   │   └── POST-middleware — modify response after it's built
│   └── Response logging (status, duration)
│       └── POST-middleware — log after response built
├── Operates on BOTH (CORS, timing)
│   ├── CORS: check Origin inbound, set headers outbound
│   │   └── BOTH pre AND post — keep in one middleware
│   └── Timing: start timer pre, log duration post
│       └── BOTH pre AND post — keep in one middleware
└── Guards that may short-circuit
    └── PRE-middleware — return early before controller
```

### Rationale
Pre-middleware runs before the controller and can short-circuit the pipeline. Post-middleware runs after the controller and can only run if the controller completed successfully. The distinction is fundamental — placing the wrong type of logic on the wrong side causes bugs (modifying non-existent response in pre-middleware) or security issues (auth in post-middleware never runs on short-circuited requests).

### Default
Auth, validation, rate limiting → pre-middleware. Response headers, logging, transformations → post-middleware.

### Risks
- Response modification in pre-code: response doesn't exist yet — no effect
- Auth in post-code: runs after controller — too late for protection
- Post-code that assumes success: short-circuit bypasses it silently

### Related Rules/Skills
- Always Understand That Post-Code Only Runs on Successful Completion
- Never Modify or Access the Response in Pre-Middleware Code
- Skill: Implement Pre- and Post-Middleware Code

---

## Decision 2: Pre/Post in One Middleware vs Split Into Two

### Decision Context
Middleware has both inbound and outbound logic. Decide whether to keep them together in one class or split into separate middleware.

### Decision Criteria
- **Logical coupling**: Inbound check enables outbound action → keep together; independent → split
- **Reusability**: Each side used independently → split; always together → keep together
- **SRP**: Single responsibility → split if concerns differ; cross-cutting pair → keep together
- **Configuration**: Same configuration needed for both → keep together; different → split

### Decision Tree
```
Related pre and post logic?
├── Pre and post are LOGICALLY COUPLED
│   ├── CORS: check Origin inbound, set Allow-Origin outbound
│   │   └── KEEP TOGETHER — one concern, cross-cutting pair
│   ├── Request timing: start timer pre, log duration post
│   │   └── KEEP TOGETHER — one timing concern
│   └── Session: decrypt cookie pre, persist session post
│       └── KEEP TOGETHER — one session concern
├── Pre and post are INDEPENDENT concerns
│   ├── Pre: auth check; Post: response compression
│   │   └── SPLIT — different responsibilities, independently reusable
│   ├── Pre: rate limiting; Post: response logging
│   │   └── SPLIT — no logical connection
│   └── Pre: input validation; Post: response caching
│       └── SPLIT — separate concerns
├── Pre is guard, post is observation
│   ├── Auth pre, audit post
│   │   └── SPLIT — auth should be independently testable
│   └── Configurable: both use same guard name
│       └── KEEP TOGETHER — shared configuration, simpler registration
└── Testing implications
    ├── One middleware class → one test file, fewer tests
    └── Two middleware classes → separate tests, more granular
```

### Rationale
Keep pre and post together when they represent a single cross-cutting concern that needs both inbound and outbound processing (CORS, timing, session). Split them when the pre and post operations address different concerns (auth vs logging). The decision should follow single-responsibility principle at the concern level, not the method level.

### Default
Keep logically coupled pre/post pairs in one middleware. Split independent concerns into separate middleware classes.

### Risks
- Splitting a coupled pair: need to ensure ordering guarantees (CORS check before CORS response headers)
- Keeping independent concerns together: violates SRP, harder to test and reuse
- State sharing between pre and post: instance variables work within one class but not across two

### Related Rules/Skills
- Keep Related Pre/Post Logic in the Same Middleware
- Keep Each Pipe Focused on a Single Concern
- Skill: Implement Pre- and Post-Middleware Code

---

## Decision 3: Short-Circuit Guard Placement

### Decision Context
A middleware may short-circuit (return early without calling `$next`). Decide where to place it in the middleware stack relative to other middleware.

### Decision Criteria
- **What does the guard do?** Auth, rate limit, maintenance → early in stack; Observation → late
- **What should NOT run if guard fails?** All downstream middleware → early; Only the controller → just before route
- **Logging requirement**: Must log all requests (including rejected) → logging before guards; Only successful → after guards
- **Short-circuit cost**: Expensive to reject late (wasted processing) → early

### Decision Tree
```
Where to place short-circuit guard middleware?
├── Auth guard (most common)
│   ├── Must reject unauthenticated before ANY processing
│   │   └── Place EARLY in middleware stack
│   ├── Benefits: saves DB queries, prevents unnecessary work
│   └── Exceptions: logging middleware should go before auth (to log all requests)
├── Rate limit guard
│   ├── Should reject before heavy processing
│   │   └── Place EARLY but AFTER auth (so we know who's being rate-limited)
│   └── Rate limiting by IP → before auth; by user → after auth
├── Maintenance mode guard
│   ├── Must block EVERYTHING
│   │   └── Place FIRST in the stack — no processing at all
│   └── Before even logging — app is down
├── Observation/logging middleware
│   ├── Must log ALL requests (including rejected by auth)
│   │   └── Place BEFORE auth guard
│   ├── Must log only SUCCESSFUL requests
│   │   └── Place AFTER auth guard (post-code only runs on success)
│   └── Mixed: log start pre-code, log completion post-code
│       └── Pre logs all, post logs only successful
└── Resource-intense guards (DB lookup, API call)
    ├── Place AFTER cheaper guards (auth, rate limit)
    └── Don't waste expensive checks on already-rejected requests
```

### Rationale
Short-circuit guards should be placed as early as possible to save processing on rejected requests. However, logging and audit middleware may need to run before guards to capture all requests (including rejected ones). The ordering trade-off is between efficiency (early rejection) and completeness (logging all attempts).

### Default
Auth first (to reject early and save resources), then rate limiting, then resource-intensive guards. Logging before auth if all requests must be logged.

### Risks
- Auth too early: no request logging at all for rejected requests
- Auth too late: wasted processing on unauthenticated requests
- Expensive guard before cheap checks: resource waste on easily-rejected requests

### Related Rules/Skills
- Always Understand That Post-Code Only Runs on Successful Completion
- Keep Pre-Middleware Fast to Minimize TTFB Impact
- Skill: Implement Pre- and Post-Middleware Code
