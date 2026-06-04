# Skill: Write Architecture Tests for Layer Boundaries

## Purpose
Create automated architecture tests using Pest or PHPUnit that verify dependency direction between layers, preventing dependency rule violations automatically in CI.

## When To Use
- Any project with defined layer structure
- Multi-layer architecture (three-layer, Clean, Hexagonal)
- CI pipeline exists for running tests
- New team members need guardrails

## When NOT To Use
- Flat codebase with no defined layer structure
- No CI pipeline to enforce tests

## Prerequisites
- Pest with Laravel plugin (or PHPUnit with arch testing)
- Defined layer directories and namespaces
- Documented dependency map

## Inputs
- Layer namespace/directory definitions
- Allowed dependency directions per layer
- Known existing violations (to whitelist temporarily)

## Workflow
1. **Define layer groups in the test file.** Use Pest's `arch()->expect()` or create helper functions that resolve namespaces from paths. Example: `arch('Domain')->expect('App\Domain')->toOnlyUse('App\Domain')`.

2. **Test Domain layer isolation.** `arch('Domain')->expect('App\Domain')->not->toUse('Illuminate')`. Domain must not use any Laravel classes, facades, or helpers.

3. **Test Application layer dependencies.** `arch('Application')->expect('App\Application')->toOnlyUse(['App\Domain', 'App\Application'])`. Application may use only Domain and itself.

4. **Test Presentation layer doesn't use Infrastructure.** `arch('Presentation')->expect('App\Http')->not->toUse('App\Infrastructure')`. Presentation must go through Application.

5. **Test Infrastructure layer doesn't use Presentation.** `arch('Infrastructure')->expect('App\Infrastructure')->not->toUse('App\Http')`.

6. **Test no facades in core layers.** `arch('Core')->expect(['App\Domain', 'App\Application'])->not->toUse('Illuminate\Support\Facades')`.

7. **Whitelist known violations with expiration.** Use Pest's `->ignoring()` for legacy code. Track expiration dates in a comment. Example: `->ignoring('App\Domain\Legacy') // TODO: Remove by 2025-Q3`.

## Validation Checklist
- [ ] Domain layer test: no imports from Illuminate
- [ ] Application layer test: imports only Domain + itself
- [ ] Presentation layer test: does not import Infrastructure
- [ ] Infrastructure layer test: does not import Presentation
- [ ] No Facades in Domain or Application tests
- [ ] Legacy whitelist entries have expiration dates
- [ ] Architecture tests run in CI pipeline
- [ ] Architecture tests are fast (< 1 second total)

## Common Failures
- **Tests passing despite violations.** Incorrect namespace prefix in arch test. Verify with a deliberately failing test.
- **Overly permissive tests.** Using `toOnlyUse()` incorrectly, allowing too many dependencies. Test both allowed and forbidden directions.
- **False positives from vendor.** Arch assertions catching package dependencies. Use `->ignoring()` for allowed vendor packages.
- **Missing test updates after restructuring.** Layer tests not updated when directory structure changes.

## Decision Points
- **Pest arch() vs PHPUnit arch test?** Use Pest for expressive `arch()->expect()` syntax; PHPUnit for teams already committed to PHPUnit only.
- **Single file vs file per layer?** Single `ArchitectureTest.php` for <5 layer pairs; separate files per pair for large projects.

## Performance Considerations
- Architecture tests run in milliseconds — negligible impact on CI test time.
- Scanning large vendor directories: arch() by default only scans app code, not vendor.

## Security Considerations
- Architecture tests don't affect security directly, but they prevent security logic from appearing in wrong layers (e.g., authorization checks in Domain).
- Ensure security-related layers (auth, middleware) are included in arch tests.

## Related Rules
- Rule: Test Domain Layer Isolation (LAP-13/05-rules.md)
- Rule: Test Each Layer Pair Dependency (LAP-13/05-rules.md)
- Rule: Whitelist Existing Violations Temporarily (LAP-13/05-rules.md)
- Rule: Run Architecture Tests in CI (LAP-13/05-rules.md)
- Rule: No Facades in Domain or Application (LAP-13/05-rules.md)
- Rule: Verify Test Integrity with Deliberate Failure (LAP-13/05-rules.md)

## Related Skills
- Enforce the Dependency Rule (LAP-04/06-skills.md)
- Apply Clean Architecture Layers (LAP-02/06-skills.md)
- Apply Three-Layer Architecture (LAP-01/06-skills.md)
- Apply Hexagonal Architecture Ports and Adapters (LAP-03/06-skills.md)

## Success Criteria
- Architecture tests exist for every layer pair and pass in CI.
- Deliberately introducing a layer violation causes a test failure.
- Tests run in <1 second total.
- No architecture violations exist except explicitly whitelisted legacy code with expiration dates.
