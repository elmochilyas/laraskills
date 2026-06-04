# Structure Rationale

The folder architecture for API & CRUD System Engineering follows three organizing principles:

**1. Design-first organization.** Subdomains are ordered by design dependency — foundational design decisions first (REST API Design), then structural decisions (CRUD Architecture, Resource Controllers), then implementation concerns (Response Structures, Error Handling), then lifecycle management (Versioning, Documentation, Testing, Governance). This mirrors the architectural decision process a team follows when building an API from scratch.

**2. Separation from framework mechanics.** Topics that overlap with Laravel Core Application Engineering (resourceful routing mechanics, route model binding, API Resource class internals) are deliberately excluded. This domain owns the DESIGN decisions that determine HOW framework features are used, not the framework feature implementation itself.

**3. Governance as a top-level subdomain.** API lifecycle and governance is a first-class subdomain (not buried in a "miscellaneous" folder) because team consistency rules, deprecation policies, and architectural governance are the mechanisms that prevent API degradation over time. Without explicit governance, every other subdomain produces isolated knowledge that teams fail to apply consistently.

## Design Rules Applied

- Each Knowledge Unit is a leaf node (file).
- Subdomains are directories containing related Knowledge Units.
- No single-file directories — if a topic has only one Knowledge Unit, it lives at the parent level.
- Directory names are kebab-case, matching ECC naming conventions.
- The tree is shallow (2-3 levels max) to avoid burying knowledge.
- Future topics add leaf nodes within existing subdomains; new subdomains are added only when a topic cannot fit existing structure.
- Cross-references to Laravel Core Application Engineering are noted in `_index.md` files rather than duplicating content.

---

# Proposed ECC Folder Tree

