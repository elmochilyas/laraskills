# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Job Middleware
- **Knowledge Unit:** K090 — `make:job-middleware` Artisan Command
- **Knowledge ID:** K090
- **Difficulty Level:** Foundation
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Artisan: make:job-middleware
  - Laravel Source — `Illuminate\Foundation\Console\JobMiddlewareMakeCommand`

---

# Overview

`php artisan make:job-middleware` (Laravel 11+) generates a custom job middleware class stub in `app/Queue/Middleware/`. The generated class includes the `handle($job, $next)` method with the standard pipeline pattern. This reduces boilerplate and enforces the correct interface implementation.

---

# Core Concepts

- **Namespace:** Generated in `App\Queue\Middleware\{MiddlewareName}`.
- **Stub content:** Class implementing the pipeline pattern with `handle($job, $next)`.
- **Directory auto-creation:** `app/Queue/Middleware/` is created if it doesn't exist.
- **`middleware()` method:** Return an instance from the job's `middleware()` to use it.

---

# When To Use

- Creating any new custom job middleware
- Teams wanting consistent middleware structure and discoverability

---

# When NOT To Use

- Trivial inline callbacks in `middleware()` — don't need a whole class
- When naming conventions differ from Laravel's defaults

---

# Best Practices

- **Use the command for all new middleware.** It enforces correct namespace and structure. *Why: Manual creation risks interface mismatches, wrong namespaces, or inconsistent patterns across the codebase.*
- **Place middleware in `app/Queue/Middleware/`.** The command does this automatically — keep them there. *Why: Standard location makes middleware discoverable during code reviews and onboarding.*

---

# Examples

```bash
php artisan make:job-middleware LogExecutionTime
# Creates: app/Queue/Middleware/LogExecutionTime.php
```

---

# Related Topics

- **K054 Custom Job Middleware Creation (K054)** — Full middleware creation guide
