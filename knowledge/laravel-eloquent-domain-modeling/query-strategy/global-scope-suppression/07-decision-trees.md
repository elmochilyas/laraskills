# Decision Trees: Global Scope Suppression

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Query Strategy |
| Knowledge Unit | Global Scope Suppression |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | Suppression necessity and method | Primary |
| 2 | Scope suppression security gating | Architecture |
| 3 | Suppression encapsulation | Architecture |

---

## Decision 1: Suppression Necessity and Method

### Context
Global scopes apply automatically. Suppression removes them temporarily. The method of suppression — `withoutGlobalScope()` (single) vs `withoutGlobalScopes()` (all) — determines how many scopes are removed. Suppressing too many scopes risks data integrity.

### Criteria
- Which specific scope(s) need to be suppressed?
- Is there a built-in alias for suppression (e.g., `withTrashed()` for soft deletes)?
- Is the suppression for a single query or a common pattern?
- Would a local scope be a better alternative?

### Decision Tree
```
Is a built-in suppression method available (e.g., withTrashed())?
├── YES → Use the built-in method (clearer intent, better known)
└── NO
    └── How many scopes need to be suppressed?
        ├── One → Use withoutGlobalScope(ClassName::class)
        ├── Two or more → Use withoutGlobalScopes([Class1::class, Class2::class])
        └── All → CRITICAL: Do NOT use withoutGlobalScopes() with no args!
            └── Suppressing all scopes removes security constraints too
                ├── Is each scope individually reviewed?
                │   ├── YES → Only if absolutely necessary, with justification
                │   └── NO → Specify each scope explicitly
                └── Use withoutGlobalScopes([...]) with explicit list
```

### Rationale
`withoutGlobalScopes()` with no arguments removes ALL scopes — including security-critical ones like multi-tenant isolation. Always specify which scope(s) to suppress. Prefer `withTrashed()` over manually suppressing `SoftDeletingScope`. Suppressing should be the exception, not the rule — if a scope needs frequent suppression, it shouldn't be a global scope.

### Recommended Default
`withoutGlobalScope(SpecificScope::class)` for single scopes. `withTrashed()` for soft deletes. Never use `withoutGlobalScopes()` without arguments.

### Risks
- `withoutGlobalScopes()` without args: removes security scopes, data breach
- Suppressing wrong scope class name: case-sensitive, must match exactly
- Suppression on reused builder: scope stays suppressed for all subsequent queries
- Suppression on relationship: parent suppression does NOT affect relationship queries

### Related Rules/Skills
- Specific Scope Suppression (05-rules.md)
- withTrashed() Preference (05-rules.md)
- No Blanket Suppression (05-rules.md)

---

## Decision 2: Scope Suppression Security Gating

### Context
Suppressing a global scope that enforces security (multi-tenant isolation, access control) can expose data the caller should not see. Suppression must be gated behind permission checks.

### Criteria
- Does the suppressed scope enforce security (tenant isolation, access control)?
- Is the suppression gated behind a permission or role check?
- Is the suppression logged for audit?
- Is the suppression tested for correct access control?

### Decision Tree
```
Does the suppressed scope enforce a security boundary?
├── YES (tenant isolation, access control, ownership filter)
│   └── Is suppression gated behind a permission check?
│       ├── YES
│       │   └── Is the suppression logged for audit?
│       │       ├── YES → Secure suppression pattern
│       │       └── NO → Add audit logging
│       └── NO → CRITICAL: Add permission gate before deploying
└── NO (soft deletes, status filters, non-security scopes)
    └── Gate if the scope has any security implications
        └── Document why suppression is safe
```

### Rationale
Multi-tenant scopes are the most common security-critical global scopes. Suppressing one without a permission check means the request sees ALL tenants' data — a data breach. Every suppression of a security scope must be explicitly authorized and logged.

### Recommended Default
Always gate security scope suppression behind `$user->isAdmin()` or equivalent permission check. Log all suppression events with user ID and reason.

### Risks
- Ungated tenant scope suppression: all tenants' data exposed
- Permission check bypassed on nested/relationship queries
- Audit log missing: cannot trace who suppressed which scope and why
- Cached results from suppressed query: stale data served to unauthorized users

### Related Rules/Skills
- Permission Gate for Suppression (05-rules.md)
- Audit Logging (05-rules.md)
- Security Scope Documentation (05-rules.md)

---

## Decision 3: Suppression Encapsulation

### Context
Suppression calls scattered across controllers are hard to audit and maintain. Encapsulating suppression in repository methods or query objects centralizes the logic and makes code review easier.

### Criteria
- Is the suppression pattern repeated in multiple places?
- Is the suppression inline in a controller?
- Is the suppression documented with the business reason?
- Is the suppression tested?

### Decision Tree
```
Is the suppression pattern used in multiple places?
├── YES → Encapsulate in repository method or query object
│   └── Is there a natural abstraction?
│       ├── YES → Create named method: includeSoftDeletes(), allTenants()
│       └── NO → Create generic suppression method with scope parameter
└── NO (single use)
    └── Inline suppression is acceptable
        └── Is it documented with business reason?
            ├── YES → Proceed
            └── NO → Add comment explaining why scope is suppressed
```

### Rationale
Named methods like `includeSoftDeletes()` or `includeArchived()` are self-documenting and testable. They also provide a single point to audit all suppression calls. Inline suppression in controllers should be the exception and must be documented.

### Recommended Default
Encapsulate suppression in repository or query object methods for any pattern used in 2+ places. Name methods to indicate what is being included, not what is being suppressed (e.g., `withTrashed()` vs `withoutGlobalScope(SoftDeletingScope::class)`).

### Risks
- Encapsulation without testing: suppressed query behavior not verified
- Repository method name hides suppression: developer calls method unaware scope is removed
- No audit trail: suppression happens in encapsulated method without logging
- Suppression in base repository method: all queries through that method are affected

### Related Rules/Skills
- Named Suppression Methods (05-rules.md)
- Repository Encapsulation (05-rules.md)
- Suppression Testing (05-rules.md)
