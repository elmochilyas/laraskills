# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Feature & HTTP Testing
Knowledge Unit: Contract Testing
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
Contract testing verifies that API consumers and producers agree on request/response formats, ensuring changes on one side don't break the other. In the Laravel ecosystem, contract testing is primarily achieved through JSON structure assertions (`assertJsonStructure`, `AssertableJson`), OpenAPI/Swagger specification validation, and consumer-driven contract (CDC) patterns. While no dominant Laravel-native CDC framework exists (2026), lightweight contract tests via feature tests are the pragmatic approach—they validate the API shape against expected consumer requirements.

# Core Concepts
- **Consumer-driven contracts (CDC)**: API consumer defines the expected response shape. Producer tests verify the API still satisfies consumer expectations.
- **OpenAPI/Swagger specification validation**: Define API contracts in OpenAPI format. Test that responses match the specification.
- **JSON structure assertions**: `assertJsonStructure(['data' => ['id', 'name']])` validates the shape without specifying values.
- **Response fixture testing**: Store expected JSON responses as fixtures; compare actual responses to fixtures.
- **Snapshot testing for contracts**: Use snapshot testing (Spatie Snapshot Assertions) to detect unintended API response changes.
- **Pact (PHP)**: The Pact PHP library supports consumer-driven contract testing with a Pact broker. Niche in Laravel but available.
- **Lightweight CDC**: For most Laravel projects, feature test assertions against the JSON structure serve as sufficient contract tests.

# Mental Models
- **Contract as API specification**: The contract is the agreement between consumer and producer. Tests enforce this agreement on the producer side.
- **Structure over values**: Contract tests care about "what fields exist" and "what types they are" more than "what values they contain."
- **Consumer perspective**: Write contract tests from the consumer's point of view. What does the frontend/mobile app/third-party expect?
- **Breaking change detection**: A failing contract test means a breaking API change. This is a deliberate decision, not a bug.

# Internal Mechanics
- **OpenAPI response validation**: Parse the OpenAPI spec, extract response schemas, validate actual response against schema using a validation library (e.g., `cebe/php-openapi` + `justinrainbow/json-schema`).
- **Pact PHP workflow**: Consumer writes tests that define expected interactions. Pact generates a contract file. Producer runs tests against the contract file. A Pact broker coordinates versions.
- **Snapshot-based contracts**: `$response->assertMatchesSnapshot()` stores the first response as the contract baseline. Subsequent runs compare against the baseline.
- **Feature test as contract test**: `$this->getJson('/api/users')->assertJsonStructure($expectedStructure)` is the simplest form of contract testing.
- **Type assertions**: `AssertableJson` `whereType('id', 'integer')` provides type-level contract enforcement.

# Patterns
- **Pattern: Structure-as-contract**
  - Purpose: Use `assertJsonStructure` as a lightweight contract test
  - Benefits: Zero additional dependencies, easy to understand, fast
  - Tradeoffs: Only validates shape, not value constraints or relationships
  - Implementation: Define `expectedUserStructure()` helper; call in user endpoint tests

- **Pattern: OpenAPI spec validation in CI**
  - Purpose: Validate all API responses against an OpenAPI specification
  - Benefits: Single source of truth for API contract; documented API
  - Tradeoffs: OpenAMP spec maintenance overhead; spec/implementation drift risk
  - Implementation: CI step runs schema validation against recorded responses

- **Pattern: Snapshot-based contract change detection**
  - Purpose: Detect unintended API changes via snapshot comparison
  - Benefits: Catches subtle contract changes that structure assertions miss
  - Tradeoffs: Snapshot updates require deliberate review; false positives on ordering/formatting
  - Implementation: `$response->assertMatchesSnapshot()` on key API endpoints

- **Pattern: Consumer-driven contract with Pact**
  - Purpose: Formal CDC with broker-based coordination
  - Benefits: Multi-service contract enforcement; version compatibility tracking
  - Tradeoffs: Significant infrastructure (Pact broker); PHP Pact support is limited
  - Implementation: Set up Pact broker; consumer defines expectations; producer verifies

