# ECC Anti-Patterns — Singleton State Leaks

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Long-Running Processes |
| **Knowledge Unit** | Singleton State Leaks |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Singleton as Catch-All Cache
2. Manual `forgetInstance()` Calls
3. Cloning Singletons Manually
4. Ignoring the Problem (No Audit)
5. Singleton Caching Query Results

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — singleton leak is about state management, not queries
- Premature Caching — N/A

---

## Anti-Pattern 1: Singleton as Catch-All Cache

### Category
Reliability

### Description
Using singleton properties to cache computed results that are request-specific.

### Why It Happens
Developers treat singletons as convenient caches without considering request isolation.

### Warning Signs
- Singleton stores user data, locale, or tenant in instance properties
- Data from one request appears in another
- `Auth::user()` cached on a singleton guard

### Why It Is Harmful
In Octane, a singleton lives for the worker lifetime. If it stores per-request data, request A's data leaks to request B. Auth spoofing, data corruption, and hard-to-debug cross-request contamination.

### Preferred Alternative
Use scoped bindings for per-request state. Use singletons only for truly stateless services.

### Detection Checklist
- [ ] Singleton with mutable properties set per-request
- [ ] Data leaks between requests
- [ ] Auth/guard state shared across requests

### Related Rules
Singleton Leaks (05-rules.md): N/A

### Related Skills
Singleton Leaks (06-skills.md): N/A

### Related Decision Trees
Singleton Leaks (07-decision-trees.md): D01 — Singleton vs Scoped Decision.

---

## Anti-Pattern 2: Manual `forgetInstance()` Calls

### Category
Reliability

### Description
Manually clearing singleton instances to simulate scoped behavior.

### Preferred Alternative
Use `scoped()` bindings for automatic lifecycle management.

### Detection Checklist
- [ ] `forgetInstance()` called in controllers or middleware
- [ ] Corrupted container instance tracking

### Related Rules
Singleton Leaks (05-rules.md): N/A

### Related Skills
Singleton Leaks (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 3: Cloning Singletons Manually

### Category
Performance

### Description
Deep-copying singleton instances per request instead of using `scoped()`.

### Preferred Alternative
Use `scoped()` for proper lifecycle management.

### Detection Checklist
- [ ] Manual `clone` operations on singletons
- [ ] Expensive and error-prone

### Related Rules
Singleton Leaks (05-rules.md): N/A

### Related Skills
Singleton Leaks (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: Ignoring the Problem (No Audit)

### Category
Architecture

### Description
Deploying Octane without any singleton audit because "it works in development."

### Preferred Alternative
Audit all singletons before Octane deployment.

### Detection Checklist
- [ ] No pre-Octane audit
- [ ] Production leaks only

### Related Rules
Singleton Leaks (05-rules.md): N/A

### Related Skills
Singleton Leaks (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Singleton Caching Query Results

### Category
Reliability

### Description
Caching Eloquent query results in a singleton property — cache grows unbounded and leaks across requests.

### Preferred Alternative
Use scoped or explicit cache invalidation.

### Detection Checklist
- [ ] Query results stored in singleton property
- [ ] Cache not cleared between requests

### Related Rules
Singleton Leaks (05-rules.md): N/A

### Related Skills
Singleton Leaks (06-skills.md): N/A

### Related Decision Trees
N/A
