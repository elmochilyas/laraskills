# Skill: Organize Code by Domain With Bounded Context Isolation

## Purpose
Structure application code into domain directories (`app/Domains/{Domain}/`) each containing all layers needed for that bounded context, with contracts and events for cross-domain communication.

## When To Use
- Multiple business domains are clearly identifiable (Billing, Catalog, Identity, Compliance)
- Application will grow significantly over 3+ years
- Team ownership maps to domains
- Domain boundaries are reasonably stable
- Application requires genuine isolation, not just organizational grouping

## When NOT To Use
- Application is a single domain or simple CRUD
- Team is small (under 5 engineers)
- Business concepts lack clear boundaries
- Domain boundaries will change frequently
- Organization is not ready to enforce domain isolation

## Prerequisites
- Clear identification of bounded contexts
- PSR-4 autoloading configuration ready for multiple namespace roots
- Architecture testing framework (Pest) for domain isolation enforcement
- Team agreement on domain boundaries

## Inputs
- Documented bounded context analysis
- Current layer-based or default structure codebase
- Team-to-domain ownership mapping

## Workflow
1. **Identify stable bounded contexts.** Analyze business domains to identify 3-4 stable contexts with clear boundaries. Document each domain's key models, responsibilities, and dependencies in a `domain-map.md`.

2. **Create domain directory structure.** Create `app/Domains/{Domain}/` with `Models/`, `Http/Controllers/`, `Services/`, `Events/`, `Providers/`, and `routes/`. Each domain is a mini-application with its own namespace.

3. **Configure PSR-4 mapping.** Add separate namespace roots per domain: `"Domains\\": "app/Domains/"` — or per-domain prefixes if using distinct PSR-4 roots. Ensure no overlap with the default `App\` mapping.

4. **Give each domain its own service provider.** Each domain registers its own routes, events, commands, and bindings through a dedicated provider. This enables independent domain lifecycle management.

5. **Use domain-scoped Eloquent models.** Each domain owns specific database tables. Domain A never references Domain B's models directly. If the same concept (User) exists in multiple domains, each domain has its own model representing its view.

6. **Use domain events for cross-domain notification.** When Domain A needs to notify Domain B, dispatch an event. The dispatching domain doesn't know which listeners exist. For request-response patterns, use contract interfaces.

7. **Keep shared kernel outside any domain.** Place cross-cutting infrastructure (auth, base controllers, audit logging) in application-level directories like `app/Http/` or `app/Providers/`, never inside a domain.

8. **Enforce domain isolation via architecture tests.** Write Pest tests that prevent any domain from importing classes from another domain's internal implementation.

## Validation Checklist
- [ ] Each domain has its own namespace prefix and directory
- [ ] No direct Eloquent model imports across domain boundaries
- [ ] Cross-domain communication uses service contracts or events
- [ ] Domain boundaries are documented with ownership
- [ ] Architecture tests enforce domain isolation
- [ ] Each domain has its own service provider registered
- [ ] No domain acts as a catch-all "Core" dumping ground
- [ ] Shared kernel lives outside any domain

## Common Failures
- **Leaking shared models:** Placing a model in one domain that is actually used across all domains. Shared models belong in a shared kernel.
- **Cross-domain Eloquent access:** Catalog domain calling `Billing\Invoice::where(...)` directly. Use contracts or events instead.
- **Inconsistent boundaries:** Some code in domains, some still flat in `app/`. Complete the migration or don't start.
- **Domain too large:** A "Core" domain containing everything not fitting elsewhere. Split into meaningful domains.

## Decision Points
- **Single shared kernel vs domain-specific infrastructure?** Use a shared kernel for truly cross-cutting concerns. Let each domain have its own infrastructure for domain-specific needs.
- **Contracts vs events for cross-domain communication?** Use contracts for request-response patterns (need immediate return). Use events for fire-and-forget notification.

## Performance Considerations
- Multiple service providers increase boot time slightly. 10+ domains can add 50-100ms.
- Mitigate with config caching, route caching, and event caching.
- Cross-domain database queries (if any) must be explicit — may impact query performance.

## Security Considerations
- Domain isolation is architectural, not security — all domains share the same process and authentication.
- Ensure cross-domain contracts do not inadvertently expose sensitive internal domain data.

## Related Rules
- Rule: Never Access Another Domain's Eloquent Models Directly (COS-06/05-rules.md)
- Rule: Give Each Domain Its Own Service Provider (COS-06/05-rules.md)
- Rule: Use Domain-Scoped Eloquent Models for Each Domain (COS-06/05-rules.md)
- Rule: Use Domain Events for Cross-Domain Communication (COS-06/05-rules.md)
- Rule: Document Domain Boundaries Explicitly (COS-06/05-rules.md)
- Rule: Enforce Domain Isolation via Automated Checks (COS-06/05-rules.md)
- Rule: Keep Shared Kernel Outside Any Domain (COS-06/05-rules.md)
- Rule: Ensure Domain Boundaries Are Stable Before Implementation (COS-06/05-rules.md)

## Related Skills
- Identify Bounded Contexts for Domain Isolation (DBC-01/06-skills.md)
- Apply Hybrid Domain-Layer Organization (COS-07/06-skills.md)
- Organize Code by Feature Using Vertical Slices (COS-05/06-skills.md)
- Configure PSR-4 Autoloading for Custom Directories (COS-03/06-skills.md)

## Success Criteria
- Each domain is independently understandable and team-ownable.
- No Eloquent models are imported across domain boundaries.
- Cross-domain communication uses only contracts or events.
- Architecture tests fail on any cross-domain import violation.
