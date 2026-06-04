# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Event-Driven Architecture
**Knowledge Unit:** K025 — Event Auto-Discovery via Directory Scanning
**Generated:** 2026-06-03

---

# Decision Inventory

* Auto-Discovery vs Manual Registration
* event:cache vs Uncached Discovery

---

# Architecture-Level Decision Trees

---

## Auto-Discovery vs Manual Registration

---

### Decision Context

Whether to use auto-discovery (scan `app/Listeners`) or manually register listeners in `EventServiceProvider`.

---

### Decision Criteria

* Listener count and complexity
* Need for explicit control over active listeners
* Package development context
* Multi-tenant/security requirements

---

### Decision Tree

Package development?
YES → Manual registration in service provider — auto-discovery misses listeners outside app/
NO → Need explicit control over which listeners are active?
    YES → Manual registration — auto-discovery registers all found listeners
NO → Fewer than 100 listeners?
    YES → Auto-discovery is fine — overhead is negligible
NO → Security-sensitive multi-tenant app?
    YES → Manual registration or ShouldBeDiscovered (Laravel 13.12+)

---

### Rationale

Auto-discovery scans `app/Listeners` and registers all found listeners. It's convenient for standard Laravel projects. Manual registration is needed for packages, multi-tenant contexts, and when explicit control is required.

---

### Recommended Default

**Default:** Use auto-discovery for standard apps; manual registration for packages and security-sensitive contexts
**Reason:** Auto-discovery reduces boilerplate for most apps. Manual registration provides explicit control when needed.

---

### Risks Of Wrong Choice

- Auto-discovery for packages: listeners not outside app/Listeners — not discovered
- Manual registration for all: unnecessary boilerplate, forgotten registrations
- Not running event:cache in production: filesystem scan on every request

---

### Related Rules

- run-event-cache-in-production
- add-event-cache-to-deployment-script

---

### Related Skills

- Handle Event Auto-Discovery and Registration

---

## event:cache vs Uncached Discovery

---

### Decision Context

Whether to cache the event-listener mapping with `event:cache` or rely on filesystem scanning on every request.

---

### Decision Criteria

* Request boot time requirements
* Deployment automation maturity
* Development workflow
* Listener count

---

### Decision Tree

Production environment?
YES → Always use event:cache — eliminates filesystem scan overhead
NO → Development environment?
    YES → Uncached is fine — frequent listener changes
NO → >50 listener classes?
    YES → event:cache recommended — scan overhead is measurable
NO → <50 listeners?
    YES → Uncached acceptable — overhead is ~5-15ms

---

### Rationale

Without caching, Laravel scans `app/Listeners` on every request, adding 5-15ms to boot time. `event:cache` compiles the mapping once, reducing it to <1ms.

---

### Recommended Default

**Default:** Use `event:cache` in production; don't cache in development (frequent changes)
**Reason:** Production requests benefit from the cache. Development changes would require frequent re-caching.

---

### Risks Of Wrong Choice

- No event:cache in production: 5-15ms boot time overhead per request — adds up at scale
- Forgetting to re-cache after adding listeners: new listeners don't fire
- Caching in development: must re-cache after every listener change

---

### Related Rules

- run-event-cache-in-production
- add-event-cache-to-deployment-script

---

### Related Skills

- Handle Event Auto-Discovery and Registration
