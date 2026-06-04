# ECC Anti-Patterns — Provider Fundamentals

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Service Providers |
| **Knowledge Unit** | Provider Fundamentals |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. God AppServiceProvider
2. Resolution in register()
3. Dynamic Provider Registration
4. Forgetting Provider in bootstrap/providers.php
5. Overriding Constructor Without Calling Parent

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — providers are the composition root, not data access layer
- Premature Caching — registering providers before all dependencies exist

---

## Anti-Pattern 1: God AppServiceProvider

### Category
Architecture

### Description
Putting all application bootstrapping logic into a single `AppServiceProvider`.

### Why It Happens
Laravel creates it by default — developers keep adding to it without creating dedicated providers.

### Warning Signs
- `AppServiceProvider` has hundreds of lines
- Multiple unrelated concerns in one provider
- Team can't find where specific bindings are registered

### Why It Is Harmful
A god provider violates the Single Responsibility Principle. It becomes untestable, impossible to selectively defer, and difficult to reason about. The provider list in `bootstrap/providers.php` should tell the story of the application's capabilities — a single provider hides that story.

### Preferred Alternative
Create one provider per domain bounded context. Use `AppServiceProvider` only for application-wide concerns.

### Detection Checklist
- [ ] `AppServiceProvider` exceeds 100 lines
- [ ] Multiple unrelated concerns in one provider
- [ ] No dedicated domain providers

### Related Rules
Provider Fundamentals (05-rules.md): N/A

### Related Skills
Provider Fundamentals (06-skills.md): N/A

### Related Decision Trees
Provider Fundamentals (07-decision-trees.md): D02 — Dedicated vs Consolidated Providers.

---

## Anti-Pattern 2: Resolution in register()

### Category
Reliability

### Description
Calling `$this->app->make()` inside `register()`.

### Preferred Alternative
Use `boot()` for any code that depends on registered services.

### Detection Checklist
- [ ] `$this->app->make()` in `register()`
- [ ] Intermittent "Target class does not exist" errors

### Related Rules
Provider Fundamentals (05-rules.md): N/A

### Related Skills
Provider Fundamentals (06-skills.md): N/A

### Related Decision Trees
Provider Fundamentals (07-decision-trees.md): D01 — register vs boot.

---

## Anti-Pattern 3: Dynamic Provider Registration

### Category
Architecture

### Description
Registering providers based on database content or runtime conditions.

### Preferred Alternative
Keep provider registration static in `bootstrap/providers.php`.

### Detection Checklist
- [ ] `$app->register()` in controllers or middleware
- [ ] Database-driven provider loading

### Related Rules
Provider Fundamentals (05-rules.md): N/A

### Related Skills
Provider Fundamentals (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: Forgetting Provider in bootstrap/providers.php

### Category
Reliability

### Description
Creating a provider but not adding it to `bootstrap/providers.php`.

### Preferred Alternative
Always add new providers to `bootstrap/providers.php` (Laravel 11+) or `config/app.php` (earlier).

### Detection Checklist
- [ ] Provider class exists but never registered
- [ ] Provider services unavailable at runtime

### Related Rules
Provider Fundamentals (05-rules.md): N/A

### Related Skills
Provider Fundamentals (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Overriding Constructor Without Calling Parent

### Category
Reliability

### Description
Adding a constructor to a provider without calling `parent::__construct()`.

### Preferred Alternative
Override `register()` or `boot()` instead of the constructor.

### Detection Checklist
- [ ] Custom constructor in provider class
- [ ] Provider fails to register; `$app` not set

### Related Rules
Provider Fundamentals (05-rules.md): N/A

### Related Skills
Provider Fundamentals (06-skills.md): N/A

### Related Decision Trees
N/A
