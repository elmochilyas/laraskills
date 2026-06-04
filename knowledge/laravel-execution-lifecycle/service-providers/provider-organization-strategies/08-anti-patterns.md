# ECC Anti-Patterns — Provider Organization Strategies

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Service Providers |
| **Knowledge Unit** | Provider Organization Strategies |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. God AppServiceProvider
2. Provider Per Class
3. Dynamic Provider Registration
4. Provider Names Not Reflecting Domain
5. Consolidating Too Aggressively

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — provider organization is about code structure, not queries
- Premature Caching — N/A

---

## Anti-Pattern 1: God AppServiceProvider

### Category
Architecture

### Description
Single `AppServiceProvider` registering all application services.

### Warning Signs
- Hundreds of lines in `AppServiceProvider`
- Cannot find where specific bindings live
- Provider mixed with multiple domain concerns

### Why It Is Harmful
The provider list in `bootstrap/providers.php` should be an architecture map — it should tell the story of what the application does. A single provider hides all boundaries and makes selective deferral impossible.

### Preferred Alternative
One provider per bounded context (e.g., `PaymentsServiceProvider`, `NotificationsServiceProvider`).

### Detection Checklist
- [ ] `AppServiceProvider` > 100 lines
- [ ] Multiple domain bindings in single provider
- [ ] Team creates new bindings in `AppServiceProvider` by habit

### Related Rules
Provider Organization (05-rules.md): N/A

### Related Skills
Provider Organization (06-skills.md): N/A

### Related Decision Trees
Provider Organization (07-decision-trees.md): D01 — Provider Structure Decision.

---

## Anti-Pattern 2: Provider Per Class

### Category
Architecture

### Description
Creating one provider for every service class — 50+ trivial providers.

### Preferred Alternative
Group related bindings in domain providers.

### Detection Checklist
- [ ] One binding per provider
- [ ] High provider count with trivial content

### Related Rules
Provider Organization (05-rules.md): N/A

### Related Skills
Provider Organization (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 3: Dynamic Provider Registration

### Category
Architecture

### Description
Loading providers from database or configuration at runtime.

### Preferred Alternative
Keep provider registration static in `bootstrap/providers.php`.

### Detection Checklist
- [ ] `$app->register()` with dynamic class name
- [ ] Database-driven provider loading

### Related Rules
Provider Organization (05-rules.md): N/A

### Related Skills
Provider Organization (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: Provider Names Not Reflecting Domain

### Category
Maintainability

### Description
Provider named `ServiceProvider` instead of `PaymentsServiceProvider`.

### Preferred Alternative
Name providers after their domain bounded context.

### Detection Checklist
- [ ] Vague provider names
- [ ] Hard to locate specific bindings

### Related Rules
Provider Organization (05-rules.md): N/A

### Related Skills
Provider Organization (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Consolidating Too Aggressively

### Category
Architecture

### Description
Consolidating all providers into a few large providers that violate SRP.

### Preferred Alternative
Keep domain boundaries; consolidate within domain, not across domains.

### Detection Checklist
- [ ] Provider registers unrelated services
- [ ] Violates domain boundaries

### Related Rules
Provider Organization (05-rules.md): N/A

### Related Skills
Provider Organization (06-skills.md): N/A

### Related Decision Trees
Provider Organization (07-decision-trees.md): D01 — Provider Structure Decision.
