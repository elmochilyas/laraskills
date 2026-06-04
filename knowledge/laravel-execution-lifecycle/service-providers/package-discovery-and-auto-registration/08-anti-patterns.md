# ECC Anti-Patterns — Package Discovery and Auto-Registration

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Service Providers |
| **Knowledge Unit** | Package Discovery and Auto-Registration |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Duplicate Registration
2. No Cache After Deploy
3. Ignoring Discovered Aliases
4. Manually Adding Discovered Provider
5. Stale Cache After Package Removal

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — package discovery is about auto-registration, not queries
- Premature Caching — cache must be regenerated after package changes

---

## Anti-Pattern 1: Duplicate Registration

### Category
Reliability

### Description
Adding a discovered provider to `bootstrap/providers.php` — the provider registers twice.

### Why It Happens
Developers don't know a package is auto-discovered and add it manually.

### Warning Signs
- Provider appears twice in provider list
- Bindings registered twice
- Duplicate binding exceptions or warnings

### Why It Is Harmful
Auto-discovered providers are added after manual providers in the merged list. If a provider is both in `bootstrap/providers.php` and auto-discovered, it runs twice. First from the manual list, then again from the discovered list. The second registration may override bindings or cause errors.

### Preferred Alternative
Trust auto-discovery for packages that support it. Only manually register packages excluded via `dont-discover`.

### Detection Checklist
- [ ] Provider in both manual and discovered lists
- [ ] Duplicate bindings or provider errors
- [ ] Provider runs twice

### Related Rules
Package Discovery (05-rules.md): N/A

### Related Skills
Package Discovery (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 2: No Cache After Deploy

### Category
Reliability

### Description
Deploying without regenerating `bootstrap/cache/packages.php`.

### Preferred Alternative
Run `php artisan optimize` in deployment.

### Detection Checklist
- [ ] New packages discovered but not cached
- [ ] Provider not loading after deploy

### Related Rules
Package Discovery (05-rules.md): N/A

### Related Skills
Package Discovery (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 3: Ignoring Discovered Aliases

### Category
Reliability

### Description
Not checking that two packages define the same facade alias — last one wins silently.

### Preferred Alternative
Audit discovered aliases after package installation.

### Detection Checklist
- [ ] Alias conflicts between packages
- [ ] Silent overriding of facade classes

### Related Rules
Package Discovery (05-rules.md): N/A

### Related Skills
Package Discovery (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: Manually Adding Discovered Provider

### Category
Reliability

### Description
Adding a discovered provider to `bootstrap/providers.php` thinking manual registration is required.

### Preferred Alternative
Trust auto-discovery. Only manually register when using `dont-discover`.

### Detection Checklist
- [ ] Provider in both lists
- [ ] Duplicate execution

### Related Rules
Package Discovery (05-rules.md): N/A

### Related Skills
Package Discovery (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Stale Cache After Package Removal

### Category
Reliability

### Description
Removing a package without regenerating the discovery cache — old provider still loads.

### Preferred Alternative
Run `composer dump-autoload` and `php artisan optimize` after package removal.

### Detection Checklist
- [ ] Cache references deleted provider
- [ ] Fatal error from missing class

### Related Rules
Package Discovery (05-rules.md): N/A

### Related Skills
Package Discovery (06-skills.md): N/A

### Related Decision Trees
N/A
