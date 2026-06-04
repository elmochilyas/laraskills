# Decision Trees — URL Path Versioning

## Tree 1: Version URL Format

**Decision Context**: Choosing the URL path format for versioning — `/api/v1/` vs `/api/v1.0/` vs `/api/2024-01-01/`.

**Decision Criteria**:
- Version granularity (major only vs major.minor)
- Consumer expectation
- API lifecycle policy

**Decision Tree**:
```
Do you use semantic versioning (MAJOR.MINOR.PATCH)?
├── YES → Use major version only in URL: /api/v1/, /api/v2/ (minor/patch via headers or changelog)
└── NO → Do you use date-based versioning (e.g., Stripe)?
    ├── YES → Use date format: /api/2024-01-01/ — clear, chronological, self-documenting
    └── NO → Use major version only in URL — industry standard, simplest, most compatible
```

**Rationale**: Major version only in URL keeps URLs clean and stable within a major version. Date-based versioning is a proven alternative (Stripe).

**Recommended Default**: `/api/v{major}/` — major version only in URL path.

**Risks**: Including minor/patch in URL creates URL churn for non-breaking changes. No version in URL at all forces header-based versioning with different tradeoffs.

---

## Tree 2: Unversioned Request Handling

**Decision Context**: How to handle requests to `/api/` without a version prefix.

**Decision Criteria**:
- API discoverability
- Default version policy
- Consumer onboarding experience

**Decision Tree**:
```
Is there a default "latest" version that new consumers should use?
├── YES → Redirect /api/ to /api/latest/ or return list of available versions at /api/
└── NO → Is the API internal with explicit version requirements?
    ├── YES → Return 400/404 for unversioned requests — version is required
    └── NO → Return list of available versions at /api/ with links and status (active, deprecated, retired)
```

**Rationale**: Unversioned requests should either redirect to the latest version or provide a version directory. Bare 404 without guidance frustrates new developers.

**Recommended Default**: `GET /api` returns a version manifest with supported versions, their status, and links.

**Risks**: Redirecting to latest without warning may silently consume version changes. Returning 404 without guidance leaves developers stuck.
