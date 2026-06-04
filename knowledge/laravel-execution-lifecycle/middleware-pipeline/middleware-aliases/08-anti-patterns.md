# ECC Anti-Patterns — Middleware Aliases

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Middleware Pipeline |
| **Knowledge Unit** | Middleware Aliases |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Using Class Short Name Instead of Alias
2. Forgetting to Register Alias
3. Alias Collision Between Packages
4. Not Re-Caching After Alias Changes
5. Over-Abstraction of Aliases

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — aliases are about middleware naming, not queries
- Premature Caching — route cache freezes alias resolution

---

## Anti-Pattern 1: Using Class Short Name Instead of Alias

### Category
Reliability

### Description
Using `Authenticate` instead of `auth` in route definitions — middleware not found.

### Why It Happens
Developers assume the class short name works as an alias.

### Warning Signs
- Route definition uses partial class name
- `InvalidArgumentException`: "Middleware 'Authenticate' not found"
- Full class path would work but short name doesn't

### Why It Is Harmful
The router looks up the string in the alias map. `'Authenticate'` is not a registered alias — only `'auth'` is. The middleware is not found and the request throws an exception.

### Preferred Alternative
Use registered alias or fully qualified class name.

### Detection Checklist
- [ ] Class short name used as alias
- [ ] "Middleware not found" exception
- [ ] Route fails with class name guess

### Related Rules
Middleware Aliases (05-rules.md): N/A

---

## Anti-Pattern 2: Forgetting to Register Alias

### Category
Reliability

### Description
Defining custom middleware but not adding to alias map.

### Preferred Alternative
Always register custom middleware aliases in `bootstrap/app.php`.

### Detection Checklist
- [ ] Custom middleware without alias
- [ ] Alias not found at runtime

---

## Anti-Pattern 3: Alias Collision Between Packages

### Category
Reliability

### Description
Two packages register the same alias — one silently overrides.

### Preferred Alternative
Audit aliases after package installation.

### Detection Checklist
- [ ] Same alias key in multiple packages
- [ ] Wrong middleware running

---

## Anti-Pattern 4: Not Re-Caching After Alias Changes

### Category
Reliability

### Description
Adding/changing aliases without regenerating route cache.

### Preferred Alternative
Re-cache routes after any alias change.

### Detection Checklist
- [ ] Alias added but route cache stale
- [ ] Old middleware class still referenced

---

## Anti-Pattern 5: Over-Abstraction of Aliases

### Category
Code Organization

### Description
Creating aliases for every middleware when the class name is equally short.

### Preferred Alternative
Use aliases for commonly used middleware. Use class names for one-off middleware.

### Detection Checklist
- [ ] Alias for every middleware class
- [ ] Unnecessary boilerplate
