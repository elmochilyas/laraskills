# ECC Anti-Patterns — API-Specific Middleware

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | API & CRUD System Engineering |
| **Subdomain** | API Authentication & Authorization |
| **Knowledge Unit** | API-Specific Middleware |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. ForceJson in Global Middleware Stack
2. Synchronous Database Audit Inserts Under Load
3. Audit Middleware After Rate Limiting
4. Logging Sensitive Data in Audit Logs
5. Monolithic Middleware Violating Single Responsibility

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries

---

## Anti-Pattern 1: ForceJson in Global Middleware Stack

### Category
Architecture

### Description
Registering the ForceJson middleware in the global middleware stack instead of the `api` middleware group, causing all web routes (Blade, Inertia) to return JSON error responses instead of HTML views.

### Why It Happens
Developers follow "add middleware globally" patterns without considering route-specific impacts. The convenience of a single registration point overrides awareness of web route breakage.

### Warning Signs
- Web routes returning JSON instead of HTML views
- Inertia pages showing raw JSON response
- `Accept: application/json` header forced on all routes including web
- Middleware registered in `$middleware` (global) instead of middleware groups

### Why It Is Harmful
Web routes serving HTML views break completely. Blade templates render as JSON errors. Inertia responses fail. Session-based authentication redirects are replaced with JSON 401 responses. The entire web UI becomes non-functional.

### Real-World Consequences
A simple UI update stops working because all web responses return JSON. Users see raw JSON error messages. The issue is hard to diagnose because middleware ordering isn't visible in route files.

### Preferred Alternative
Register ForceJson only in the `api` middleware group using `$middleware->api(prepend: [ForceJsonMiddleware::class])`.

### Refactoring Strategy
1. Move ForceJson from global middleware to `api` group in `bootstrap/app.php`
2. Test web routes return HTML correctly
3. Test API routes return JSON correctly
4. Verify error responses on API routes return JSON format

### Detection Checklist
- [ ] Check `bootstrap/app.php` for global middleware registration
- [ ] Verify ForceJson is in `$middleware->api()` not `$middleware->prepend()`
- [ ] Test a web route returns HTML, not JSON

### Related Rules
- Always Include ForceJson in the API Middleware Group (05-rules.md)
- Never Place ForceJson in the Global Middleware Stack (05-rules.md)

### Related Skills
- Implement API-Specific Middleware (06-skills.md)

### Related Decision Trees
- ForceJson Middleware Placement — API Group vs Global Stack (07-decision-trees.md)

---

## Anti-Pattern 2: Synchronous Database Audit Inserts Under Load

### Category
Performance

### Description
Writing audit log entries to the database synchronously within middleware using `ApiAudit::create([...])`, creating a database bottleneck that blocks every API response until the write completes.

### Why It Happens
The simplest implementation (an Eloquent `create` call) is the first thing developers write. Performance implications are not visible at low traffic volumes during development.

### Warning Signs
- `ApiAudit::create()` or `AuditLog::create()` in middleware code
- Database connection pool exhaustion during traffic spikes
- Increased p99 latency correlating with DB write load
- Audit writes failing during high-throughput periods

### Why It Is Harmful
Every API request waits for a database INSERT to complete before the response is sent. Under load, the database connection pool fills with audit write queries, starving read queries. Response latency increases proportionally to write volume.

### Real-World Consequences
During a traffic spike, audit middleware saturates database connections. Read queries for actual API responses time out. The API becomes unavailable not because of business logic but because of audit logging.

### Preferred Alternative
Use asynchronous log channels (Redis, ELK) via `Log::channel('redis')->info(...)` for audit entries. For low-traffic APIs (<100 req/s), synchronous DB inserts are acceptable.

### Refactoring Strategy
1. Replace synchronous DB insert with async log channel
2. Configure Redis/ELK log channel in `config/logging.php`
3. Implement a separate consumer to persist audit data from the log stream
4. Add monitoring for audit log pipeline failures
5. Set up log retention policies (30-90 days)

### Detection Checklist
- [ ] Search for `::create(` or `::insert(` in middleware files
- [ ] Audit middleware is not implemented through synchronous DB writes
- [ ] Verify async logging channel configuration

### Related Rules
- Implement Audit Middleware with Async Storage (05-rules.md)

### Related Skills
- Implement API-Specific Middleware (06-skills.md)

### Related Decision Trees
- Audit Storage — Synchronous DB vs Async Logging (07-decision-trees.md)

---

## Anti-Pattern 3: Audit Middleware After Rate Limiting

### Category
Architecture

### Description
Placing audit middleware after (inside of) rate limiting middleware so that rate-limited requests (429 responses) are never logged, creating a blind spot for abuse detection.

### Why It Happens
Middleware ordering seems natural — rate limiting near the controller, audit logging afterward. The implication that 429s are not logged is overlooked.

### Warning Signs
- `throttle:api` registered before audit middleware in the middleware chain
- 429 responses do not appear in audit logs
- Abuse ramps preceding rate limit activation are invisible
- Security team cannot analyze pre-throttle request patterns

### Why It Is Harmful
Attackers often probe endpoints with increasing frequency before hitting rate limits. Without audit logs for 429 responses, security teams cannot detect these patterns. The rate limit configuration itself becomes untuned because pre-limit request data is missing.

