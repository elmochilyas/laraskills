# ECC Anti-Patterns — Global Middleware Stack

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Middleware Pipeline |
| **Knowledge Unit** | Global Middleware Stack |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Adding Custom Middleware to Global Unnecessarily
2. Removing Default Global Middleware Without Understanding
3. Heavy Middleware in Global Stack
4. Not Ordering Global Middleware Correctly
5. API Routes with Session Middleware

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — global middleware affects all requests, not specific data
- Premature Caching — N/A

---

## Anti-Pattern 1: Adding Custom Middleware to Global Unnecessarily

### Category
Performance

### Description
Adding middleware to the global stack that only applies to certain routes.

### Why It Happens
Developers add middleware to global as the default location without considering scope.

### Warning Signs
- 10+ middleware in global stack
- Middleware that only applies to specific routes in global
- Health check endpoints running heavy middleware

### Why It Is Harmful
Global middleware runs on 100% of requests. Adding route-specific middleware to the global stack affects API routes, health checks, webhooks — increasing latency for all traffic.

### Preferred Alternative
Add middleware at the most specific level: route > group > global.

### Detection Checklist
- [ ] Route-specific middleware in global stack
- [ ] Health checks running heavy middleware
- [ ] API routes paying session/cookie cost

### Related Rules
Global Middleware (05-rules.md): N/A

---

## Anti-Pattern 2: Removing Default Global Middleware Without Understanding

### Category
Reliability

### Description
Removing `EncryptCookies`, `StartSession`, or `SubstituteBindings` from global without understanding the consequences.

### Preferred Alternative
Add custom middleware instead of removing defaults.

### Detection Checklist
- [ ] Default global middleware removed
- [ ] Session/auth/CORS broken

---

## Anti-Pattern 3: Heavy Middleware in Global Stack

### Category
Performance

### Description
Placing DB-dependent or API-calling middleware in the global stack.

### Preferred Alternative
Keep global stack lightweight.

### Detection Checklist
- [ ] Database queries in global middleware
- [ ] HTTP calls in global middleware

---

## Anti-Pattern 4: Not Ordering Global Middleware Correctly

### Category
Reliability

### Description
TrustProxies placed after IP-dependent middleware.

### Preferred Alternative
Order infrastructure middleware first (TrustProxies, maintenance mode).

### Detection Checklist
- [ ] IP-dependent middleware before TrustProxies
- [ ] Wrong IP resolution

---

## Anti-Pattern 5: API Routes with Session Middleware

### Category
Performance

### Description
API routes running session and cookie middleware.

### Preferred Alternative
Move session/cookie middleware out of global into `web` group for API-only applications.

### Detection Checklist
- [ ] API routes with session overhead
- [ ] Unnecessary file/Redis I/O
