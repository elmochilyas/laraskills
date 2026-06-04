# ECC Anti-Patterns — API Client SDK Auto-Generation from OpenAPI

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | api-integration-engineering |
| **Subdomain** | 02-saloonphp |
| **Knowledge Unit** | API Client SDK Auto-Generation from OpenAPI |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Generated SDK as God Package — No Service Layer Wrapping
2. Modifying Generated Code Directly
3. Trusting Unverified Specs for SDK Generation
4. Unpinned Generator Versions — Non-Deterministic Output
5. No Integration Tests Against Real API Fixtures

---

## Repository-Wide Anti-Patterns

- God Services
- Overengineering
- Premature Abstraction

---

## Anti-Pattern 1: Generated SDK as God Package — No Service Layer Wrapping

### Category
Architecture | Maintainability

### Description
Using the auto-generated SDK directly throughout the application without a service layer wrapper. All application code depends on the generator's output format.

### Why It Happens
The generated SDK has a clean API. Developers start using it directly in controllers and jobs. Adding a wrapper seems like unnecessary indirection.

### Warning Signs
- `$sdk->connector->send(new ListChargesRequest())` in controllers
- No service class between the SDK and application code
- Changing the generator or spec requires modifying every consumer

### Why It Is Harmful
The entire application is coupled to the generated SDK's interface. Changing generators or regenerating with breaking changes requires modifying every consumer. Laravel-specific concerns (caching, logging, circuit breaker) can't be added centrally.

### Real-World Consequences
Speakeasy upgrades from v1 to v2, changing the generated SDK interface. All `$sdk->charges->list()` calls become `$sdk->listCharges()`. 30 controllers, 15 jobs, and 10 commands need updating. Migration takes 2 weeks.

### Preferred Alternative
Create a service layer wrapping the generated SDK. Keep all Laravel-specific concerns in the wrapper.

### Refactoring Strategy
1. Create service classes that wrap generated SDK calls
2. Move caching, logging, retry to the service layer
3. Replace direct SDK usage in controllers with service calls
4. Keep service interface stable even if SDK regenerates
5. Add integration tests for the service layer

### Detection Checklist
- [ ] Generated SDK used directly in controllers/jobs
- [ ] No service layer wrapping generated code
- [ ] Laravel-specific concerns (cache, log) not applied centrally
- [ ] Generator change would require widespread code changes

### Related Rules
Never Modify Generated Code Directly, Keep Generated SDKs in a Separate Package (05-rules.md)

### Related Skills
Automate SaloonPHP SDK Regeneration on API Spec Changes (06-skills.md)

### Related Decision Trees
SDK Packaging and Integration Strategy (07-decision-trees.md)

---

## Anti-Pattern 2: Modifying Generated Code Directly

### Category
Maintainability | Architecture

### Description
Hand-editing auto-generated SDK files to add custom behavior or fix issues. Changes are lost on the next regeneration.

### Why It Happens
It's faster to edit the generated file than to figure out the extension mechanism. The developer doesn't expect to regenerate.

### Warning Signs
- Git diff shows changes to files with "DO NOT EDIT" headers
- Regeneration causes merge conflicts
- Custom logic mixed with generated boilerplate

### Why It Is Harmful
Next regeneration overwrites all custom changes silently. The SDK drifts from the generated baseline. Updating the API spec (regeneration) breaks custom modifications. No trace of what was changed.

### Real-World Consequences
Developer adds error handling to `ListChargesRequest` (generated). 6 months later, the OpenAPI spec is updated and the SDK regenerated. The error handling is silently lost. Production returns unhandled errors for 2 weeks before someone notices.

### Preferred Alternative
Extend generated classes or wrap them in a service layer. Never edit generated files.

### Refactoring Strategy
1. Revert all hand-edits to generated files
2. Identify custom behavior needed
3. Create extending classes that inherit from generated ones
4. Or create wrapper service classes
5. Mark generated directory as read-only (`.gitattributes`, CI check)

### Detection Checklist
- [ ] Generated files show manual edits in git history
- [ ] Regeneration causes merge conflicts or lost changes
- [ ] No extension/wrapper pattern for customization

### Related Rules
Never Modify Generated Code Directly (05-rules.md)

### Related Skills
Automate SaloonPHP SDK Regeneration on API Spec Changes (06-skills.md)

### Related Decision Trees
Auto-Generated vs Hand-Written Code Management (07-decision-trees.md)

---

## Anti-Pattern 3: Trusting Unverified Specs for SDK Generation

### Category
Reliability | Testing

### Description
Generating SDKs from OpenAPI specs that have not been validated against the real API behavior. The generated code compiles but fails at runtime.

### Why It Happens
The spec is provided by the API vendor or written by another team. Developers assume it's accurate because it exists.