# Architectural Decisions
- **Lightweight structure assertions vs Pact**: Most Laravel projects never need Pact. Structure assertions + snapshot tests cover 90% of contract testing needs. Use Pact only for multi-service/microservice architectures.
- **OpenAPI spec contract vs test-based contract**: OpenAPI spec is documentation + contract. Test-based contract (assertions) is simpler but not as visible. Use both for best coverage.
- **Snapshot baseline management**: Store snapshots in version control. Review snapshot diffs in PRs. A snapshot change means an API contract change—treat it seriously.
- **Versioned contracts**: For versioned APIs, maintain separate contract tests per version. Structure assertions per version prevent cross-version contamination.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Structure assertions are zero-cost | Only validate shape, not behavior | Supplement with value assertions for critical fields |
| OpenAPI spec serves as documentation | Spec can drift from implementation | Validate spec in CI; enforce spec-first workflow |
| Snapshot contracts catch unintended changes | Snapshot updates bypass review | Require explicit snapshot update commit with justification |
| Pact provides formal CDC | Infrastructure cost; PHP ecosystem is behind | Use only for inter-service contracts |

# Performance Considerations
- Structure assertions: <1ms per response. Fast enough for every API test.
- OpenAPI validation: Schema loading and validation takes 10-50ms. Run in a subset of tests or in CI only.
- Snapshot comparisons: <5ms per comparison. Acceptable for all endpoints.
- Pact verification: Longer due to contract loading and verification. Run in a separate CI workflow.

# Production Considerations
- **API versioning**: Major version changes should have corresponding contract test suites. Old and new contracts coexist during migration.
- **Breaking change policy**: Define what constitutes a breaking change (field removal, type change, required ? optional). Enforce in contract tests.
- **Consumer notification**: When contract tests fail, the API producer knows a change broke the contract. Consumer should be notified before deployment.
- **Contract test scope**: Not every endpoint needs contract tests. Focus on public API endpoints consumed by external teams or mobile apps.
- **Internal vs external APIs**: External API contracts (public/mobile) need stricter enforcement. Internal API contracts can be more lenient.

# Common Mistakes
- **Mistake: Treating snapshot tests as contract tests without review**
  - Why: Snapshots auto-update with `--without-creating-snapshots`
  - Why harmful: API changes are silently accepted; consumers break
  - Better: Require deliberate snapshot update commits with description of change

- **Mistake: Over-specifying contracts**
  - Why: Asserting exact structure with every optional field
  - Why harmful: Adding a new field is a "breaking change" under exact match
  - Better: Assert minimum required structure; use `assertJsonStructure` for optional fields

- **Mistake: No contract tests for error responses**
  - Why: Only contract-testing success responses
  - Why harmful: Error format changes break consumer error handling
  - Better: Contract-test error responses with the same rigor as success

- **Mistake: Ignoring consumer feedback on contracts**
  - Why: Producer defines contracts unilaterally
  - Why harmful: API doesn't serve consumer needs efficiently
  - Better: Involve consumers in contract definition; use consumer-driven approach

# Failure Modes
- **Stale OpenAPI spec**: Spec says `name` is string, actual API returns `name` as null. OpenAPI validation catches this; structure assertions don't.
- **Snapshot auto-update in CI**: Snapshot recorded during CI run may capture wrong or incomplete response. Use `CREATE_SNAPSHOTS=false` in CI.
- **Pact version mismatch**: Consumer and producer on different Pact versions produces verification failures. Keep Pact version synchronized.
- **Floating response data**: Timestamps, UUIDs, and random values cause snapshot mismatches. Use structure assertions for dynamic fields.

# Ecosystem Usage
- **Spatie Laravel OpenAPI (community)**: Community packages exist for OpenAPI spec generation and response validation.
- **Laravel Nova**: Nova's API contract is tested via feature test assertions against expected response structures.
- **Laravel Horizon**: Horizon's monitoring API endpoints use structure assertions to maintain frontend compatibility.
- **API Platform (Laravel)**: API Platform generates OpenAMP specs; contract tests validate responses against the spec.

# Related Knowledge Units
- **Prerequisites**: JSON API testing, Snapshot testing, Feature test HTTP helpers
- **Related Topics**: OpenAPI/Swagger specification, JSON Schema validation, Integration testing
- **Advanced Follow-up**: Pact contract testing, Consumer-driven contract patterns, Multi-service API governance

# Research Notes
- Laravel's HTTP test helpers (get(), post(), put(), delete()) provide a full-stack testing experience without starting a web server — requests flow through the kernel internally
- Response assertions (ssertStatus(), ssertJson(), ssertSee()) are chainable and provide clear failure messages for debugging test failures
- Pest's higher-order expectations (expect()->toBeOk()) provide a more expressive syntax than PHPUnit's $response->assertOk()
- Test datasets (#[DataProvider]) reduce boilerplate when testing multiple input variations for validation and API endpoint testing
- Exception handling testing requires intercepting Laravel's exception handler to assert specific exceptions are thrown with expected messages
