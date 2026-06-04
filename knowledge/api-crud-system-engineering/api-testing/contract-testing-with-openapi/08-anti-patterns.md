# Anti-Patterns — Contract Testing with OpenAPI

## Anti-Pattern 1: Spec Without Contract Validation

**Category**: Testing completeness

**Description**: Maintaining an OpenAPI specification but never validating API responses against it in tests.

**Warning Signs**:
- OpenAPI spec exists in the repository but no test calls `assertMatchesOpenApiSpec()`
- No Spectator or similar auto-validation package is installed
- Spec updates are reviewed manually without automated verification

**Why It's Harmful**: An unvalidated OpenAPI spec is aspirational documentation, not a contract. Code and spec diverge immediately after the first deployment. Client SDKs generated from the spec fail against the real API. Every deployment risks breaking consumers.

**Real-World Consequence**: A team spends weeks generating mobile SDKs from the OpenAPI spec. The spec says `author_name` but the API returns `author`. Every mobile build fails at runtime. Root cause: the spec was updated once and never validated against the implementation.

**Preferred Alternative**: Validate every API endpoint response against the OpenAPI spec using `assertMatchesOpenApiSpec()` or Spectator auto-validation middleware.

**Refactoring Strategy**:
1. Install a contract validation library (Spectator, league/openapi-psr7-validator)
2. Add `->assertMatchesOpenApiSpec()` to all endpoint tests
3. Create a dedicated contract test suite and run it in CI

**Detection Checklist**:
- [ ] Every endpoint response is validated against the OpenAPI spec
- [ ] Spec validation is part of the CI pipeline
- [ ] Spec updates require corresponding test updates

**Related Rules**: Validate Every Response Against OpenAPI Spec
**Related Skills**: Validate API Responses Against OpenAPI Schema
**Related Decision Trees**: Tree 1 — Contract Validation Approach

---

## Anti-Pattern 2: Deploying with Invalid OpenAPI Spec

**Category**: CI/CD

**Description**: Allowing deployment when OpenAPI contract tests fail, or never validating the spec file itself for structural correctness.

**Warning Signs**:
- CI pipeline sets `allow_failure: true` for contract tests
- Spec file is never independently validated (no `swagger-cli validate` or equivalent)
- Broken YAML references or invalid schema syntax go undetected

**Why It's Harmful**: A spec that fails validation means the documented contract is wrong. Deploying anyway means the API and its documentation are permanently out of sync. An invalid spec file may cause contract validators to silently skip validation entirely, giving false confidence.

**Real-World Consequence**: A typo in the YAML file (`opeapi` instead of `openapi`) causes the validator to silently fall back to an empty schema. All contract tests pass. The spec is actually invalid. Consumers download a broken spec file.

**Preferred Alternative**: Validate the spec file structurally in CI and treat any contract validation failure as a blocking error.

**Refactoring Strategy**:
1. Add a CI step: `swagger-cli validate openapi.yaml`
2. Remove `allow_failure: true` from contract test CI stage
3. Ensure spec file is valid before any API contract tests run

**Detection Checklist**:
- [ ] Spec file is structurally validated in CI
- [ ] Contract test failures block the CI pipeline
- [ ] No `allow_failure` flag on contract test stages

**Related Rules**: Validate The Spec File Itself, Treat Spec Validation Failures As CI Blocking
**Related Skills**: Validate API Responses Against OpenAPI Schema

---

## Anti-Pattern 3: Single Spec File for Multiple API Versions

**Category**: Architecture

**Description**: Maintaining a single OpenAPI spec file for all API versions when response shapes differ significantly between versions.

**Warning Signs**:
- A single `openapi.yaml` defines both v1 and v2 endpoints
- Version-specific shape differences are handled via conditional `$ref` or `oneOf` in the spec
- Contract tests validate against one spec file regardless of which version the test targets

**Why It's Harmful**: A single spec file cannot accurately describe divergent response shapes. Validating v1 responses against a spec that includes v2 changes creates false failures. Complex `oneOf`/`anyOf` schemas in the spec reduce readability and increase maintenance burden.