### Warning Signs
- SDK compiles but API calls return unexpected results
- DTO type mismatches (string vs null, int vs string) in production
- Missing fields that exist in real API responses
- Extra fields in DTOs that don't exist in real responses

### Why It Is Harmful
The spec is a model of the API, not the API itself. Unvalidated specs have incorrect types, missing nullable annotations, wrong response structures. Generated SDKs fail silently at runtime with type errors or null values.

### Real-World Consequences
Spec says `charge.amount` is always an integer. In production, `amount: null` is returned for free charges. The generated DTO has `public int $amount`. DTO construction throws a TypeError. Payment pages crash for free charges.

### Preferred Alternative
Validate the OpenAPI spec against real API responses before generating SDKs.

### Refactoring Strategy
1. Record real API responses as test fixtures
2. Validate spec coverage: does every real field appear in the spec?
3. Test generated DTOs against real fixtures
4. Add integration tests that exercise generated SDK with real responses
5. Only generate from validated specs

### Detection Checklist
- [ ] Spec not validated against real API responses
- [ ] Generated SDK tested only with fabricated data
- [ ] DTO type mismatches in production

### Related Rules
Use Verified Specs as SDK Generation Source Only (05-rules.md)

### Related Skills
Automate SaloonPHP SDK Regeneration on API Spec Changes (06-skills.md)

### Related Decision Trees
Regeneration Workflow Strategy (07-decision-trees.md)

---

## Anti-Pattern 4: Unpinned Generator Versions — Non-Deterministic Output

### Category
Maintainability | Reliability

### Description
Using `latest` or floating tags for SDK generator versions in CI. Different runs produce different output from the same spec.

### Why It Happens
Developers assume newer versions are always better and don't pin versions. The CI config specifies `speakeasy generate` without `--version`.

### Warning Signs
- Generator version not specified in CI configuration
- SDK diff appears on CI runs with no spec changes
- Unexpected breaking changes in generated SDK between runs

### Why It Is Harmful
A generator upgrade changes SDK output format. The same spec produces different method names, DTO structures, or namespace patterns. CI generates and commits these changes without anyone reviewing them.

### Real-World Consequences
Speakeasy 1.45 → 1.46 renames `createDtoFromResponse()` to `dto()`. CI regenerates the SDK on Monday (1.45) and Wednesday (1.46 — auto-update). Wednesday's PR has 200 files changed with method renames. Reviewer approves without noticing. All consumers are broken.

### Preferred Alternative
Pin the generator version in CI configuration.

### Refactoring Strategy
1. Identify generator version usage in CI config
2. Pin to a specific version (e.g., `--version 1.45.2`)
3. Add version to a `.generator-version` file
4. Upgrade deliberately: change pinned version → review diff → merge
5. Document the upgrade process

### Detection Checklist
- [ ] Generator version not pinned in CI
- [ ] SDK diffs appear without spec changes
- [ ] Breaking changes introduced by generator updates

### Related Rules
Pin Generator Versions in CI (05-rules.md)

### Related Skills
Automate SaloonPHP SDK Regeneration on API Spec Changes (06-skills.md)

### Related Decision Trees
Regeneration Workflow Strategy (07-decision-trees.md)

---

## Anti-Pattern 5: No Integration Tests Against Real API Fixtures

### Category
Testing | Reliability

### Description
Testing generated SDKs only with unit tests using fabricated fixtures that may not match real API responses.

### Why It Happens
Unit tests are faster and don't require network access. Developers assume generated code works correctly without real-world validation.

### Warning Signs
- All tests use hand-crafted fake responses
- No recorded real API response fixtures
- Tests pass but integration fails in production

### Why It Is Harmful
Generated DTOs, serializers, and error handlers are only tested against imaginary data. Real API responses have unexpected null values, different key casing, extra fields, or different date formats. These differences are invisible in unit tests.

### Real-World Consequences
Generated `ChargeDto` expects `created: int` (Unix timestamp). The real API returns `created: "2024-01-15T10:30:00Z"` (ISO 8601 string). Unit tests use `created: 1705312200`. All tests pass. Production has type errors on every charge.

### Preferred Alternative
Test generated SDKs against recorded real API response fixtures.

### Refactoring Strategy
1. Record real API responses as JSON fixtures in the test suite
2. Test DTO construction from each fixture
3. Verify all DTO properties are correctly typed
4. Test error responses parsing
5. Add these tests to CI regeneration pipeline

### Detection Checklist
- [ ] Only unit tests with fabricated fixtures
- [ ] No recorded real API responses in test suite
- [ ] Production failures from spec/real-API mismatches

### Related Rules
Test Generated SDK Against Real API Fixtures (05-rules.md)

### Related Skills
Automate SaloonPHP SDK Regeneration on API Spec Changes (06-skills.md)

### Related Decision Trees
SDK Packaging and Integration Strategy (07-decision-trees.md)
