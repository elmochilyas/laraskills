# ECC Anti-Patterns — Kernel Version Evolution

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Kernel Architecture |
| **Knowledge Unit** | Kernel Version Evolution |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Doing Both Kernel Approaches Indefinitely
2. Overriding Framework Kernel
3. Vendor-Patching Kernel Files
4. Partial Migration in Production
5. Assuming Kernel Removal Means "No Kernel"

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — kernel evolution is about configuration pattern changes, not queries
- Premature Caching — N/A

---

## Anti-Pattern 1: Doing Both Kernel Approaches Indefinitely

### Category
Maintainability

### Description
Keeping both old kernel files (`App\Http\Kernel`) and ApplicationBuilder configuration after migration is complete.

### Why It Happens
Developers migrate but don't clean up old files.

### Warning Signs
- Both `app/Http/Kernel.php` and `withMiddleware()` in `bootstrap/app.php`
- Middleware could be configured in either location
- Confusion about which file is authoritative

### Why It Is Harmful
Laravel merges both configurations additively. Duplicate middleware may run twice. The dual configuration creates confusion about where to make changes. The old kernel file becomes dead code.

### Preferred Alternative
Remove old kernel files after full migration has been verified in staging.

### Detection Checklist
- [ ] Both `App\Http\Kernel` exists and `withMiddleware()` configured
- [ ] Old kernel files remain post-migration
- [ ] Team unsure which file is authoritative

### Related Rules
Kernel Evolution (05-rules.md): N/A

### Related Skills
Kernel Evolution (06-skills.md): N/A

### Related Decision Trees
Kernel Evolution (07-decision-trees.md): D01 — Migration Strategy Decision.

---

## Anti-Pattern 2: Overriding Framework Kernel

### Category
Architecture

### Description
Creating a custom class extending the framework kernel instead of using ApplicationBuilder.

### Preferred Alternative
Use `bootstrap/app.php` ApplicationBuilder for all configuration.

### Detection Checklist
- [ ] Custom kernel extending `Illuminate\Foundation\Http\Kernel`
- [ ] ApplicationBuilder not used for kernel config

### Related Rules
Kernel Evolution (05-rules.md): N/A

### Related Skills
Kernel Evolution (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 3: Vendor-Patching Kernel Files

### Category
Maintainability

### Description
Modifying framework kernel files in `vendor/`.

### Preferred Alternative
Use ApplicationBuilder or service providers for customization.

### Detection Checklist
- [ ] Changes in `vendor/laravel/framework`
- [ ] Lost on `composer update`

### Related Rules
Kernel Evolution (05-rules.md): N/A

### Related Skills
Kernel Evolution (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: Partial Migration in Production

### Category
Reliability

### Description
Deploying with half-migrated configuration that differs between kernel and ApplicationBuilder.

### Preferred Alternative
Complete the migration fully before deploying.

### Detection Checklist
- [ ] Inconsistent middleware config between files
- [ ] Some middleware only in old kernel, some only in new

### Related Rules
Kernel Evolution (05-rules.md): N/A

### Related Skills
Kernel Evolution (06-skills.md): N/A

### Related Decision Trees
Kernel Evolution (07-decision-trees.md): D01 — Migration Strategy Decision.

---

## Anti-Pattern 5: Assuming Kernel Removal Means "No Kernel"

### Category
Knowledge

### Description
Thinking Laravel 11+ applications have no kernel at all.

### Preferred Alternative
Understand that only userland kernel classes were removed; framework kernel persists.

### Detection Checklist
- [ ] Confusion about how middleware still works
- [ ] Belief that kernel concept is removed

### Related Rules
Kernel Evolution (05-rules.md): N/A

### Related Skills
Kernel Evolution (06-skills.md): N/A

### Related Decision Trees
N/A
