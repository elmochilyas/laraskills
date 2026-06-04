# Skill: Establish Directory Conventions

## Purpose
Create and document a consistent directory structure for a Laravel project that follows a single organizational strategy, maintains case consistency, and avoids premature top-level directory creation.

## When To Use
- Starting a new Laravel project
- Establishing team conventions for a project
- Reviewing and fixing an existing project's directory structure
- Enforcing consistency across multiple projects

## When NOT To Use
- When the project already has a consistent pattern (document it instead)
- When planning a structural migration (use organizational pattern migration skills)
- For packages or modules with their own conventions

## Prerequisites
- Understanding of PSR-4 autoloading and Laravel's namespace-to-directory mapping
- Knowledge of the chosen organizational pattern (technical, hybrid, domain, or modular)
- Access to modify `composer.json` if adding custom PSR-4 prefixes

## Inputs
- Chosen organizational pattern (from ADR or team decision)
- Current directory structure (if existing project)
- `composer.json` autoload configuration

## Workflow
1. Choose one organizational pattern (technical-layer, hybrid, domain-driven, or modular) — document the decision
2. Start with Laravel's default scaffold: `app/`, `config/`, `database/`, `resources/`, `routes/`, `storage/`, `tests/`
3. Create additional top-level directories under `app/` only when you have concrete files to place there
4. Maintain case consistency: every namespace segment must match the directory casing exactly
5. Keep directory depth at maximum 3 levels under `app/` (exception: modular patterns allow 4)
6. If using domain subdirectories: create them within each layer (e.g., `app/Http/Controllers/Billing/`)
7. Ensure shared infrastructure (middleware, exceptions, base providers) lives outside domain directories
8. Document the convention in `CONTRIBUTING.md` or a project README

## Validation Checklist
- [ ] Single organizational pattern is chosen and documented
- [ ] No empty top-level directories exist without files
- [ ] Every namespace segment matches its directory casing exactly
- [ ] Maximum directory depth under `app/` is 3 levels (4 for modular)
- [ ] No role-based directories (`Admin/`, `Frontend/`, `Backend/`) as top-level units
- [ ] No mixing of patterns (no both `app/Services/` and `app/Domain/*/Services/`)
- [ ] Shared infrastructure is clearly separated from domain code
- [ ] `composer dump-autoload` succeeds after any directory changes
- [ ] CI check exists for case-consistency and pattern enforcement (optional but recommended)

## Common Failures
- Creating multiple empty directories anticipating future needs — creates speculation-driven architecture
- Case mismatch between namespace and directory — fails on Linux deployment
- Mixing organizational patterns (technical at top, domain within) — creates ambiguity
- Using role-based directories — creates arbitrary team-structure-bound organization
- Nesting beyond 4 levels — creates verbose namespace prefixes and slower IDE navigation

## Decision Points
- Technical vs hybrid? Use technical for <20 models; hybrid for 20-50 models with clear bounded contexts
- Create directory now or later? Create only when the first file for that directory exists
- Shared code location? `app/Shared/` for domain/modular patterns; `app/` root for technical-layer

## Performance Considerations
- Directory structure has zero runtime performance impact — PSR-4 autoloading is O(1) in production
- Deep nesting (>4 levels) affects IDE file tree rendering
- Empty directories have no performance impact but reduce navigability

## Security Considerations
- `storage/` and `bootstrap/cache/` must be writable by web server; all other directories read-only
- `vendor/` directory integrity must be protected — compromised vendor breaks autoloading
- Case-sensitive namespace enforcement prevents production autoloading failures

## Related Rules
- Start with Default Laravel Directory Structure (05-rules.md)
- Maintain Case Consistency Between Namespace and Directory (05-rules.md)
- Never Mix Organizational Strategies (05-rules.md)
- Keep Directory Depth at Maximum 3 Levels (05-rules.md)
- Prevent Premature Top-Level Directory Creation (05-rules.md)
- Do Not Organize by Developer Role (05-rules.md)

## Related Skills
- Skill: Select and Document Organizational Pattern
- Skill: Migrate Application Between Organizational Patterns

## Success Criteria
- Directory structure follows a single documented organizational pattern
- Case consistency is maintained between all namespaces and directories
- No premature (empty) top-level directories exist
- Maximum depth is enforced
- Convention is documented and accessible to all team members
