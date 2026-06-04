# Skill: Choose Between Monorepo and Multi-Repo Organization

## Purpose
Evaluate the monorepo vs. multi-repo tradeoff and implement the appropriate repository structure for the team's scale, deployment needs, and module coupling.

## When To Use
- Deciding repository strategy for a new project or organization
- Current repository structure is causing friction (slow CI, merge conflicts, deployment coupling)
- Evaluating whether to split a monorepo or consolidate repos
- Architecture planning for multi-team projects

## When NOT To Use
- Teams under 15 engineers where monorepo is the clear default
- Single-module applications with no splitting consideration
- Before understanding team and deployment requirements

## Prerequisites
- Understanding of monorepo and multi-repo tradeoffs
- Knowledge of team size, structure, and deployment cadences
- CI/CD pipeline configuration access

## Inputs
- Current repository structure and pain points
- Team size and number of teams
- Module dependency graph
- Deployment frequency requirements per module

## Workflow
1. **Default to monorepo with modular structure.** For teams under 50 engineers, start with a single repository containing well-defined modules. Monorepos enable atomic cross-module refactoring, shared CI, and simpler dependency management.

2. **Use path-based CI filtering to keep CI under 10 minutes.** Configure CI to run only tests relevant to changed paths. A change to `modules/billing/` should only run billing tests. Use GitHub Actions path filters or equivalent.

3. **Enforce module boundaries even within a monorepo.** Treat modules with the same boundary discipline as separate repos — no direct cross-module model access, use contracts or events. Monorepo without boundaries becomes an unmanageable monolith.

4. **If splitting to multi-repo, create a shared contracts package first.** Before splitting, version and publish a shared contracts package that all repos depend on. Without shared interfaces, code duplicates and drifts across repos.

5. **Document the cross-repo dependency graph.** Maintain a dependency map showing which repos depend on which, including version constraints. Coordinate upgrades require understanding the full graph.

6. **Use semantic versioning for shared packages.** Version all shared packages with strict semver. Breaking changes only in major versions. Never break backward compatibility in minor or patch releases.

7. **Use hybrid approach for mixed needs.** Keep a monorepo for closely related modules (billing, catalog, identity) and separate repos for loosely coupled external services (notification service, analytics pipeline).

## Validation Checklist
- [ ] Module boundaries are enforced even within monorepo
- [ ] CI uses path-based filtering for selective execution
- [ ] Multi-repo setup includes shared contracts package
- [ ] Cross-repo dependency graph is documented
- [ ] Team can articulate why their repo structure exists
- [ ] Shared packages use strict semantic versioning
- [ ] Module boundaries prevent cross-module direct access

## Common Failures
- **Microservices driving multi-repo prematurely:** Creating 5 repos for what could be a modular monolith. Start modular monolith, extract when needed.
- **Monorepo without module boundaries:** Putting everything in one repo without structure. Enforce module boundaries even within monorepo.
- **Multi-repo without shared contracts:** Splitting repos without shared contracts package. Code duplication and drift follow.

## Decision Points
- **Monorepo CI death?** As monorepo grows, CI slows. Mitigate with path-based filtering, parallel test execution, and selective test suites.
- **Multi-repo versioning hell?** Module A requires v2 of contracts, Module B requires v3. Mitigate with semantic versioning and coordinated upgrade windows.

## Performance Considerations
- Monorepo CI: As repo grows, optimize with path-based filtering and selective test execution.
- Multi-repo CI: Each repo's CI is independent and fast, but cross-cutting changes require N repo changes.
- Repository size: Large monorepos slow `git clone` and IDE indexing.

## Security Considerations
- Multi-repo may reduce blast radius of compromised CI pipelines.
- Monorepo requires more careful branch protection and access control.

## Related Rules
- Rule: Default to Monorepo for Laravel Projects Under 50 Engineers (COS-11/05-rules.md)
- Rule: Use Path-Based CI Filtering in Monorepos to Keep CI Under 10 Minutes (COS-11/05-rules.md)
- Rule: Enforce Module Boundaries Even Within a Monorepo (COS-11/05-rules.md)
- Rule: Never Split Into Multi-Repo Without a Shared Contracts Package (COS-11/05-rules.md)
- Rule: Keep Multi-Repo Dependency Graph Documented and Visible (COS-11/05-rules.md)
- Rule: Prefer Modular Monolith Over Microservices for Laravel Projects (COS-11/05-rules.md)
- Rule: Use Semantic Versioning for Shared Packages in Multi-Repo (COS-11/05-rules.md)
- Rule: Use Hybrid Approach — Monorepo for Related Modules, Multi-Repo for External Services (COS-11/05-rules.md)

## Related Skills
- Scale Code Organization for Multi-Team (10+ Engineers) (COS-10/06-skills.md)
- Choose Between Modular Monolith and Microservices (MMD-17/06-skills.md)
- Plan Module Extraction Path from Monolith (MMD-11/06-skills.md)

## Success Criteria
- Repository structure matches team and deployment needs.
- Monorepo CI stays under 10 minutes with path-based filtering.
- Module boundaries are enforced regardless of repo structure.
- Multi-repo setup has versioned shared contracts and documented dependency graph.
