# Skill: Configure PSR-4 Autoloading for Custom Directories

## Purpose
Modify `composer.json` PSR-4 mappings to support custom directory structures beyond the default `app/` root, enabling domain-based and module-based code organization.

## When To Use
- Adding custom directories outside default `app/` structure
- Implementing domain-based or module-based organization
- Separating test-only code into distinct namespaces
- Creating reusable packages with custom namespace prefixes

## When NOT To Use
- When the default single-root (`App\` → `app/`) setup suffices
- For very small projects with minimal custom structure
- When team members are unfamiliar with PSR-4 configuration
- When added complexity outweighs organizational benefit

## Prerequisites
- Understanding of PHP namespaces and PSR-4 specification
- `composer.json` with existing autoload configuration
- Composer CLI available

## Inputs
- Current `composer.json` autoload section
- Desired namespace-to-directory mapping
- List of custom directory paths

## Workflow
1. **Determine namespace prefix and directory.** Choose a unique namespace prefix that does not overlap with existing roots. For domain-based structure: `"Domains\\": "app/Domains/"`. For modules: `"Modules\\": "modules/"`.

2. **Add the PSR-4 entry in `composer.json`.** Insert the mapping under `autoload.psr-4`. Ensure the namespace prefix ends with `\\` and the directory path ends with `/`.

3. **Verify no overlapping roots.** Confirm the new prefix does not overlap with any existing prefix. `App\Domains\` overlaps with `App\` because classes under `App\Domains\` could resolve through either root.

4. **Run `composer dump-autoload`.** Always regenerate the autoloader after any PSR-4 mapping change. Skipping this step produces "class not found" errors.

5. **Use `autoload-dev` for test infrastructure.** Place test factories, support classes, and test helpers under `autoload-dev` to exclude them from production class maps.

6. **Keep namespace case consistent with directory case.** Use PascalCase for all namespace segments to match directory casing. `App\Services\Payment` requires `app/Services/Payment/`, not `app/services/payment/`.

7. **Document custom mappings.** Add a table in README or ARCHITECTURE.md listing each custom namespace prefix and its directory mapping.

## Validation Checklist
- [ ] `composer dump-autoload` completes after all PSR-4 mapping changes
- [ ] All custom namespace prefixes resolve to correct files
- [ ] Production deployment script includes `composer dump-autoload -o`
- [ ] No overlapping PSR-4 roots exist
- [ ] New developer can identify namespace-to-directory mapping from project documentation
- [ ] Test infrastructure is under `autoload-dev`, not `autoload`
- [ ] All namespace segments use PascalCase matching directory case

## Common Failures
- **Forgetting `composer dump-autoload`** after adding custom mapping. Result: "Class not found" errors.
- **Mismatched namespace and directory:** File at `app/Services/paymentService.php` with `namespace App\Services\Payment`. Filename must match class name exactly.
- **Case sensitivity issues on Linux:** Developing on Windows/macOS (case-insensitive) and deploying to Linux (case-sensitive). Use consistent PascalCase everywhere.
- **Overlapping prefixes:** Two roots that could resolve the same class causes undefined autoloading behavior.

## Decision Points
- **Single vs multiple roots?** Use a single root (`App\` → `app/`) unless separate namespace prefixes provide clear organizational benefit.
- **Prefix naming convention?** Use short, unique prefixes. `Domains\` is clearer than `AppDomains\`. Avoid prefixes that could conflict with vendor packages.

## Performance Considerations
- Development-mode PSR-4 scans filesystem for classes — deep hierarchies slow this scan.
- Production `composer dump-autoload -o` generates a static class map, making directory depth irrelevant.
- With Octane, class files load once at worker boot and cache in memory.

## Security Considerations
- PSR-4 mappings do not affect security boundaries — only class resolution.
- Ensure custom directories are not accidentally web-accessible via misconfigured server roots.

## Related Rules
- Rule: Run `composer dump-autoload` After Every PSR-4 Mapping Change (COS-03/05-rules.md)
- Rule: Never Create Overlapping PSR-4 Roots (COS-03/05-rules.md)
- Rule: Keep Namespace Case Consistent with Directory Case (COS-03/05-rules.md)
- Rule: Use `autoload-dev` for Test Infrastructure Separately (COS-03/05-rules.md)
- Rule: Avoid Unnecessary Multiple PSR-4 Roots (COS-03/05-rules.md)
- Rule: Keep Custom PSR-4 Mappings Stable After Release (COS-03/05-rules.md)
- Rule: Document All Custom PSR-4 Mappings in Project README (COS-03/05-rules.md)

## Related Skills
- Organize Code by Domain (COS-06/06-skills.md)
- Organize Code by Layer Within Default Laravel Structure (COS-02/06-skills.md)
- Apply Laravel's Default Directory Structure for Small Teams (COS-01/06-skills.md)

## Success Criteria
- All custom namespace prefixes resolve correctly.
- Production class map is optimized — no unnecessary autoloading overhead.
- Team can identify namespace-to-directory mapping from documentation.
- No "class not found" errors related to PSR-4 configuration.