### Real-World Consequences
An attacker gradually increases request frequency over hours. Each request slightly below the limit passes audit logging. When they exceed the limit, the 429 response is not logged. The attack pattern is invisible until a manual threshold review.

### Preferred Alternative
Register audit middleware before rate limiting in the middleware chain: `$middleware->api(prepend: [AuditMiddleware::class, 'throttle:api'])`.

### Refactoring Strategy
1. Reorder middleware to place audit before rate limiting
2. Verify 429 responses appear in audit logs
3. Add rate limit event tracking to audit data (whether the request was throttled)
4. Set up monitoring for unusual 429 patterns

### Detection Checklist
- [ ] Check middleware ordering in `bootstrap/app.php`
- [ ] Verify audit logs contain 429 responses
- [ ] Confirm rate limiting does not gate audit logging

### Related Rules
- Run Audit Middleware Before Rate Limiting (05-rules.md)

### Related Skills
- Implement API-Specific Middleware (06-skills.md)

### Related Decision Trees
- (Middleware ordering is embedded in the audit storage decision tree context)

---

## Anti-Pattern 4: Logging Sensitive Data in Audit Logs

### Category
Security

### Description
Including sensitive information (Authorization headers, passwords, credit card numbers, PII) in audit log entries, creating a compliance violation and expanding the breach surface.

### Why It Happens
Developers log the full request context for debugging convenience. `$request->headers->all()` or `$request->all()` is used without filtering. The sensitivity of log storage is underestimated.

### Warning Signs
- `$request->headers->all()` logged in audit middleware
- `$request->all()` or `$request->input()` written to logs
- Full request body included in audit entries
- Authorization header values visible in log aggregation systems

### Why It Is Harmful
Audit logs are often stored longer than application data and replicated to SIEM systems. Log storage typically has weaker access controls than primary databases. Breached log storage exposes credentials, financial data, and personal information. This violates PCI-DSS (card data in logs), GDPR (PII in logs), and SOC 2 requirements.

### Real-World Consequences
An attacker gains access to log aggregation system (e.g., ELK, Splunk) through compromised credentials. All stored Authorization tokens, credit card numbers, and personal data are extracted. The breach is considered more severe because it involves sensitive data that should never have been logged.

### Preferred Alternative
Explicitly exclude sensitive fields from audit logs. Log only metadata: method, URL, status, duration, request_id, user_id. Never log request bodies or Authorization headers.

### Refactoring Strategy
1. Review all audit log statements for sensitive data inclusion
2. Create an allowlist of safe fields to log
3. Implement a sanitizer that strips known sensitive fields
4. Review existing stored logs for sensitive data exposure
5. Implement log retention and rotation policies (30-90 days)

### Detection Checklist
- [ ] Search for `->headers->all()` in middleware
- [ ] Search for `->all()` in logging context
- [ ] Verify audit log entries do not contain Authorization/Bearer tokens
- [ ] Check log storage access controls

### Related Rules
- Strip Sensitive Data from Audit Logs (05-rules.md)

### Related Skills
- Implement API-Specific Middleware (06-skills.md)

### Related Decision Trees
- (Security considerations are covered in the skills security considerations section)

---

## Anti-Pattern 5: Monolithic Middleware Violating Single Responsibility

### Category
Code Organization

### Description
Creating a single middleware class that handles version detection, audit logging, security headers, response timing, and request ID generation — violating the Single Responsibility Principle and making testing, maintenance, and selective application difficult.

### Why It Happens
The "add another concern to existing middleware" pattern feels efficient. Developers avoid creating multiple files and registering many middleware classes.

### Warning Signs
- A single middleware class exceeds 100 lines
- Middleware has multiple public methods beyond `handle()`
- Different concerns are toggled by constructor parameters or configuration
- Tests for the middleware are large and cover unrelated behaviors
- Removing or replacing one concern requires changing the shared middleware

### Why It Is Harmful
Testing individual behaviors becomes impossible without testing everything. Selective application to different route groups is prevented. Changes to one concern risk breaking others. Adding a new developer requires understanding the entire monolithic middleware before making changes.

### Real-World Consequences
A bug in the version detection logic blocks a hotfix for a security header vulnerability because they share the same middleware class. The two concerns cannot be deployed independently.

### Preferred Alternative
Create one middleware class per cross-cutting concern: `ForceJsonMiddleware`, `AddRequestIdMiddleware`, `AuditMiddleware`, `ResponseTimingMiddleware`, `SecurityHeadersMiddleware`. Consolidate only security headers (they always apply together).

### Refactoring Strategy
1. Identify each distinct concern in the monolithic middleware
2. Extract each concern into its own middleware class
3. Register each new middleware separately in the API group
4. Write isolated tests for each middleware
5. Verify middleware ordering is preserved after extraction

### Detection Checklist
- [ ] List distinct responsibilities in each middleware class
- [ ] Verify each middleware has exactly one concern
- [ ] Check middleware tests — do they test multiple unrelated behaviors?

### Related Rules
- (Middleware SRP is embedded in skills workflow: "Create middleware per concern")

### Related Skills
- Implement API-Specific Middleware (06-skills.md)

### Related Decision Trees
- Middleware Organization — Single Concern per Middleware vs Consolidated (07-decision-trees.md)

---
