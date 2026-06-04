# Skill: Manage Module Dependencies and Versioning

## Purpose
Track module dependencies explicitly in `module.json`, enforce acyclic dependency graphs, and run automated checks in CI to prevent architectural degradation from undocumented circular dependencies.

## When To Use
- Any modular monolith with 3+ modules
- From day one of establishing module boundaries

## When NOT To Use
- System with fewer than 3 modules (explicit tracking overhead not justified)

## Prerequisites
- Module boundaries identified and structure established
- `module.json` convention across modules
- CI pipeline for dependency checks

## Inputs
- Module list with dependencies
- Current `module.json` per module
- Import graph from static analysis

## Workflow
1. **Create `module.json` for each module.** Declare name, version, dependencies (module name and version constraint), and priority. List every module this module directly depends on.

2. **Enforce acyclic dependency graph.** Run dependency validation in CI. Use topological sorting to detect cycles. Block any PR introducing a circular dependency.

3. **Keep dependencies per module under 5.** Monitor dependency count as a health metric. A module with 5+ dependencies is a candidate for splitting or redesign.

4. **Use events to break dependency cycles.** When Module A needs Module B but a direct dependency would create a cycle, use events. Events invert dependency direction — publisher has no import dependency on subscriber.

5. **Follow the Stable Dependencies Principle.** Module dependencies should always point toward more stable modules. The shared kernel is the most stable; leaf modules are the least stable.

6. **Run dependency checks in CI.** Validate that declared dependencies match actual imports. Block PRs that introduce undeclared dependencies, circular dependencies, or exceed dependency limits.

7. **Visualize the dependency graph regularly.** Generate Mermaid or DOT output from `module.json` declarations. Review in architecture sync meetings. Spot dense clusters and god modules.

## Validation Checklist
- [ ] Every module has a `module.json` with declared dependencies
- [ ] Dependency graph is acyclic (validated in CI)
- [ ] No module has 5+ dependencies
- [ ] Dependency validation runs in CI (blocks PRs)
- [ ] Dependency visualization is generated and reviewed regularly
- [ ] Dependencies follow Stable Dependencies Principle
- [ ] Events used where dependency cycles would otherwise exist

## Common Failures
- **Undeclared dependencies.** Module A imports Module B without declaring in `module.json`. Fix: CI must detect this.
- **Circular dependencies via events.** Module A listens to B's events and B listens to A's events. Fix: audit event subscription graph.
- **Too many dependencies tolerated.** Module with 8+ dependencies becomes a god module. Fix: split or use events.

## Decision Points
- **Explicit dependency version vs monorepo sync?** In monorepo, use synchronized versions. Use explicit version constraints only when modules could evolve independently.
- **module.json validation in CI vs manual review?** Always CI. Manual review misses subtle dependency creep.

## Performance Considerations
- Dependency analysis runs during CI — no runtime performance impact.
- Boot order determined by module priority — impacts service provider loading order.

## Security Considerations
- No direct security implications — dependency tracking is purely architectural.

## Related Rules
- Rule: Declare Dependencies in module.json (MMD-09/05-rules.md)
- Rule: Enforce Acyclic Graph (MMD-09/05-rules.md)
- Rule: Keep Dependencies Under 5 (MMD-09/05-rules.md)
- Rule: Use Events to Break Cycles (MMD-09/05-rules.md)
- Rule: Run Dependency Checks in CI (MMD-09/05-rules.md)
- Rule: Visualize Dependency Graph (MMD-09/05-rules.md)
- Rule: Depend on More Stable Modules (MMD-09/05-rules.md)

## Related Skills
- Identify Module Boundaries (MMD-02/06-skills.md)
- Manage Sync Inter-Module Communication (MMD-06/06-skills.md)
- Manage Async Inter-Module Communication (MMD-07/06-skills.md)
- Enforce Module Isolation (MMD-12/06-skills.md)

## Success Criteria
- Each module has a `module.json` with accurate dependency declarations.
- The dependency graph is acyclic and validated in CI.
- No module exceeds 5 direct dependencies.
- Dependency visualization is generated and reviewed regularly.
