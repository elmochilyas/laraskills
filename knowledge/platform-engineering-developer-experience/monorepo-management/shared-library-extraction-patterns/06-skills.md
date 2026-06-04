# Skills: Shared Library Extraction Patterns

## Metadata
- **Domain:** Platform Engineering & Developer Experience
- **Subdomain:** Monorepo Management
- **KU:** Shared Library Extraction Patterns
- **Phase:** 6 (Skill Extraction)

---

## Skill 1: Extract Shared Code from a Laravel Application into a Reusable Package

### Purpose
Identify, extract, and distribute duplicated code across Laravel applications into a versioned, tested, and documented shared library.

### When To Use
Same or very similar code exists in 2+ Laravel applications; organization wants to enforce consistent implementations of cross-cutting concerns; repeated patterns (traits, helpers, commands) across projects.

### When NOT To Use
Code is still evolving rapidly (wait for API to stabilize); only one consumer; code implements application-specific business logic; organization lacks resources to maintain shared libraries long-term.

### Prerequisites
- Two or more Laravel applications with duplicated code
- Composer and private registry (or path repos for monorepo)
- Static analysis tools for code discovery
- Commitment to ongoing library maintenance

### Inputs
- List of candidate code segments (traits, DTOs, validation rules, commands)
- Number of independent usages per candidate
- Consuming application names and codebase locations
- Existing test coverage for each candidate

### Workflow
1. **Discovery phase:** Scan applications for duplicated code using static analysis tools (phpcpd, phpstan); identify exact and near-duplicates; verify the rule of three (3+ usages)
2. **Boundary analysis:** Determine what belongs in the library (technical infrastructure: DTOs, validation rules, traits, helpers, commands) vs what stays (business logic)
3. **Extraction phase:** Create new package in `packages/shared/` (monorepo) or new repository (external); set up `composer.json`, PSR-4 autoloading, Pint/PHPStan config, tests with Orchestra Testbench; copy source files and migrate all existing tests
4. **Minimize public API:** Mark internal classes `@internal`; expose only methods consumers truly need; keep the API as simple as the inlined code was — avoid over-abstracting with interfaces and factories
5. **Integration phase:** In each consuming app, replace original code with `composer require` of new package; update imports, service provider registrations, configuration files; run full test suite to verify no breakage
6. **Deprecation phase:** After all consumers migrate, remove original inlined code; maintain backward-compatible aliases for one release cycle if needed
7. **Document migration path:** Write README with before/after examples, configuration changes, upgrade scripts

### Validation Checklist
- [ ] Rule of three satisfied (3+ independent usages before extraction)
- [ ] Extracted library contains infrastructure, not business logic
- [ ] All original tests migrated alongside production code
- [ ] Public API is minimized; internal methods marked `@internal`
- [ ] Library follows SemVer strictly from first release
- [ ] Migration path documented with before/after examples
- [ ] Library has assigned maintainers
- [ ] CI pipeline tests library against all consuming applications
- [ ] Integration complete: original code removed from all consumers
- [ ] Library scanned for vulnerable dependencies

### Common Failures
| Failure | Symptom | Solution |
|---------|---------|----------|
| Extracting too early | API changes multiple times, churn for consumers | Wait for 2-3 independent usages |
| Over-abstracting | Interfaces and factories no consumer needs | Keep extracted library as simple as inlined code |
| Breaking backward compatibility | Consumer breakage on patch update | Follow SemVer; deprecate in MINOR, remove in MAJOR |
| Forgetting to extract tests | Untrusted library with no regression protection | Always migrate tests with production code |
| Business logic in library | Cannot change because other apps depend | Keep business logic in application layer |

### Decision Points
- Extraction timing: wait for rule of three (3+ usages)
- Package granularity: start coarser, split later (DTOs + validation in one package)
- Monorepo vs separate repo: monorepo for same-team consumers; separate repo for cross-team consumers
- API surface: minimize — each public method is a backward-compatibility promise

### Performance Considerations
- Budget 2-5 days per significant extraction including testing and migration
- Each shared library adds 10-30 seconds to `composer install/update`
- Shared libraries add their own tests but enable write-once-test-everywhere efficiency
- With optimized autoloading (`dump-autoload -o`), package autoloading overhead is negligible

### Security Considerations
- Scan all shared libraries for vulnerable dependencies; a vulnerability in shared lib affects all consumers
- Internal shared libraries must use a private Composer repository (Private Packagist/Satis)
- All extractions go through code review focusing on API design, test coverage, and security implications
- Sign shared library releases; verify package integrity before installation

### Related Rules
- EXTRACT-RULE-001 (Rule of three)
- EXTRACT-RULE-002 (Extract tests with code)
- EXTRACT-RULE-003 (Minimize public API)
- EXTRACT-RULE-004 (Extract infrastructure, not business logic)
- EXTRACT-RULE-005 (Document migration path)
- EXTRACT-RULE-006 (Discovery phase)
- EXTRACT-RULE-010 (Package granularity)
- EXTRACT-RULE-011 (Keep extracted library as simple as inlined code)
- EXTRACT-RULE-012 (Follow SemVer strictly)
- EXTRACT-RULE-014 (Private Composer repository)

### Related Skills
- Configure Composer Path Repository Usage
- Set Up Private Packagist / Satis
- Design Package Skeleton Structure
- Manage Dependencies Across a Monorepo
- Implement Package Versioning with SemVer

### Success Criteria
- Duplicated code eliminated from all consuming applications
- Extracted library passes all original tests plus new integration tests
- Consuming apps can upgrade library independently via SemVer
- Library API is stable and minimal; internal implementation can change freely
- Migration completed within planned timeline without production incidents
