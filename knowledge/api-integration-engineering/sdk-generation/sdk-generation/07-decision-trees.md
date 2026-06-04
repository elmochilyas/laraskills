# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 08-sdk-generation
**Knowledge Unit:** api-client-sdk-generation-distribution
**Generated:** 2026-06-03

---

# Decision Inventory

1. SDK Approach (Manual vs Auto-Generated vs Vendor SDK)
2. Distribution Strategy (Monorepo vs Separate Package, Versioning)
3. Testing Strategy (Contract vs Mock vs Integration)

---

# Architecture-Level Decision Trees

---

## SDK Approach

---

## Decision Context

Choosing how to build and maintain the API client SDK for a given integration.

---

## Decision Criteria

* API complexity
* change frequency
* team size
* maintenance budget

---

## Decision Tree

Does the API have an official PHP SDK (Stripe, Twilio, Mailgun)?
↓
YES → Use vendor SDK directly — wrapping in Saloon adds no value
  ↓
  Vendor SDK well-maintained, Laravel-compatible, actively developed?
  ↓
  YES → Use vendor SDK with service layer abstraction
  NO → Consider Saloon wrapper or auto-generation as alternative
NO → Is the API multi-endpoint (>5 endpoints)?
  ↓
  YES → Use SaloonPHP Connector/Request pattern (manual SDK)
    ↓
    Has OpenAPI/Swagger spec available?
    ↓
    YES → Evaluate auto-generation (Speakeasy, Fern) for initial scaffolding
      ↓
      Spec stable and complete?
      ↓
      YES → Auto-generate SDK, then manual refinement of edge cases
      NO → Manual Saloon SDK — spec too unreliable for generation
    NO → Manual Saloon SDK — no spec to generate from
  NO → Single endpoint, no auth → Use Http facade; SDK overhead premature
↓
  API auth complexity?
  ↓
  Simple (Bearer token) → Saloon default auth plugin sufficient
  Complex (OAuth2, multi-step) → Custom auth plugin or vendor SDK
↓
  Pagination required?
  ↓
  YES → Saloon pagination plugin with custom Paginator class
  NO → Single-page responses; no pagination abstraction needed

---

## Rationale

Vendor SDKs are lowest effort when well-maintained. Saloon provides structured patterns for multi-endpoint APIs. Auto-generation accelerates initial scaffolding but needs manual refinement for edge cases.

---

## Recommended Default

**Default:** Manual Saloon SDK for APIs with >5 endpoints; Http facade for simple single-endpoint calls; vendor SDK for Stripe/Twilio/Mailgun
**Reason:** Appropriate complexity for each tier — no over-engineering for simple cases, sufficient structure for complex ones

---

## Risks Of Wrong Choice

Wrapping vendor SDK in Saloon adds maintenance without benefit. Auto-generating from unstable spec produces code that needs constant rework. Http facade on complex API leads to scattered, unmaintainable HTTP call code.

---

## Related Rules/Skills

* ku-aie-005: Package Landscape (Saloon vs Http facade selection)
* 09-package-landscape: package-landscape (HTTP client decision framework)

---

---

## Distribution Strategy

---

## Decision Context

Determining how the SDK is packaged, versioned, and distributed to consumers.

---

## Decision Criteria

* number of consumers
* API versioning strategy
* release frequency
* dependency management

---

## Decision Tree

Is the SDK consumed by multiple applications?
↓
YES → Distribute as separate Composer package with semantic versioning
  ↓
  API has multiple active versions?
  ↓
  YES → Separate namespaces or packages per API version
    ↓
    Approach:
    Namespace: `Vendor\Sdk\V1`, `Vendor\Sdk\V2`
    Package: `vendor/sdk-v1`, `vendor/sdk-v2`
  NO → Single package with API version as configuration parameter
  ↓
  Continuous integration for SDK?
  ↓
  YES → CI pipeline: lint → test (sandbox) → build → publish
  NO → Manual release process (risk of untested packages)
NO → Keep SDK in same repository (monorepo)
  ↓
  Compartmentalize within monorepo?
  ↓
  YES → Dedicated directory (`packages/integration-sdk/`) with own composer.json
  NO → Inline classes in app — tight coupling, no reuse
↓
  Versioning strategy aligned with API provider?
  ↓
  Provider uses date versioning (2024-01) → SDK version mirrors provider version
  Provider uses semver → SDK major = provider major version
  Provider uses no versioning → Pin SDK to specific API endpoint hash
↓
  Changelog and upgrade guide?
  ↓
  YES → Automated changelog from conventional commits
  NO → Breaking changes undocumented — consumers surprised on update

---

## Rationale

Separate package enables independent versioning and testing. Namespace-per-version supports parallel API version consumption. Monorepo is acceptable for single-consumer SDKs to reduce overhead.

---

## Recommended Default

**Default:** Separate Composer package with semver, changelog, CI pipeline; per-version namespaces if API supports multiple versions
**Reason:** Enables clean versioning, independent testing, and consumer-friendly upgrades

---

## Risks Of Wrong Choice

Monorepo SDK makes versioning hard when multiple consumers need different versions. No changelog causes upgrade fear. Single namespace for multi-version API causes breaking change confusion.

---

## Related Rules/Skills

* ku-aie-005: Package Landscape (Composer version constraints)
* 05-api-versioning: api-versioning-strategies (SDK version alignment with API)

---

---

## Testing Strategy

---

## Decision Context

Selecting the appropriate testing approach for the SDK to balance confidence and speed.

---

## Decision Criteria

* API availability
* test speed requirements
* CI pipeline constraints
* API cost

---

## Decision Tree

Does the API provide a sandbox/test environment?
↓
YES → Implement contract tests against sandbox in CI
  ↓
  Sandbox rate-limited or costly?
  ↓
  YES → Run contract tests once per merge to main; mock tests on every commit
  NO → Run contract tests on every CI run (max confidence)
  ↓
  Recorded fixtures for deterministic tests?
  ↓
  YES → Use Saloon `MockClient` with recorded responses for local dev
  NO → Build fixture recording into first sandbox test run
NO → Mock-only testing with recorded responses
  ↓
  Test against recorded responses? (YES = always)
  Refresh fixtures periodically?
  ↓
  YES → Weekly scheduled CI job re-records fixtures from sandbox
  NO → Fixtures stale — test may pass while production fails
↓
  Response DTO type safety coverage?
  ↓
  YES → Unit test each DTO mapping with fixture data (null handling, type casts)
  NO → Runtime type errors on unexpected response shapes
↓
  Error handling coverage?
  ↓
  Test each error scenario: 4xx → typed exception, 5xx → retry, network → NetworkException
  YES → Comprehensive error handling tests prevent silent failures
  NO → Production errors may surface as cryptic Guzzle exceptions

---

## Rationale

Sandbox contract tests provide highest confidence by exercising real API behavior. Fixture-based mock tests enable fast local/commit-level testing. Periodic fixture refresh prevents drift between test data and real API responses.

---

## Recommended Default

**Default:** Contract tests against sandbox in CI (on merge to main); mock tests with Saloon MockClient on every commit; weekly fixture refresh
**Reason:** Balances confidence (contract tests) with speed (mock on every commit) and accuracy (fixture refresh)

---

## Risks Of Wrong Choice

No contract tests allow silent breaking changes through CI. Stale fixtures pass tests while production fails. No error handling tests leave exception pathways unvalidated.

---

## Related Rules/Skills

* ku-aie-005: Package Landscape (Saloon MockClient vs Http::fake)
* 06-integration-architecture: event-sourcing-cqrs (SDK event sourcing patterns)