```
knowledge/
└── api-crud-system-engineering/
    ├── _index.md                              (domain overview, navigation, cross-domain refs)
    │
    ├── rest-api-design/
    │   ├── _index.md                          (subdomain overview)
    │   ├── rest-architectural-constraints.md  (Foundation)
    │   ├── resource-vs-action-orientation.md  (Foundation)
    │   ├── resource-naming-conventions.md     (Intermediate)
    │   ├── http-method-semantics.md           (Foundation)
    │   ├── http-status-code-selection.md      (Foundation)
    │   ├── url-structure-design.md            (Intermediate)
    │   ├── hateoas-hypermedia-controls.md     (Advanced)
    │   ├── rest-maturity-model.md             (Advanced)
    │   ├── content-negotiation.md             (Intermediate)
    │   ├── conditional-requests.md            (Expert)
    │   ├── rest-purity-vs-pragmatic.md        (Expert)
    │   ├── idempotency-semantics.md           (Intermediate)
    │   └── cors-design.md                     (Intermediate)
    │
    ├── crud-architecture/
    │   ├── _index.md
    │   ├── thin-controller-principle.md       (Foundation)
    │   ├── controller-dto-action-flow.md      (Intermediate)
    │   ├── controller-dto-service-flow.md     (Intermediate)
    │   ├── controller-service-repository-flow.md (Advanced)
    │   ├── data-transfer-object-design.md     (Intermediate)
    │   ├── dto-construction-patterns.md       (Intermediate)
    │   ├── dto-nesting-composition.md         (Advanced)
    │   ├── spatie-laravel-data-integration.md (Advanced)
    │   ├── action-class-design.md             (Intermediate)
    │   ├── action-composition.md              (Advanced)
    │   ├── transactional-actions.md           (Advanced)
    │   ├── queued-actions.md                  (Expert)
    │   ├── service-class-design.md            (Intermediate)
    │   ├── service-orchestration.md           (Advanced)
    │   ├── service-vs-action-decision.md      (Advanced)
    │   ├── repository-pattern-design.md       (Advanced)
    │   ├── repository-vs-eloquent-decision.md (Advanced)
    │   ├── layer-isolation-rules.md           (Expert)
    │   ├── when-to-skip-layers.md             (Intermediate)
    │   ├── request-lifecycle-complete-flow.md (Foundation)
    │   ├── directory-organization-strategies.md (Intermediate)
    │   └── ddd-folder-conventions-for-apis.md (Advanced)
    │
    ├── resource-controllers/
    │   ├── _index.md
    │   ├── resource-controller-pattern.md     (Foundation)
    │   ├── api-resource-controllers.md        (Intermediate)
    │   ├── singleton-resource-controllers.md  (Intermediate)
    │   ├── nested-resources-shallow-nesting.md (Intermediate)
    │   ├── partial-resource-routes.md         (Intermediate)
    │   ├── single-action-invokable-controllers.md (Foundation)
    │   ├── controller-dependency-injection.md (Intermediate)
    │   ├── controller-method-injection.md     (Intermediate)
    │   ├── controller-organization-by-version.md (Advanced)
    │   ├── controller-organization-by-domain.md (Intermediate)
    │   ├── controller-code-limits.md          (Intermediate)
    │   ├── controller-form-request-integration.md (Foundation)
    │   ├── controller-action-delegation.md    (Foundation)
    │   ├── controller-response-selection.md   (Intermediate)
    │   ├── controller-middleware-assignment.md (Intermediate)
    │   ├── controller-testing-strategies.md   (Intermediate)
    │   └── thin-controller-enforcement.md     (Advanced)
    │
    ├── response-structures/
    │   ├── _index.md
    │   ├── envelope-response-design.md        (Foundation)
    │   ├── bare-body-response-design.md       (Foundation)
    │   ├── data-wrapping-configuration.md     (Intermediate)
    │   ├── response-format-decision-framework.md (Advanced)
    │   ├── pagination-metadata-design.md      (Intermediate)
    │   ├── cursor-pagination-metadata.md      (Advanced)
    │   ├── pagination-information-customization.md (Intermediate)
    │   ├── top-level-meta-and-links.md        (Intermediate)
    │   ├── conditional-field-inclusion.md     (Intermediate)
    │   ├── conditional-relationship-inclusion.md (Intermediate)
    │   ├── conditional-aggregate-inclusion.md (Intermediate)
    │   ├── sparse-fieldset-design.md          (Expert)
    │   ├── json-api-resource-structure.md     (Advanced)
    │   ├── json-api-compound-documents.md     (Advanced)
    │   ├── rfc-9457-problem-details.md        (Advanced)
    │   ├── response-versioning.md             (Advanced)
    │   ├── response-caching-headers.md        (Intermediate)
    │   └── response-compression.md            (Intermediate)
    │
    ├── error-handling-design/
    │   ├── _index.md
    │   ├── error-type-taxonomy.md             (Intermediate)
    │   ├── standardized-error-envelope.md     (Foundation)
    │   ├── domain-specific-error-codes.md     (Intermediate)
    │   ├── error-code-namespace-design.md     (Advanced)
    │   ├── exception-to-code-mapping.md       (Advanced)
    │   ├── validation-error-shape-design.md   (Intermediate)
    │   ├── authentication-error-responses.md  (Intermediate)
    │   ├── authorization-error-responses.md   (Intermediate)
    │   ├── not-found-error-responses.md       (Intermediate)
    │   ├── conflict-error-responses.md        (Intermediate)
    │   ├── rate-limit-error-responses.md      (Intermediate)
    │   ├── server-error-responses.md          (Intermediate)
    │   ├── custom-exception-classes.md        (Expert)
    │   ├── global-exception-handler-config.md (Advanced)
    │   ├── production-vs-dev-error-detail.md  (Intermediate)
    │   ├── sensitive-data-leak-prevention.md  (Intermediate)
    │   ├── error-tracking-integration.md      (Expert)
    │   ├── error-logging-context.md           (Intermediate)
    │   └── error-response-testing.md          (Intermediate)
    │
    ├── api-versioning/
    │   ├── _index.md
    │   ├── url-path-versioning.md             (Foundation)
    │   ├── header-based-versioning.md         (Advanced)
    │   ├── media-type-versioning.md           (Advanced)
    │   ├── versioning-strategy-selection.md   (Advanced)
    │   ├── controller-inheritance.md          (Advanced)
    │   ├── resource-class-organization.md     (Advanced)
    │   ├── form-request-organization.md       (Advanced)
    │   ├── route-file-organization.md         (Intermediate)
    │   ├── backward-compatible-changes.md     (Intermediate)
    │   ├── breaking-change-identification.md  (Intermediate)
    │   ├── semantic-versioning-for-apis.md    (Intermediate)
    │   ├── deprecation-header-implementation.md (Advanced)
    │   ├── sunset-header-implementation.md    (Advanced)
    │   ├── deprecation-link-headers.md        (Advanced)
    │   ├── phased-deprecation-timeline.md     (Expert)
    │   ├── version-retirement-policy.md       (Expert)
    │   └── when-to-create-new-version.md      (Intermediate)
    │
    ├── api-authentication-authorization/
    │   ├── _index.md
    │   ├── sanctum-vs-passport-decision.md    (Foundation)
    │   ├── sanctum-spa-cookie-auth.md         (Intermediate)
    │   ├── sanctum-token-auth.md              (Intermediate)
    │   ├── token-ability-design.md            (Advanced)
    │   ├── token-expiration-rotation.md       (Intermediate)
    │   ├── api-key-pattern.md                 (Advanced)
    │   ├── signed-request-pattern.md          (Expert)
    │   ├── policy-design-for-apis.md          (Intermediate)
    │   ├── rate-limiting-by-auth-tier.md      (Advanced)
    │   ├── rate-limiter-definition.md         (Advanced)
    │   ├── rate-limit-headers.md              (Advanced)
    │   ├── cors-configuration.md              (Intermediate)
    │   ├── api-security-headers.md            (Intermediate)
    │   ├── ip-based-rate-limiting.md          (Expert)
    │   └── api-specific-middleware.md         (Intermediate)
    │
    ├── input-validation-architecture/
    │   ├── _index.md
    │   ├── form-request-design-for-apis.md    (Foundation)
    │   ├── form-request-organization.md       (Intermediate)
    │   ├── authorization-in-form-requests.md  (Intermediate)
    │   ├── validation-rule-array-design.md    (Intermediate)
    │   ├── custom-validation-rules.md         (Intermediate)
    │   ├── conditional-validation-patterns.md (Advanced)
    │   ├── after-validation-hooks.md          (Advanced)
    │   ├── input-preparation.md               (Intermediate)
    │   ├── dto-integration-payload-method.md  (Advanced)
    │   ├── dto-integration-todto-method.md    (Advanced)
    │   ├── manual-validator-creation.md       (Intermediate)
    │   ├── validation-error-shape-customization.md (Intermediate)
    │   ├── form-request-testing.md            (Intermediate)
    │   ├── bulk-request-validation.md         (Advanced)
    │   └── pagination-parameter-validation.md (Intermediate)
    │
    ├── pagination-strategies/
    │   ├── _index.md
    │   ├── offset-pagination-design.md        (Foundation)
    │   ├── offset-pagination-performance.md   (Intermediate)
    │   ├── cursor-pagination-design.md        (Advanced)
    │   ├── cursor-encoding-strategies.md      (Advanced)
    │   ├── cursor-pagination-performance.md   (Advanced)
    │   ├── keyset-pagination-design.md        (Advanced)
    │   ├── pagination-strategy-selection.md   (Advanced)
    │   ├── per-page-parameter-design.md       (Intermediate)
    │   ├── multi-column-cursor-pagination.md  (Expert)
    │   ├── pagination-link-headers.md         (Intermediate)
    │   ├── pagination-with-complex-filters.md (Advanced)
    │   ├── total-count-performance.md         (Advanced)
    │   ├── zero-result-pagination.md          (Intermediate)
    │   ├── infinite-scroll-pagination.md      (Intermediate)
    │   └── offset-to-cursor-migration.md      (Expert)
    │
    ├── api-documentation/
    │   ├── _index.md
    │   ├── scramble-integration.md            (Advanced)
    │   ├── scribe-integration.md              (Advanced)
    │   ├── openapi-spec-generation.md         (Advanced)
    │   ├── endpoint-documentation-content.md  (Intermediate)
    │   ├── request-body-schema-documentation.md (Intermediate)
    │   ├── response-schema-documentation.md   (Intermediate)
    │   ├── error-response-documentation.md    (Intermediate)
    │   ├── authentication-documentation.md    (Intermediate)
    │   ├── changelog-generation.md            (Intermediate)
    │   ├── documentation-ci-validation.md     (Expert)
    │   ├── postman-collection-generation.md   (Intermediate)
    │   ├── api-version-documentation.md       (Intermediate)
    │   ├── deprecation-notes-in-docs.md       (Intermediate)
    │   ├── sdk-generation-from-openapi.md     (Expert)
    │   └── scramble-vs-scribe-selection.md    (Advanced)
    │
    ├── api-testing/
    │   ├── _index.md
    │   ├── feature-test-structure.md          (Foundation)
    │   ├── happy-path-testing.md              (Foundation)
    │   ├── authentication-failure-testing.md  (Intermediate)
    │   ├── authorization-failure-testing.md   (Intermediate)
    │   ├── validation-failure-testing.md      (Intermediate)
    │   ├── not-found-testing.md               (Intermediate)
    │   ├── response-shape-testing.md          (Intermediate)
    │   ├── response-status-code-testing.md    (Foundation)
    │   ├── response-header-testing.md         (Intermediate)
    │   ├── pagination-response-testing.md     (Intermediate)
    │   ├── error-response-shape-testing.md    (Intermediate)
    │   ├── contract-testing-with-openapi.md   (Advanced)
    │   ├── architecture-tests-for-apis.md     (Advanced)
    │   ├── layer-isolation-in-tests.md        (Advanced)
    │   ├── form-request-unit-testing.md       (Intermediate)
    │   ├── dto-unit-testing.md                (Intermediate)
    │   ├── action-service-unit-testing.md     (Intermediate)
    │   ├── rate-limit-testing.md              (Advanced)
    │   ├── cors-behavior-testing.md           (Advanced)
    │   ├── api-version-behavior-testing.md    (Advanced)
    │   ├── idempotency-key-testing.md         (Advanced)
    │   ├── bulk-operation-testing.md          (Advanced)
    │   ├── test-data-factory-design.md        (Intermediate)
    │   └── api-test-organization.md           (Intermediate)
    │
    └── api-lifecycle-governance/
        ├── _index.md
        ├── deprecation-policy-design.md       (Advanced)
        ├── version-retirement-process.md      (Expert)
        ├── api-changelog-maintenance.md       (Intermediate)
        ├── backward-compatibility-policy.md   (Intermediate)
        ├── breaking-change-process.md         (Intermediate)
        ├── team-api-consistency-rules.md      (Advanced)
        ├── adr-process-for-apis.md            (Expert)
        ├── api-audit-review-process.md        (Enterprise)
        ├── bulk-operation-design.md           (Advanced)
        ├── idempotency-key-design.md          (Advanced)
        ├── idempotency-key-ttl-expiration.md  (Advanced)
        ├── idempotency-key-error-handling.md  (Advanced)
        ├── cors-policy-governance.md          (Intermediate)
        ├── request-size-limits.md             (Intermediate)
        ├── rate-limit-tier-design.md          (Advanced)
        ├── api-usage-tracking.md              (Expert)
        ├── api-style-guide-documentation.md   (Enterprise)
        ├── api-monitoring-alerting.md         (Enterprise)
        └── api-sla-error-budgets.md           (Enterprise)
```

