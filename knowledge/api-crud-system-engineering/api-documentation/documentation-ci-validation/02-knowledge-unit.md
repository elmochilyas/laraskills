# Documentation CI Validation

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Documentation
- **Knowledge Unit:** Documentation CI Validation
- **Last Updated:** 2026-06-02

---

## Executive Summary

Documentation CI validation is the practice of automatically verifying API documentation quality, completeness, and accuracy as part of the continuous integration pipeline. Validation rules ensure that documentation does not regress, that all endpoints are documented, that schemas match implementation, and that breaking changes are surfaced before deployment.

CI validation covers: OpenAPI spec validation (syntax, structure, compliance), documentation completeness checks (every endpoint has description, every parameter is documented), contract testing (documented schemas match actual responses), breaking change detection (comparing specs across versions), and changelog presence checks. In Laravel APIs, this typically runs in GitHub Actions, GitLab CI, or Jenkins after code changes and before deployment.

---

## Core Concepts

### Spec Validation
Verify the OpenAPI spec is syntactically correct and structurally valid:

```bash
npx @apidevtools/swagger-cli validate openapi.yaml
npx @redocly/cli lint openapi.yaml --ruleset=recommended
```

Validation checks:
- Valid YAML/JSON syntax
- Required fields present (openapi, info, paths)
- Valid $ref references
- No duplicate operationIds
- Valid HTTP methods and status codes

### Completeness Checks
Ensure every endpoint has minimum required documentation:

```bash
# Operation IDs must be unique and present
# Every endpoint must have summary and description
# Every parameter must have description
# Every operation must document 200-level and 4xx-5xx responses
```

Custom rules via Redocly:

```yaml
rules:
  operation-summary: error
  operation-description: error
  parameter-description: error
  operation-4xx-response: warn
  operation-5xx-response: warn
```

### Breaking Change Detection
Compare two OpenAPI specs for breaking changes:

```bash
npx @redocly/cli compare openapi-v1.yaml openapi-v2.yaml
```

Breaking changes include:
- Removed paths or methods
- Removed required parameters
- Changed parameter types
- Removed response fields
- Added required request body fields
- Narrowed parameter constraints

### Contract Testing
Verify that actual API responses match documented schemas:

```bash
# Dredd (Node.js)
dredd openapi.yaml http://localhost:8000

# Schemathesis (Python)
schemathesis run openapi.yaml --checks all

# PHPUnit contract tests
public function test_get_users_matches_spec()
{
    $response = $this->getJson('/api/users');
    $this->assertMatchesOpenApiSpec($response, 'GET', '/api/users');
}
```

---

## Mental Models

### Documentation as Code
Documentation is subject to the same quality standards as application code: it must be validated, reviewed, and tested. CI validation is the linter and test suite for documentation.

### Shift Left for Documentation Quality
Catch documentation issues early — in PR validation — rather than after deployment. A missing endpoint description is easier to fix during code review than after consumers complain.

### The Documentation Triad
Three layers of validation:
1. **Syntax** — Is the spec valid YAML/JSON?
2. **Structure** — Does the spec follow OpenAPI rules?
3. **Accuracy** — Does the spec match the actual API?

Each layer catches different issues. Syntax validation is quick; accuracy validation requires running the application.

---

## Internal Mechanics

### CI Pipeline Integration
Typical documentation CI pipeline:

```yaml
# .github/workflows/docs.yml
name: API Documentation Validation
on: [pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Validate OpenAPI Spec
        run: npx @redocly/cli lint openapi.yaml
      
      - name: Check Breaking Changes
        run: npx @redocly/cli compare openapi-latest.yaml openapi.yaml
      
      - name: Contract Tests
        run: php artisan serve & npx dredd openapi.yaml http://localhost:8000
```

### Custom Rule Definitions
Define organization-specific documentation rules:

```yaml
# .redocly.yaml
rules:
  operation-operationId: error
  operation-summary: error
  operation-description: error
  operation-tags: error
  path-parameter-defined: error
  
  # Custom: every endpoint must document 401 and 403
  custom-rules:
    myapp/error-responses:
      severity: error
      where:
        - subject: Operation
        - property: responses
        - property: '401'
        - property: '403'
```

### Spec Generation Validation
If using Scramble or Scribe, validate the generated spec, not a manually maintained one:

```bash
php artisan scramble:generate
npx @redocly/cli lint storage/openapi.yaml
```

---

## Patterns

### PR Documentation Checks
Add documentation validation as a required status check in GitHub/GitLab:

```yaml
name: Docs Check
on: pull_request
jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Spec Validation
        run: npx @redocly/cli lint openapi.yaml
      - name: Changelog Required
        run: |
          if git diff --name-only origin/main | grep -q 'openapi.yaml'; then
            if ! grep -q "$(date +%Y-%m-%d)" CHANGELOG.md; then
              echo "Changelog entry required"
              exit 1
            fi
          fi
```

### Spec Diff in PR Comments
Post breaking change detection results as a PR comment:

```bash
openapi-diff openapi-latest.yaml openapi.yaml --format markdown >> comment.md
gh pr comment $PR_NUMBER --body-file comment.md
```

### Contract Test Coverage
Run contract tests for all documented endpoints:

```bash
dredd openapi.yaml http://localhost:8000 \
  --hookfiles=./dredd-hooks/*.js \
  --reporter=markdown \
  --output=contract-test-report.md
```

### Documentation Quality Gate
Block PRs that degrade documentation quality below a threshold:

| Metric | Pass | Warn | Fail |
|---|---|---|---|
| Endpoints with description | >90% | >70% | <70% |
| Parameters with description | >90% | >70% | <70% |
| Error status codes documented | >80% | >50% | <50% |
| Spec validation errors | 0 | 1-3 | >3 |

