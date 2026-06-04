# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Queue Engineering
**Knowledge Unit:** make-job-middleware-command
**Generated:** 2026-06-03

---

# Decision Inventory

* Artisan-Generated vs Hand-Written Job Middleware

---

# Architecture-Level Decision Trees

---

## Artisan-Generated vs Hand-Written Job Middleware

---

### Decision Context

Whether to use `php artisan make:middleware` (HTTP middleware generator) and adapt it for jobs, or hand-write job middleware classes manually.

---

### Decision Criteria

* Custom job middleware needs
* Artisan command availability (dedicated job middleware generator)
* Boilerplate reduction preference

---

### Decision Tree

Dedicated `php artisan make:job-middleware` command available?
YES → Use it — generates correct structure automatically
NO → Creating custom reusable job middleware for multiple jobs?
    YES → Hand-write the class — boilerplate is minimal
NO → Need to register globally (all jobs)?
    YES → Implement contract and register in service provider
NO → Inline in one job's middleware() method?
    YES → Use inline — no separate class needed

---

### Rationale

Job middleware classes are simple — they implement the `handle` method that takes `$job` and `$next`. The Artisan generator (if available) saves typing but the structure is straightforward enough for manual creation.

---

### Recommended Default

**Default:** Use `artisan make:job-middleware` if available; hand-write if command isn't available or middleware is trivial
**Reason:** Artisan generators reduce boilerplate and ensure correct namespace/import setup. Hand-writing is fine for simple middleware.

---

### Risks Of Wrong Choice

- Using HTTP middleware generator for jobs: wrong interface, contract incompatibility
- Manually writing with incorrect interface: runtime error when middleware runs
- Not registering global middleware correctly: middleware silently not applied

---

### Related Rules

- use-built-in-middleware-first

---

### Related Skills

- Implement Job Middleware