---

# Domain → Subdomain Mapping

| Domain | Subdomain | Example Knowledge Unit |
|--------|-----------|----------------------|
| API & CRUD System Engineering | rest-api-design | http-method-semantics |
| API & CRUD System Engineering | crud-architecture | thin-controller-principle |
| API & CRUD System Engineering | resource-controllers | single-action-invokable-controllers |
| API & CRUD System Engineering | response-structures | envelope-response-design |
| API & CRUD System Engineering | error-handling-design | standardized-error-envelope |
| API & CRUD System Engineering | api-versioning | url-path-versioning |
| API & CRUD System Engineering | api-authentication-authorization | sanctum-vs-passport-decision |
| API & CRUD System Engineering | input-validation-architecture | form-request-design-for-apis |
| API & CRUD System Engineering | pagination-strategies | cursor-pagination-design |
| API & CRUD System Engineering | api-documentation | scramble-integration |
| API & CRUD System Engineering | api-testing | response-shape-testing |
| API & CRUD System Engineering | api-lifecycle-governance | idempotency-key-design |

---

# Future Growth Considerations

## Adding new API standards or formats

When new API response standards emerge (e.g., new RFC replacing RFC 9457, new JSON:API version), add a dedicated leaf node in `response-structures/` or `error-handling-design/`. If the standard affects both, create a cross-reference note in the relevant `_index.md`.