---

## Architectural Decisions

### Lint vs Test Validation
Lint validation (syntax, structure, completeness) runs fast and catches most issues. Test validation (contract tests) runs slow but catches accuracy issues. Decision: Run lint checks on every PR; run contract tests nightly or on merge to main.

### Generated vs Maintained Spec Validation
If the spec is auto-generated (Scramble), validate the generator output. If the spec is manually maintained, validate the spec file directly. Auto-generated specs require less validation (they are structurally correct by construction) but still need accuracy validation.

### Breaking Change Tolerance
Define what constitutes a breaking change for your API. Some changes (adding optional parameters, adding response fields) are backward-compatible. Others (removing fields, changing types) are breaking. Configure tooling to distinguish these categories.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Catches docs issues before deployment | CI pipeline time increases | Run lint checks fast, contract tests async |
| Breaking change detection prevents surprises | Requires versioned OpenAPI specs | Store spec for each API version |
| Contract tests ensure accuracy | Tests are slow and fragile | Run subset on every PR |
| Custom rules enforce standards | Rule maintenance overhead | Keep rules minimal and documented |

---

## Performance Considerations

### Validation Pipeline Duration
- Spec lint: 1-10 seconds
- Breaking change diff: 5-30 seconds
- Contract tests: 30 seconds to 5 minutes per endpoint
- Full documentation validation for 100 endpoints: 2-10 minutes

Optimize by running lint checks always, contract tests selectively.

---

## Production Considerations

### Blocking vs Non-Blocking Checks
Lint and breaking change checks should block PRs from merging. Contract test failures should block deployment but may allow merging with warnings.

### Documentation Status Badge
Add a documentation quality badge to the repository README:

```markdown
[![Docs Validated](https://img.shields.io/badge/docs-validated-brightgreen)]()
```

### Spec Artifact Storage
Store generated/validated specs as CI artifacts for each build:

```yaml
- name: Store Spec
  uses: actions/upload-artifact@v4
  with:
    name: openapi-spec
    path: openapi.yaml
```

---

## Common Mistakes

### No Documentation Validation at All
Why it happens: Docs are seen as a nice-to-have, not a quality metric. Why it's harmful: Docs silently drift from implementation until they are entirely wrong. Better approach: Add at least spec lint validation to the CI pipeline.

### Only Validating Syntax, Not Content
Why it happens: Syntax validation is easy to set up. Why it's harmful: The spec may be valid but incomplete — missing descriptions, missing error responses. Better approach: Add completeness rules to lint configuration.

### Skipping Breaking Change Detection
Why it happens: No process for storing and comparing previous specs. Why it's harmful: Breaking changes are discovered after deployment when consumers complain. Better approach: Archive each version's spec and diff on every change.

### Contract Tests Only for Happy Path
Why it happens: Error responses require more setup (auth tokens, invalid data). Why it's harmful: Error response schemas are never validated. Better approach: Test at least one error response per endpoint.

---

## Failure Modes

### False Positive Breaking Change Detection
Tool reports a breaking change for adding an optional parameter (which is backward-compatible). Failure mode: Developer ignores breaking change warnings, missing real breaks. Mitigation: Configure tooling to ignore backward-compatible changes.

### Stale Contract Test Environment
Contract tests run against a stale database or mock. Failure mode: Tests pass even though API responses changed. Mitigation: Ensure test environment recreates state before each run.

### Validation Becomes a Bottleneck
Documentation validation takes 15 minutes and blocks all PRs. Failure mode: Developers bypass documentation checks. Mitigation: Split fast checks (lint) and slow checks (contract tests); run fast checks on PR, slow checks nightly.

---

## Ecosystem Usage

### Redocly CLI
Redocly provides comprehensive OpenAPI linting with custom rules, spec comparison for breaking changes, and bundling. Widely used in CI pipelines for OpenAPI validation.

### Spectral (Stoplight)
Spectral is a JSON/YAML linter with OpenAPI-specific rulesets. It supports custom rules written in a simple DSL and integrates with most CI platforms.

### Dredd
Dredd is an HTTP API testing framework that validates API responses against OpenAPI specs. It supports hooks for authentication, database setup, and custom assertions.

### PHPUnit OpenAPI Assertions
Various PHP packages provide assertions for matching Laravel test responses against OpenAPI schemas:

```php
$this->assertResponseMatchesSpec($response, 'GET', '/api/users');
```

---

## Related Knowledge Units

### Prerequisites
- OpenAPI Spec Generation — The artifact being validated
- CI/CD Pipeline Basics — GitHub Actions, GitLab CI configuration

### Related Topics
- Endpoint Documentation Content — What should be documented per endpoint
- Changelog Generation — Changelog presence validation
- Breaking Change Identification — Spec comparison methodology

### Advanced Follow-up Topics
- Custom Redocly Rules — Writing organization-specific documentation rules
- Contract Testing Strategies — Advanced contract test patterns
- Documentation Quality Metrics — Quantitative measurement of doc quality

---

## Research Notes

### Source Analysis
- Redocly CLI: https://redocly.com/docs/cli — OpenAPI linting, bundling, and diff
- Spectral: https://stoplight.io/open-source/spectral — Customizable OpenAPI linter
- Dredd: https://dredd.org — HTTP API contract testing framework

### Key Insight
Documentation CI validation is most effective when it provides immediate feedback (in PRs) and clear actionable messages. A validation failure should tell the developer exactly what is missing and how to fix it.

### Version-Specific Notes
- Redocly CLI v1.0+: OpenAPI 3.1 support with custom rules
- Spectral v6+: OpenAPI 3.1 support with improved performance
- Dredd v14+: Maintained but slower to adopt OpenAPI 3.1 features
- GitHub Actions: `redocly-cli-github-action` for easy integration
