# Front Controller — Anti-Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | Backend Architecture & Design |
| Subdomain | Design Patterns & Principles |
| Knowledge Unit | Front Controller pattern |
| Anti-Pattern Count | 4 |

## Repository-Wide Anti-Patterns

| # | Name | Severity |
|---|------|----------|
| 1 | Adding Logic to index.php | Critical |
| 2 | Bypassing Front Controller | High |
| 3 | Duplicating Front Controller Logic in Page Controllers | Medium |
| 4 | Misunderstanding Middleware Order | Medium |

---

## 1. Adding Logic to index.php

### Category
Architecture

### Description
Placing application logic directly in the front controller entry point (`public/index.php`), making it untestable and bypassing the framework lifecycle.

### Why It Happens
Quick fixes, hot patches, or early optimizations placed in index.php to run "before everything else."

### Warning Signs
- Custom code in `public/index.php`
- Environment-specific checks at entry point
- Debug or diagnostic logic in bootstrap files
- business logic executed before framework bootstrap

### Why Harmful
Code in index.php cannot be tested, bypasses middleware and routing, and cannot utilize framework services.

### Consequences
- Code not testable
- Bypasses middleware pipeline
- Hard to maintain
- Creates hidden dependencies

### Alternative
Use middleware, service providers, or bootstrap callbacks for pre-request logic. Keep index.php as the minimal bootstrap entry point.

### Refactoring Strategy
1. Identify logic in index.php
2. Move to appropriate middleware or service provider
3. Ensure same execution order is preserved
4. Write tests for moved logic

### Detection Checklist
- [ ] Review index.php for custom code
- [ ] Check for testability of entry point logic
- [ ] Verify middleware pipeline covers all pre-processing needs

### Related Rules/Skills/Trees
- Rules: Enforce Boundaries via Automation
- Skills: Front Controller, Middleware

---

## 2. Bypassing Front Controller

### Category
Architecture

### Description
Creating routes or entry points that bypass the front controller entry point, missing middleware processing, routing, and framework bootstrapping.

### Why It Happens
Creating custom `.php` files in the public directory, using symlinks, or direct script execution that doesn't go through index.php.

### Warning Signs
- Custom `.php` entry points in public directory
- Direct file access to scripts
- Missing middleware on certain endpoints
- Routes that work inconsistently

### Why Harmful
Middleware (auth, CSRF, rate limiting) is not applied. Route caching is ineffective. Framework services are not available.

### Consequences
- Security issues (bypassed auth middleware)
- Inconsistent request handling
- Missed CSRF protection
- Missing rate limiting

### Alternative
Use the framework's routing layer for all endpoints. All HTTP requests must go through index.php.

### Refactoring Strategy
1. Identify bypassed routes
2. Convert to framework routes with controllers
3. Add appropriate middleware
4. Remove custom entry point files
5. Verify all middleware is applied

### Detection Checklist
- [ ] Scan public directory for custom entry points
- [ ] Verify all endpoints go through router
- [ ] Check middleware consistency

### Related Rules/Skills/Trees
- Skills: Front Controller, Routing
- Decision Trees: Middleware Architecture

---

## 3. Duplicating Front Controller Logic in Page Controllers

### Category
Architecture

### Description
Individual controllers reimplementing front controller behavior (auth checks, logging, session setup) that should be handled centrally.

### Why It Happens
Developers not trusting or understanding the middleware pipeline add redundant checks in each controller.

### Warning Signs
- Identity auth checks repeated across controllers
- Duplicate logging setup in multiple controllers
- Session initialization in each controller
- Inconsistent security checks

### Why Harmful
Repeated logic creates maintenance burden, inconsistent behavior, and security gaps when one controller forgets a check.

### Consequences
- Code duplication
- Inconsistent behavior
- Security gaps
- Higher maintenance cost

### Alternative
Move cross-cutting concerns to middleware or base controller methods. Route middleware handles auth, logging, etc., before controllers execute.

### Refactoring Strategy
1. Identify duplicated logic across controllers
2. Move to middleware or route groups
3. Remove duplicated code from controllers
4. Add tests for middleware behavior

### Detection Checklist
- [ ] Scan controllers for duplicated setup logic
- [ ] Verify middleware covers all concerns
- [ ] Check for inconsistent security checks

### Related Rules/Skills/Trees
- Rules: Prefer Composition Over Inheritance
- Skills: Front Controller, Middleware

---

## 4. Misunderstanding Middleware Order

### Category
Operations

### Description
Incorrectly ordering global and route middleware, causing authentication checks to execute before session initialization or CSRF protection to run on the wrong routes.

### Why It Happens
Laravel's middleware execution order (global → route middleware groups → route-specific) is misunderstood, especially between `web` and `api` groups.

### Warning Signs
- Auth middleware before session middleware
- CSRF on API routes
- Rate limiting order confusion
- Middleware groups executed in wrong order

### Why Harmful
Wrong middleware order causes security issues: sessions not available when auth runs, CSRF not protecting web routes, or rate limiting not applied correctly.

### Consequences
- Authentication failures
- CSRF vulnerabilities
- Session issues
- Wrong middleware behavior

### Alternative
Understand Laravel's middleware execution order: (1) global middleware, (2) route middleware groups (web → subs), (3) route middleware. Document intended order.

### Refactoring Strategy
1. Document current middleware order
2. Review against intended behavior
3. Fix ordering in `Kernel.php`
4. Add integration tests for middleware sequence

### Detection Checklist
- [ ] Review Kernel.php middleware order
- [ ] Verify session readiness before auth
- [ ] Check CSRF on non-API routes
- [ ] Test middleware execution sequence

### Related Rules/Skills/Trees
- Skills: Front Controller, Middleware
- Decision Trees: Middleware Architecture