## New authentication strategies

If new official Laravel authentication packages emerge (e.g., Laravel 14 introduces a new API auth system), add a leaf node in `api-authentication-authorization/`. No restructuring needed — the Sanctum vs Passport decision framework simply gains an additional option.

## Versioning evolution

If Laravel introduces native version management (as hinted in Laravel 13 improvements), add leaves in `api-versioning/`. The versioning strategy selection framework adapts by adding the new option alongside URL, header, and media-type strategies.

## New pagination methods

If new pagination patterns emerge (e.g., native keyset support in Laravel), add leaves in `pagination-strategies/`. The strategy selection framework updates to include the new method.

## Documentation tooling

If new documentation generation tools arrive (or Scramble/Scribe merge/evolve), update `api-documentation/` leaves. The "scramble-vs-scribe-selection" decision framework gains the new option.

## Bulk operation patterns

If Laravel introduces first-party bulk/batch endpoint support, add leaves in `api-lifecycle-governance/`. Bulk operation design patterns expand as support grows.

## Cross-domain references

When a Knowledge Unit references another domain (e.g., "rate-limit-tier-design" references details from Security & Identity Engineering), include a cross-reference note rather than duplicating content. The `_index.md` at the domain root lists key cross-domain connections.

## Expansion thresholds

If any subdirectory exceeds 15 files, consider splitting:
- `crud-architecture/` at 15+ → split into `crud-architecture/basic-flows/` and `crud-architecture/advanced-patterns/`
- `error-handling-design/` at 15+ → split by error category (client-errors/, server-errors/)
- `api-testing/` at 20+ → split into `api-testing/feature-tests/` and `api-testing/contract-tests/`
- `api-lifecycle-governance/` at 15+ → split into `api-lifecycle-governance/deprecation/` and `api-lifecycle-governance/operations/`

## No anticipated restructuring

The current 12-subdomain structure is stable. All known API & CRUD System Engineering topics fit within these boundaries. No subdomain is expected to be removed or merged in the foreseeable future. The design-first ordering (foundations → architecture → implementation → lifecycle) matches how teams naturally adopt these concepts.
