# ECC Anti-Patterns — Aliasing Primitives (ku-07)

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Dependency Injection |
| **Knowledge Unit** | Aliasing Primitives |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Injecting Entire Config Array
2. Hardcoded Secrets in `give()`
3. Over-Aliasing
4. Missing `$` Prefix
5. Forgetting Default Values

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — primitive aliasing does not affect database
- Premature Caching — N/A

---

## Anti-Pattern 1: Injecting Entire Config Array

### Category
Architecture

### Description
Injecting `Config $config` (or `array $config`) into a constructor just to call `$config->get('services.stripe.key')`.

### Why It Happens
Developers don't know about primitive aliasing and inject the entire config as convenience.

### Warning Signs
- Constructor accepts `Config $config` or `array $config`
- The config array is used for only one or two keys
- `$config->get('...')` calls in methods

### Why It Is Harmful
ku-07 states: "Injecting entire Config array... is an anti-pattern." Injecting the full config repository exposes the class to the entire configuration — it can read any key, creating implicit dependencies that are invisible in the constructor signature.

### Preferred Alternative
Use `when()->needs('$apiKey')->give(config('services.stripe.key'))` to inject only the specific value.

### Detection Checklist
- [ ] `Config` injected but only 1-2 keys used
- [ ] `$config->get()` called in methods
- [ ] Implicit dependencies on undocumented config keys

### Related Rules
ku-07 (05-rules.md): N/A

### Related Skills
ku-07 (06-skills.md): N/A

### Related Decision Trees
ku-07 (07-decision-trees.md): D01 — Config Injection vs Primitive Aliasing.

---

## Anti-Pattern 2: Hardcoded Secrets in `give()`

### Category
Security

### Description
Passing secret values directly as strings in `give()` instead of referencing environment configuration.

### Why It Happens
Developers inline values for convenience during prototyping.

### Preferred Alternative
Always use `give(config('services.key'))` to reference environment-configurable values.

### Detection Checklist
- [ ] Secret strings in `give('sk_test_...')`
- [ ] Secrets in repository, not env-configurable

### Related Rules
ku-07 (05-rules.md): N/A

### Related Skills
ku-07 (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 3: Over-Aliasing

### Category
Architecture

### Description
Binding every primitive parameter individually when a configuration object or DTO would be cleaner.

### Preferred Alternative
Use a dedicated configuration object or DTO for classes with 3+ primitive dependencies.

### Detection Checklist
- [ ] 5+ primitive bindings for the same class
- [ ] Configuration object would be cleaner

### Related Rules
ku-07 (05-rules.md): N/A

### Related Skills
ku-07 (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: Missing `$` Prefix

### Category
Reliability

### Description
Using `needs('paramName')` without the `$` prefix.

### Preferred Alternative
Always use `needs('$paramName')` with the `$` prefix.

### Detection Checklist
- [ ] Missing `$` prefix in `needs()`
- [ ] Primitive binding silently ignored

### Related Rules
ku-07 (05-rules.md): N/A

### Related Skills
ku-07 (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Forgetting Default Values

### Category
Reliability

### Description
Primitive parameter has neither a default value nor a contextual binding.

### Preferred Alternative
Always provide default values for optional primitive parameters.

### Detection Checklist
- [ ] Primitive parameter without default
- [ ] `BindingResolutionException` at runtime

### Related Rules
ku-07 (05-rules.md): N/A

### Related Skills
ku-07 (06-skills.md): N/A

### Related Decision Trees
N/A
