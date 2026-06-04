# Skill: Scale Code Organization for Multi-Team (10+ Engineers)

## Purpose
Restructure code organization for teams of 10+ engineers using per-team namespace roots, per-domain service providers, contract-based cross-domain communication, and merge conflict tracking to enable independent team workflows.

## When To Use
- 10+ engineers across 2+ teams
- Multiple business domains with different release cadences
- Organization can support architectural enforcement
- Teams need independent work without constant coordination

## When NOT To Use
- Teams are cross-functional (each team touches multiple domains)
- Application is a single domain with complex interdependencies
- Organization lacks architectural enforcement culture
- Fewer than 10 engineers — structural partitioning adds unnecessary overhead

## Prerequisites
- Existing domain-based or module-based organization
- Clear team-to-domain ownership mapping
- Architecture testing framework for boundary enforcement
- Merge conflict tracking tooling

## Inputs
- Current team structure and domain ownership
- Merge conflict history (frequency, files, teams involved)
- Existing namespace and PSR-4 configuration
- Team-to-namespace mapping proposal

## Workflow
1. **Give each team its own namespace root.** Configure separate PSR-4 mappings per team/domain in `composer.json`. Replace shared `App\` with `Billing\`, `Catalog\`, `Identity\` roots mapped to separate directories.

2. **Implement per-domain service providers.** Each domain registers its own routes, events, commands, and bindings through a dedicated provider. Eliminate the single `AppServiceProvider` bottleneck.

3. **Use API-first internal communication.** Define cross-domain communication through versioned service contracts (interfaces). Never allow direct database access across team boundaries. Use events for fire-and-forget notification.

4. **Establish a stable shared kernel with explicit ownership.** Assign a specific team to own the shared kernel namespace. Shared code without an owner becomes unmaintained. Track PRs and maintain tests.

5. **Track merge conflict budgets.** Monitor monthly merge conflicts across team boundaries. At 5+ conflicts/month, investigate structural reorganization — split route files, separate models, or reassign namespace ownership.

6. **Define infrastructure standards with team flexibility.** Establish shared standards (CI, logging, monitoring, queues) while allowing team-specific choices. Document exceptions explicitly.

7. **Maintain a team-to-namespace mapping document.** Create and maintain a visible document mapping namespaces to teams, with contact information and dependencies.

## Validation Checklist
- [ ] Each team has its own namespace root with PSR-4 mapping
- [ ] Merge conflicts are tracked and below 5/month threshold
- [ ] Cross-domain communication uses contracts, not direct model access
- [ ] Shared kernel has explicit ownership
- [ ] Architecture tests enforce team namespace boundaries
- [ ] Team-to-namespace mapping document is maintained
- [ ] Infrastructure standards are documented with team flexibility

## Common Failures
- **Cross-team shared models:** `User` model used by all teams creates single point of coupling. Each team owns its user concept or communicates through contracts.
- **No shared kernel owner:** Everyone contributes to `Shared/`, no one maintains. Assign explicit ownership.
- **Siloed infrastructure decisions:** Each team picks different logging, monitoring, or queue backends. Establish standards with flexibility.

## Decision Points
- **Monorepo vs multi-repo at team scale?** Default to monorepo with modular structure for teams under 50. Extract to multi-repo only when independent deployment is required.
- **Contract versioning strategy?** Use semantic versioning for shared contracts. Breaking changes require major version bumps and coordinated migration.

## Performance Considerations
- Multiple service providers increase boot time — consider deferred providers and config caching.
- Database schema ownership per team means cross-team queries require API calls, adding latency.
- 10+ domain providers can add 50-100ms to boot time.

## Security Considerations
- Team boundaries are organizational, not security boundaries.
- Cross-domain contracts must prevent leaking sensitive data between domains.

## Related Rules
- Rule: Give Each Team Its Own Namespace Root with Separate PSR-4 Mapping (COS-10/05-rules.md)
- Rule: Ensure No Two Teams Ever Modify the Same File for Different Reasons (COS-10/05-rules.md)
- Rule: Use Per-Domain Service Providers for Independent Registration (COS-10/05-rules.md)
- Rule: Use API-First Internal Communication with Versioned Contracts (COS-10/05-rules.md)
- Rule: Establish a Stable Shared Kernel with Explicit Ownership (COS-10/05-rules.md)
- Rule: Track Merge Conflict Budget — Investigate at 5+ Conflicts/Month (COS-10/05-rules.md)
- Rule: Define Infrastructure Standards with Team-Specific Flexibility (COS-10/05-rules.md)
- Rule: Maintain a Team-to-Namespace Mapping Document (COS-10/05-rules.md)

## Related Skills
- Organize Code by Domain With Bounded Context Isolation (COS-06/06-skills.md)
- Choose Between Monorepo and Multi-Repo (COS-11/06-skills.md)
- Map Team Structure to Bounded Contexts (DBC-09/06-skills.md)

## Success Criteria
- Each team works independently without file ownership conflicts.
- Merge conflicts are below 5/month.
- Cross-domain communication uses contracts, not direct model access.
- Shared kernel is maintained with clear ownership.
- New engineers can identify domain ownership from documentation.
