# Skill: Configure PSR-4 Autoloading for Multi-Layer Laravel Projects

## Purpose
Set up multiple PSR-4 autoloading roots in `composer.json` so each architecture layer (Infrastructure, Application, Domain, Presentation) has its own namespace root, clear dependency boundaries, and an auditable import trail visible through use statements.

## When To Use
- Clean Architecture or Hexagonal Architecture projects
- Any multi-layer structure where layer independence matters
- Teams needing automated boundary enforcement through namespace isolation

## When NOT To Use
- Single-layer MVC projects — the default `App\\` namespace is sufficient
- Projects where all code lives under one namespace and layers are directories only

## Prerequisites
- Defined layer directory structure (e.g., `src/Domain/`, `src/Application/`)
- Composer installed with write access to `composer.json`
- Understanding of PHP namespaces and PSR-4

## Inputs
- Layer directory paths
- Desired namespace hierarchy
- Current `composer.json` autoload section

## Workflow
1. **Define PSR-4 namespace-to-directory mappings.** Add entries in `composer.json` `"autoload"` `"psr-4"` section. Use the pattern: `"App\\Domain\\" => "src/Domain/", "App\\Application\\" => "src/Application/"`. Each layer's namespace root maps to its own directory.

2. **Keep Presentation and Infrastructure under existing App namespace if desired.** Add separate PSR-4 roots only where strict boundary enforcement matters most. Presentation and Infrastructure can share `App\\` if appropriate.

3. **Run `composer dump-autoload`.** Regenerate the autoloader after every change to `composer.json` mappings.

4. **Create a starter class file in each namespace root.** This verifies autoloading works and establishes the pattern for each layer.

5. **Verify autoloading with `composer dump-autoload -o` (optimized).** Run the optimized autoloader dump. Confirm classes autoload without errors by instantiating a test class from each layer.

6. **Document the namespace structure.** Add a comment or README showing the mapping between namespaces and directories.

## Validation Checklist
- [ ] `composer.json` has separate PSR-4 entries for each layer that needs namespace isolation
- [ ] `composer dump-autoload` completes without errors
- [ ] A test class in each layer's namespace root can be instantiated
- [ ] Optimized autoloader (`-o`) works correctly
- [ ] No directory serves two PSR-4 roots (duplicate mapping)
- [ ] Directory structure matches namespace hierarchy
- [ ] `vendor/composer/autoload_psr4.php` contains the expected entries
- [ ] Octane/performance sensitive projects use `-o` flag

## Common Failures
- **Overlapping namespace roots.** `App\\` and `App\\Domain\\` both defined — the more specific one wins, but confusion ensues. Use distinct roots: `App\\Domain\\` → `src/Domain/`, not nested under default `App\\`.
- **Missing trailing backslash.** PSR-4 requires trailing `\\` in the namespace prefix. `"App\\Domain"` is incorrect; `"App\\Domain\\"` is correct.
- **Case sensitivity mismatches.** Directory case must match namespace case on case-sensitive filesystems (CI, production Linux).
- **Forgetting `composer dump-autoload` after changes.** New classes won't be found; error messages look like class-not-found issues.

## Decision Points
- **Separate PSR-4 roots vs single root with subdirectories?** Use separate roots only when layer independence must be enforced. Separate roots make layer ownership explicit and enable namespace-level architecture testing.
- **Custom namespace prefix vs default App?** Custom prefixes (`Domain\\`, `Application\\`) make layer imports in use statements immediately visible.

## Performance Considerations
- Multiple PSR-4 roots add negligible autoloading overhead compared to a single root.
- Optimized autoloader (`-o`) is recommended for production to generate classmap.
- Octane compatibility relies on standard PSR-4 autoloading — multiple roots work correctly.

## Security Considerations
- Namespace structure does not affect security — authentication and authorization logic still require proper implementation regardless of namespace organization.

## Related Rules
- Rule: Define PSR-4 Namespace Per Layer (LAP-05/05-rules.md)
- Rule: Distinct Namespace Roots Avoid Overlap (LAP-05/05-rules.md)
- Rule: Run composer dump-autoload After Changes (LAP-05/05-rules.md)
- Rule: Document Namespace Structure (LAP-05/05-rules.md)
- Rule: Case Sensitivity Matters in CI (LAP-05/05-rules.md)

## Related Skills
- Enforce the Dependency Rule (LAP-04/06-skills.md)
- Apply Hexagonal Architecture Ports and Adapters (LAP-03/06-skills.md)
- Write Architecture Tests for Layer Boundaries (LAP-13/06-skills.md)

## Success Criteria
- Each architecture layer has its own PSR-4 namespace root in `composer.json`.
- `composer dump-autoload -o` runs without errors.
- Classes in each namespace autoload correctly.
- Use statements clearly show layer of origin.
