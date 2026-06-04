# ECC Anti-Patterns — Services Cache

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Caching & Optimization |
| **Knowledge Unit** | Services Cache |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Caching Without Service Provider Understanding
2. Service Cache with Deferred Providers
3. Not Clearing Services Cache After Provider Changes
4. Services Cache Without Config Cache
5. Assuming Services Cache Covers All Providers

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — services cache does not address database queries
- Premature Caching — caching services before provider configuration is finalized

---

## Anti-Pattern 1: Caching Without Service Provider Understanding

### Category
Reliability

### Description
Running service caching commands without understanding which providers they cache or how deferred providers interact.

### Why It Happens
Developers cache everything indiscriminately.

### Warning Signs
- Services cached but deferred providers not loaded correctly
- Provider-specific behavior inconsistent after caching

### Why It Is Harmful
Service caching captures the `register()` and `boot()` output of deferred providers. If a deferred provider's deferred resolution depends on runtime state, the cached service may be incorrect.

### Preferred Alternative
Understand your deferred providers and their caching implications before implementing service caching.

### Detection Checklist
- [ ] Deferred providers with runtime-dependent registration
- [ ] Cached services behave differently from uncached

### Related Rules
Services Cache (04-standardized-knowledge.md): Understand deferred provider caching behavior.

---

## Anti-Pattern 2: Service Cache with Deferred Providers

### Category
Reliability

### Description
Using service caching when your application has many deferred providers whose registration depends on runtime state.

### Why It Happens
Developers don't differentiate between deferred and non-deferred provider caching.

### Warning Signs
- Deferred providers fail after caching
- Runtime-dependent provider registration breaks

### Preferred Alternative
Cache only non-deferred, stable providers. Test deferred provider caching thoroughly.

### Detection Checklist
- [ ] Many deferred providers
- [ ] Runtime-dependent registration

### Related Rules
Services Cache (04-standardized-knowledge.md): Deferred providers may not cache well.

---

## Anti-Pattern 3: Not Clearing Services Cache After Provider Changes

### Category
Reliability

### Description
Adding, removing, or modifying a service provider without clearing the services cache.

### Preferred Alternative
Clear and regenerate services cache after any provider change.

### Detection Checklist
- [ ] New provider not registered in cached state
- [ ] Removed provider still active after cache

### Related Rules
Services Cache (04-standardized-knowledge.md): Regenerate after provider changes.

---

## Anti-Pattern 4: Services Cache Without Config Cache

### Category
Reliability

### Description
Caching services before config — providers may read config values during registration.

### Preferred Alternative
Cache config before services.

### Detection Checklist
- [ ] Services cached before config
- [ ] Provider registration state inconsistent

### Related Rules
Services Cache (04-standardized-knowledge.md): Cache config first.

---

## Anti-Pattern 5: Assuming Services Cache Covers All Providers

### Category
Reliability

### Description
Assuming the services cache captures ALL providers, including third-party package providers.

### Preferred Alternative
Verify which providers are cached and which are re-registered on each request.

### Detection Checklist
- [ ] Third-party providers not cached
- [ ] Bootstrap time still high despite services cache

### Related Rules
Services Cache (04-standardized-knowledge.md): Verify which providers are cached.
