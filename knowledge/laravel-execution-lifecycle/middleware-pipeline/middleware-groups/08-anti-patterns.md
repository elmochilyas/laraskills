# ECC Anti-Patterns — Middleware Groups

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Middleware Pipeline |
| **Knowledge Unit** | Middleware Groups |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Placing API Routes in routes/web.php
2. Adding Middleware to Default Groups
3. Over-Grouping
4. Forgetting Group Name Registration
5. Not Verifying with route:list -v

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — middleware groups are about request routing, not queries
- Premature Caching — N/A

---

## Anti-Pattern 1: Placing API Routes in routes/web.php

### Category
Reliability

### Description
API routes placed in `routes/web.php` — they get session/cookie/CSRF middleware.

### Why It Happens
Developers don't understand the file-to-group convention.

### Warning Signs
- API routes in `routes/web.php`
- CSRF token errors on API POST requests (419)
- Session overhead on stateless API requests

### Why It Is Harmful
`routes/web.php` routes are assigned the `web` middleware group (session, cookies, CSRF). API routes need stateless token auth. Wrong file = wrong middleware = broken API endpoints.

### Preferred Alternative
Always place API routes in `routes/api.php`.

### Detection Checklist
- [ ] API routes in `routes/web.php`
- [ ] 419 CSRF errors on API
- [ ] Session overhead on stateless requests

### Related Rules
Middleware Groups (05-rules.md): N/A

---

## Anti-Pattern 2: Adding Middleware to Default Groups

### Category
Architecture

### Description
Modifying default `web` or `api` groups instead of creating custom groups.

### Preferred Alternative
Create custom groups for custom middleware sets.

### Detection Checklist
- [ ] Default groups modified
- [ ] Unexpected middleware on existing routes

---

## Anti-Pattern 3: Over-Grouping

### Category
Maintainability

### Description
Creating too many groups — harder to reason about middleware configuration.

### Preferred Alternative
Keep groups aligned with route types (web, api, admin, etc.).

### Detection Checklist
- [ ] 10+ custom middleware groups
- [ ] Confusing middleware hierarchy

---

## Anti-Pattern 4: Forgetting Group Name Registration

### Category
Reliability

### Description
Using a group name that hasn't been registered.

### Preferred Alternative
Use constants or config for group names.

### Detection Checklist
- [ ] `InvalidArgumentException` for unknown group
- [ ] Typo in group name

---

## Anti-Pattern 5: Not Verifying with route:list -v

### Category
Workflow

### Description
Assuming group middleware is correct without inspecting the resolved list.

### Preferred Alternative
Use `php artisan route:list -v` to verify full middleware stack.

### Detection Checklist
- [ ] Hidden middleware in groups not audited
- [ ] Surprise middleware on routes
