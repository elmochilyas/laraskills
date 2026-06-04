# Skill: Select and Document Organizational Pattern

## Purpose
Evaluate current project characteristics (model count, team size, bounded contexts) and select the appropriate organizational pattern, documenting the decision as an ADR.

## When To Use
- Starting a new Laravel project
- Experiencing navigation friction in an existing project
- Onboarding new team members
- Before reorganizing code

## When NOT To Use
- Reorganizing without clear bounded contexts
- Choosing modular pattern for single-team projects
- Mixing multiple organizational patterns

## Prerequisites
- Clear understanding of project domain boundaries
- Model count estimate
- Team size and ownership structure
- Knowledge of all four organizational patterns and their tradeoffs

## Inputs
- Current model count
- Team size and composition
- Identified bounded contexts (or lack thereof)
- Current organizational pattern (if migrating)

## Workflow
1. Count the number of Eloquent models in the application
2. If models < 20: select technical-layer pattern; document decision; skip to step 8
3. If models 20-50: evaluate whether distinct bounded contexts exist
4. If bounded contexts are unclear: select hybrid or technical-layer pattern; document decision; skip to step 8
5. If bounded contexts are clear: evaluate team size
6. If team size < 8: select domain-driven pattern with inter-domain contracts
7. If team size >= 8: select modular pattern with per-module providers and routes
8. Create an ADR documenting: model count, team size, bounded context map, chosen pattern, rationale, and triggers
9. Commit ADR to the project repository

## Validation Checklist
- [ ] ADR documents model count, team size, bounded contexts, chosen pattern, and rationale
- [ ] Bounded contexts are explicitly mapped before any restructuring
- [ ] Pattern selection follows the decision framework (model count → bounded contexts → team size)
- [ ] Chosen pattern is applied consistently to all application files
- [ ] Team members have reviewed and agreed on the decision
- [ ] PSR-4 autoloading configuration is updated if pattern requires custom namespaces
- [ ] Artisan compatibility considerations are documented

## Common Failures
- Choosing domain-driven pattern without bounded context mapping — creates arbitrary groupings
- Selecting modular pattern for single-team application — adds unnecessary overhead
- Mixing patterns within the same project — creates ambiguity about file placement
- Premature domain organization for small applications — empty directories, no benefit

## Decision Points
- How to handle shared code? Extract to `app/Shared/` only when 3+ domains use it; otherwise prefer duplication
- How to enforce boundaries? Use PHPStan/Psalm custom rules for domain-driven; CODEOWNERS + CI for modular
- Artisan compatibility? Accept manual file moves, custom stubs, or packages for non-technical patterns

## Performance Considerations
- Organizational patterns have zero runtime performance impact
- PSR-4 autoloading is O(1) per class — directory depth does not affect production speed
- IDE performance may degrade with very deep nesting (> 4 levels)

## Security Considerations
- Directory structure alone does not enforce security boundaries — use middleware, auth, and authorization independently
- After restructuring, run `composer dump-autoload` to verify autoloading integrity
- Autoloading misconfiguration can expose classes to unintended namespaces

## Related Rules
- Start with Technical-Layer, Evolve When Complexity Demands It (05-rules.md)
- Define Bounded Contexts Before Restructuring (05-rules.md)
- Never Mix Organizational Patterns (05-rules.md)
- Enforce Domain Boundaries with Automated Checks (05-rules.md)
- Keep Shared Kernel Minimal (05-rules.md)
- Do Not Use Modular Organization for Single-Team Applications (05-rules.md)
- Document Organizational Pattern Decisions (05-rules.md)

## Related Skills
- Skill: Migrate Application Between Organizational Patterns
- Skill: Establish Directory Conventions
- Skill: Organize Service Providers by Domain

## Success Criteria
- Organizational pattern is selected based on objective criteria (model count, team size, bounded contexts)
- Decision is documented in an ADR and committed to the repository
- Team members understand and agree on the pattern
- Pattern is applied consistently across the entire application

---

# Skill: Migrate Application Between Organizational Patterns

## Purpose
Move an existing Laravel codebase from one organizational pattern to another (e.g., technical-layer to domain-driven) while maintaining functional correctness.

## When To Use
- Existing application has outgrown its current pattern
- Team structure has changed, requiring different ownership boundaries
- Application has reached model count thresholds justifying reorganization

## When NOT To Use
- Without first documenting bounded contexts
- In the middle of a release cycle or deployment
- When the team cannot dedicate focused refactoring time
- Without a rollback plan

## Prerequisites
- ADR documenting target pattern, bounded contexts, and migration rationale
- Complete list of all files in the application
- Understanding of current namespace/autoloading configuration
- Test suite for verifying correctness after migration

## Inputs
- Current pattern and file/directory structure
- Target pattern and desired directory layout
- Bounded context map
- Source and destination namespace mappings

## Workflow
1. Document bounded contexts with responsibilities and interfaces
2. Run `php artisan optimize:clear` to clear all caches
3. Create target directory structure (e.g., `app/Domain/{Domain}/`)
4. Update `composer.json` PSR-4 autoloading if needed
5. For each bounded context (one at a time):
   a. Move all files from their current location to the target domain directory
   b. Update namespace declarations in each moved file
   c. Search the entire codebase for references to the old namespace and update imports
   d. Run the test suite for that domain
6. Extract shared models and infrastructure to `app/Shared/` or `app/Models/`
7. Create per-domain service providers if moving to modular pattern
8. Run `composer dump-autoload`
9. Run full test suite
10. Verify Artisan generator commands produce correct paths for new files

## Validation Checklist
- [ ] Bounded contexts are documented and agreed upon before migration begins
- [ ] Files are moved one domain at a time, with tests verified after each domain
- [ ] All namespace declarations are updated to match new directory layout
- [ ] All import statements throughout the codebase reference correct namespaces
- [ ] `composer dump-autoload` succeeds without errors
- [ ] Full test suite passes
- [ ] Artisan generators (`make:model`, `make:controller`) still function
- [ ] CI pipeline passes with any new boundary enforcement rules
- [ ] Old directory structure can be safely deleted (no remaining references)
- [ ] Migration is committed as discrete, reviewable changes (one domain per commit)

## Common Failures
- Attempting to migrate all domains at once — leads to merge conflicts and coordination chaos
- Moving files without updating imports — causes class-not-found errors
- Not updating test namespace references — tests silently skip or fail
- Missing shared model extraction — domains remain coupled through shared models
- Not running `composer dump-autoload` — autoloader fails to find new file locations

## Decision Points
- Extract to shared kernel vs duplicate? Extract only when 3+ domains use the code; otherwise duplicate
- One commit per domain or one large commit? One domain per commit for reviewability and rollback
- Update imports manually or with automation? Use IDE refactoring tools or `rector` for large migrations

## Related Rules
- Define Bounded Contexts Before Restructuring (05-rules.md)
- Never Mix Organizational Patterns (05-rules.md)
- Enforce Domain Boundaries with Automated Checks (05-rules.md)
- Keep Shared Kernel Minimal (05-rules.md)
- Document Organizational Pattern Decisions (05-rules.md)

## Related Skills
- Skill: Select and Document Organizational Pattern
- Skill: Establish Directory Conventions
- Skill: Organize Service Providers by Domain

## Success Criteria
- All files are moved to the new organizational pattern
- Full test suite passes
- Autoloading works correctly
- No remaining references to old namespace structure
- Shared kernel is minimal (only code used by 3+ domains)
- Old directory structure is removed
