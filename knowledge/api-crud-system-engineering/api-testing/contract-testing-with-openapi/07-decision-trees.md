# Decision Trees — Contract Testing with OpenAPI

## Tree 1: Contract Validation Approach

**Decision Context**: How to integrate contract testing — auto-validation middleware vs explicit per-test assertions vs CI-only validation.

**Decision Criteria**:
- OpenAPI spec maturity (stable vs frequently changing)
- CI pipeline structure
- Team adoption of spec-first development

**Decision Tree**:
```
Is the OpenAPI spec stable (< 5 changes per month)?
├── YES → Use auto-validation middleware (Spectator or custom middleware) for ALL test requests/responses
└── NO → Is the spec still under active development?
    ├── YES → Use explicit per-test assertions: $response->assertMatchesOpenApiSpec() for critical endpoints only
    └── NO → Validate spec only in CI pipeline (swagger-cli validate); manual contract checks during code review
```

**Rationale**: Auto-validation gives comprehensive coverage but generates noise during spec development. Explicit assertions provide targeted coverage for stable endpoints.

**Recommended Default**: Auto-validation via Spectator middleware for stable specs; explicit assertions during spec development.

**Risks**: Auto-validation on unstable specs creates noisy CI failures that lead to disabling contract checks entirely.

---

## Tree 2: Spec File Versioning

**Decision Context**: How to manage OpenAPI spec files across API versions — single spec vs per-version specs vs combined spec with version tags.

**Decision Criteria**:
- Number of active API versions
- Response shape differences between versions
- Documentation publishing requirements

**Decision Tree**:
```
Do API versions share >80% of response shapes?
├── YES → Single OpenAPI spec with per-path version tags; contract tests validate all version paths against the same spec
└── NO → Do v1 and v2 have significantly different response shapes?
    ├── YES → Per-version spec files (openapi-v1.yaml, openapi-v2.yaml); contract tests target the matching spec per version
    └── NO → Combined spec with components shared; test each version group against the spec's version-tagged paths
```

**Rationale**: Per-version spec files provide clarity when shapes differ significantly. A single spec reduces maintenance when shapes are mostly shared.

**Recommended Default**: Single spec file for similar versions; per-version specs for diverging versions.

**Risks**: Single spec with diverging versions becomes complex. Per-version specs without shared components duplicate effort.
