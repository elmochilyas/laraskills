# ECC Anti-Patterns — Entry Point Mechanics

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Request Lifecycle |
| **Knowledge Unit** | Entry Point Mechanics |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Application Logic in public/index.php or bootstrap/app.php
2. Skipping Configuration and Route Caching in Production
3. Skipping Optimized Autoloader in Deployment
4. Direct Application Instantiation Outside Entry Point
5. Captured Mutable State in bootstrap/app.php Closures (Octane)

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — entry point runs before providers are booted; no DB access available
- Premature Caching — entry point is the single highest-leverage caching target; skip at your peril

---

## Anti-Pattern 1: Application Logic in public/index.php or bootstrap/app.php

### Category
Architecture

### Description
Placing business logic, conditionals, or service calls directly in `public/index.php` or `bootstrap/app.php` — bypasses the framework's structured lifecycle.

### Why It Happens
Developers treat entry files as convenient hooks for quick logic, not realizing they bypass middleware, providers, and routing entirely.

### Warning Signs
- `if ($_GET['maintenance'])` in `public/index.php`
- Service resolution or database calls in `bootstrap/app.php`
- Custom routing logic before kernel dispatch

### Why It Is Harmful
Under FPM, `public/index.php` runs on every single request. Logic here executes before any framework bootstrapper, middleware, or security check. Maintenance mode checks, redirect logic, or input validation here bypass all framework protection. Under Octane, `public/index.php` runs once per worker — any mutable state set here persists across all requests, causing data leakage.

### Preferred Alternative
Place application logic in middleware, service providers, or controllers — never in entry point files.

### Detection Checklist
- [ ] Business logic in `public/index.php`
- [ ] Service resolution in `bootstrap/app.php`
- [ ] Conditional dispatch logic at entry point

### Related Rules
Keep Entry Point Files Lean (05-rules.md)

---

## Anti-Pattern 2: Skipping Configuration and Route Caching in Production

### Category
Performance

### Description
Deploying to production without running `config:cache`, `route:cache`, and `event:cache` — 30-80ms cold bootstrap overhead per request.

### Preferred Alternative
Run all caching commands in the deployment pipeline.

### Detection Checklist
- [ ] No config cache in production
- [ ] 30-80ms bootstrap time
- [ ] High TTFB under load

---

## Anti-Pattern 3: Skipping Optimized Autoloader in Deployment

### Category
Performance

### Description
Running `composer install` without `--optimize-autoloader` — PSR-4 filesystem fallback adds 5-15ms per request.

### Preferred Alternative
Always use `composer install --no-dev --optimize-autoloader` in CI/CD.

### Detection Checklist
- [ ] `composer dump-autoload -o` not in deployment script
- [ ] Classmap not generated
- [ ] Autoloader overhead >5ms

---

## Anti-Pattern 4: Direct Application Instantiation Outside Entry Point

### Category
Architecture

### Description
Calling `new Application()` or `Application::configure()` outside `bootstrap/app.php` — breaks the singleton contract.

### Preferred Alternative
Always require the application from `bootstrap/app.php`.

### Detection Checklist
- [ ] `new Application()` in application code
- [ ] Duplicate singleton bindings
- [ ] Mysterious state corruption

---

## Anti-Pattern 5: Captured Mutable State in bootstrap/app.php Closures (Octane)

### Category
Reliability

### Description
Closures in `bootstrap/app.php` capturing mutable variables from file scope — leaks state across all requests on the same Octane worker.

### Preferred Alternative
Avoid mutable captured variables. Keep closures referentially transparent.

### Detection Checklist
- [ ] Mutable variables captured in closures
- [ ] Request-to-request state leakage under Octane
- [ ] Non-deterministic behavior
