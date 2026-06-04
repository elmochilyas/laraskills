# Decision Trees — Route File Organization

## Tree 1: Route File Splitting Strategy

**Decision Context**: How to split route files — per-version, per-module, per-resource, or monolithic.

**Decision Criteria**:
- Number of API versions
- Number of resource endpoints per version
- Team ownership boundaries

**Decision Tree**:
```
Does the API have multiple active versions?
├── YES → Per-version route files: routes/api-v1.php, routes/api-v2.php
└── NO → Does the API have more than 20 endpoints?
    ├── YES → Per-module route files: routes/api/posts.php, routes/api/users.php, etc.
    └── NO → Is the team practicing domain-based ownership?
        ├── YES → Per-module route files aligned with domain boundaries
        └── NO → Single routes/api.php (sufficient for small APIs)
```

**Rationale**: Per-version files provide the clearest diffs for version-specific changes. Per-module files scale for large single-version APIs.

**Recommended Default**: Per-version route files (`routes/api-v1.php`, `routes/api-v2.php`) loaded in RouteServiceProvider via version prefix.

**Risks**: Monolithic route file creates messy diffs. Too many route files create navigation overhead. Mixing per-version and per-module creates confusion.

---

## Tree 2: Route Loading and Deployment

**Decision Context**: How to load route files in production — config-gated loading, environment-based, or always-on.

**Decision Criteria**:
- Version rollout strategy (feature flag, gradual rollout)
- Deployment risk tolerance
- Dead route cleanup requirements

**Decision Tree**:
```
Do you need to control which API versions are active at runtime?
├── YES → Config-gated loading: config('api.versions.v1.active') controls if route file is loaded; enables feature flag rollout
└── NO → Is there a risk of accidentally deploying an incomplete version?
    ├── YES → Config-gated loading with automatic disabling if version config is missing
    └── NO → Always-on loading — all version route files loaded; active version controlled by deprecation middleware
```

**Rationale**: Config-gated loading provides the most control for rollout and emergency disable scenarios. Always-on is simpler but less flexible.

**Recommended Default**: Config-gated loading with `config('api.versions.v1.active')` toggle in RouteServiceProvider.

**Risks**: Config-gated loading without proper defaults may accidentally disable all versions. Always-on loading exposes unreleased versions if not properly protected.