**Real-World Consequence**: V2 adds a new `author` object (replacing `author_name` string). The single spec uses `oneOf` to describe both shapes. Contract tests for both versions pass because `oneOf` accepts either shape. Neither version's exact contract is enforced.

**Preferred Alternative**: Maintain separate spec files per API version (`openapi-v1.yaml`, `openapi-v2.yaml`) and validate each version's tests against its corresponding spec.

**Refactoring Strategy**:
1. Split `openapi.yaml` into version-specific files
2. Update contract tests to reference the correct spec file per version
3. Extract shared components into a common `components.yaml` if needed

**Detection Checklist**:
- [ ] Each API version has its own spec file
- [ ] Contract tests validate against the correct version's spec
- [ ] No cross-version contamination in spec definitions

**Related Rules**: Use Per-Version Spec Files
**Related Skills**: Validate API Responses Against OpenAPI Schema
**Related Decision Trees**: Tree 2 — Spec File Versioning

---

## Anti-Pattern 4: Slow Contract Tests Due to Uncached Spec Parsing

**Category**: Performance

**Description**: Parsing the OpenAPI YAML/JSON file on every test method invocation instead of caching the parsed schema.

**Warning Signs**:
- Contract validation tests add significant overhead to the test suite runtime
- Each `assertMatchesOpenApiSpec()` call re-reads and re-parses the spec file
- Developers disable or skip contract tests because they're slow

**Why It's Harmful**: YAML parsing adds 10-50ms per invocation. With 200+ endpoints and both success/error paths, uncached parsing adds 10+ seconds to the test suite. Developers respond by reducing contract coverage or skipping the contract stage entirely.

**Real-World Consequence**: A team's CI pipeline takes 4 minutes for feature tests + 3 minutes for uncached contract tests. A developer adds an endpoint without contract validation to "save time." Six months later, 20% of endpoints lack contract coverage.

**Preferred Alternative**: Parse the OpenAPI spec once per test suite run and cache it in memory (singleton in service container or `setUpBeforeClass`).

**Refactoring Strategy**:
1. Register the parsed spec as a singleton in the service container or `TestCase::setUp()`
2. Ensure `assertMatchesOpenApiSpec()` or equivalent uses the cached instance
3. Verify the speed improvement: contract validation overhead drops to <1ms per test

**Detection Checklist**:
- [ ] OpenAPI spec is parsed once per test suite run
- [ ] Parsed spec is cached in memory (singleton or static property)
- [ ] Contract validation overhead is <1ms per test after caching

**Related Rules**: Cache Parsed Spec In Memory
**Related Skills**: Validate API Responses Against OpenAPI Schema

---

## Anti-Pattern 5: Contract Validation Mixed with Fast-Feedback Tests

**Category**: CI/CD

**Description**: Running contract validation (with 5-50ms overhead per assertion) alongside unit and feature tests in the same CI stage.

**Warning Signs**:
- All tests run in a single `php artisan test` command
- No separation between `--testsuite=Feature` and `--testsuite=Contract`
- CI pipeline has only one test stage

**Why It's Harmful**: Mixing slow contract validation with fast feature tests delays developer feedback. A feature test that runs in 200ms becomes 250ms with contract validation. Across 200+ tests, this adds 10+ seconds to the feedback loop for every push.

**Real-World Consequence**: Developers wait 5+ minutes for test results instead of 2 minutes. They start context-switching during CI runs. Productivity drops. Some developers merge without waiting for CI to finish.

**Preferred Alternative**: Run contract validation as a separate CI stage that executes in parallel with (or after) feature tests, without blocking the fast-feedback loop.

**Refactoring Strategy**:
1. Split tests into two suites: `Feature` (fast, no contract validation) and `Contract` (includes spec validation)
2. Configure CI to run feature tests first, contract tests in parallel
3. Use `needs: []` to run contract tests independently

**Detection Checklist**:
- [ ] Feature tests and contract tests are in separate CI stages
- [ ] Contract tests run in parallel with feature tests (not serial)
- [ ] Feature test feedback is not delayed by contract validation overhead

**Related Rules**: Run Contract Validation As Separate CI Stage
**Related Skills**: Validate API Responses Against OpenAPI Schema
