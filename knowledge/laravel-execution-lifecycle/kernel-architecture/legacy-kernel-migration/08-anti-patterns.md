# ECC Anti-Patterns — Legacy Kernel Migration

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Kernel Architecture |
| **Knowledge Unit** | Legacy Kernel Migration |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Permanent Dual Configuration
2. Removing Kernel Too Early
3. Skipping Command/Schedule Migration
4. Manual Vendor Edits
5. Over-Relying on BC Layer

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — kernel migration is about configuration, not queries
- Premature Caching — N/A

---

## Anti-Pattern 1: Permanent Dual Configuration

### Category
Maintainability

### Description
Keeping both old kernel files and ApplicationBuilder config indefinitely after migration.

### Preferred Alternative
Remove old kernel files after full verification.

### Detection Checklist
- [ ] Both `App\Http\Kernel` and `withMiddleware()` active
- [ ] Duplicate or merged middleware

### Related Rules
Legacy Migration (05-rules.md): N/A

### Related Skills
Legacy Migration (06-skills.md): N/A

### Related Decision Trees
Legacy Migration (07-decision-trees.md): D01 — Migration Completion Decision.

---

## Anti-Pattern 2: Removing Kernel Too Early

### Category
Reliability

### Description
Removing `app/Http/Kernel.php` before `withMiddleware()` configuration is complete.

### Preferred Alternative
Remove old kernel only after ApplicationBuilder config is fully verified.

### Detection Checklist
- [ ] Old kernel removed but new config incomplete
- [ ] Middleware missing in production
- [ ] Route model binding broken

### Why It Is Harmful
The BC detection falls back to defaults. If `withMiddleware()` doesn't fully replicate the old kernel's configuration, middleware silently doesn't run.

### Related Rules
Legacy Migration (05-rules.md): N/A

### Related Skills
Legacy Migration (06-skills.md): N/A

### Related Decision Trees
Legacy Migration (07-decision-trees.md): D01 — Migration Completion Decision.

---

## Anti-Pattern 3: Skipping Command/Schedule Migration

### Category
Maintainability

### Description
Only migrating middleware and leaving console kernel config in old format.

### Preferred Alternative
Migrate commands and schedule alongside middleware.

### Detection Checklist
- [ ] Console kernel still in old format
- [ ] Schedule still in `App\Console\Kernel`

### Related Rules
Legacy Migration (05-rules.md): N/A

### Related Skills
Legacy Migration (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: Manual Vendor Edits

### Category
Maintainability

### Description
Editing `Illuminate\Foundation\Http\Kernel` instead of using ApplicationBuilder.

### Preferred Alternative
Use ApplicationBuilder or service providers.

### Detection Checklist
- [ ] Changes in vendor kernel files
- [ ] Lost on `composer update`

### Related Rules
Legacy Migration (05-rules.md): N/A

### Related Skills
Legacy Migration (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Over-Relying on BC Layer

### Category
Architecture

### Description
Treating the BC detection as a permanent solution rather than a migration bridge.

### Preferred Alternative
Complete the migration. The BC layer is for transition, not indefinite production use.

### Detection Checklist
- [ ] Old kernel files kept for years
- [ ] No plan to complete migration

### Related Rules
Legacy Migration (05-rules.md): N/A

### Related Skills
Legacy Migration (06-skills.md): N/A

### Related Decision Trees
N/A
